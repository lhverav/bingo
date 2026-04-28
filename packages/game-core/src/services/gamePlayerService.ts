import { GamePlayer, CreateGamePlayerData, JoinGameResult, BunchCard, Game, GeneralParameters } from '@bingo/domain';
import { gamePlayerRepository, gameRepository, bunchCardRepository, generalParametersRepository } from '../repositories';

/**
 * GamePlayer service - Business logic for player operations in games
 *
 * In the new game flow:
 * - Players join a GAME (not a round)
 * - Cards are selected per-game for FREE rounds
 * - Cards are purchased per-round for PAID rounds
 */

/**
 * Generate a unique 4-character alphanumeric player code
 * Format: A-Z and 0-9, e.g., "A7X9", "B3K2"
 */
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars: I, O, 0, 1
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generate a unique player code for a game
 * Retries if code already exists in the game
 */
async function generateUniquePlayerCode(gameId: string): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const code = generateCode();
    const existing = await gamePlayerRepository.findByGameAndCode(gameId, code);
    if (!existing) {
      return code;
    }
    attempts++;
  }

  throw new Error('No se pudo generar un codigo unico para el jugador');
}

/**
 * Input for joining a game
 */
export interface JoinGameInput {
  gameId: string;
  mobileUserId?: string;  // Link to authenticated user
}

/**
 * Join a game - creates player record
 * Returns existing player if mobileUserId already joined this game
 */
export async function joinGame(input: JoinGameInput): Promise<JoinGameResult> {
  // Verify the game exists
  const game = await gameRepository.findById(input.gameId);
  if (!game) {
    throw new Error('Juego no encontrado');
  }

  // Check game status - can only join scheduled or active games
  if (game.status !== 'scheduled' && game.status !== 'active') {
    throw new Error('El juego no esta disponible para unirse');
  }

  // Check if this user already joined this game (reconnection scenario)
  if (input.mobileUserId) {
    const existingPlayer = await gamePlayerRepository.findByGameAndMobileUser(
      input.gameId,
      input.mobileUserId
    );

    if (existingPlayer) {
      // Return existing player (reconnection scenario)
      return { player: existingPlayer, isReconnect: true };
    }
  }

  // Generate unique player code
  const playerCode = await generateUniquePlayerCode(input.gameId);

  // Create the player (no cards yet, status: 'joined')
  const createData: CreateGamePlayerData = {
    gameId: input.gameId,
    mobileUserId: input.mobileUserId,
    playerCode,
  };

  const player = await gamePlayerRepository.create(createData);

  return { player, isReconnect: false };
}

/**
 * Get all players in a game
 */
export async function getPlayersByGame(gameId: string): Promise<GamePlayer[]> {
  return gamePlayerRepository.findByGameId(gameId);
}

/**
 * Get a game player by ID
 */
export async function getGamePlayerById(id: string): Promise<GamePlayer | null> {
  return gamePlayerRepository.findById(id);
}

/**
 * Get a game player by game and code
 */
export async function getGamePlayerByCode(
  gameId: string,
  playerCode: string
): Promise<GamePlayer | null> {
  return gamePlayerRepository.findByGameAndCode(gameId, playerCode);
}

/**
 * Get a game player by game and mobile user
 */
export async function getGamePlayerByMobileUser(
  gameId: string,
  mobileUserId: string
): Promise<GamePlayer | null> {
  return gamePlayerRepository.findByGameAndMobileUser(gameId, mobileUserId);
}

/**
 * Count players in a game
 */
export async function countPlayersInGame(gameId: string): Promise<number> {
  return gamePlayerRepository.countByGameId(gameId);
}

/**
 * Update player status
 */
export async function updateGamePlayerStatus(
  playerId: string,
  status: 'joined' | 'cards_selected' | 'playing'
): Promise<GamePlayer | null> {
  return gamePlayerRepository.updateStatus(playerId, status);
}

/**
 * Leave a game - removes the player from the game
 * Can leave from any game state (cleanup for finished/cancelled games)
 */
export async function leaveGame(gameId: string, mobileUserId: string): Promise<boolean> {
  // Find the player (game may or may not exist - allow cleanup either way)
  const player = await gamePlayerRepository.findByGameAndMobileUser(gameId, mobileUserId);
  if (!player) {
    // Player not found - maybe already cleaned up, return success
    return true;
  }

  // Delete the player
  return gamePlayerRepository.delete(player.id);
}

/**
 * Get all games a user has joined
 */
export async function getJoinedGames(mobileUserId: string): Promise<GamePlayer[]> {
  return gamePlayerRepository.findByMobileUserId(mobileUserId);
}

// ============================================================================
// CARD SELECTION FUNCTIONS
// ============================================================================

/**
 * Helper to get game context: game and general parameters
 */
interface GameContext {
  game: Game;
  params: GeneralParameters;
}

async function getGameContext(gameId: string): Promise<GameContext | null> {
  const game = await gameRepository.findById(gameId);
  if (!game) return null;

  const params = await generalParametersRepository.get();
  return { game, params };
}

/**
 * Get available cards from a game's CardBunch
 * Excludes cards that are locked or selected by other players
 */
async function getAvailableCardsForGame(
  bunchId: string,
  gameId: string,
  count: number
): Promise<BunchCard[]> {
  const allCards = await bunchCardRepository.findByBunchId(bunchId);
  const players = await gamePlayerRepository.findByGameId(gameId);
  const unavailableCardIds = new Set<string>();

  for (const player of players) {
    for (const cardId of player.lockedCardIds) {
      unavailableCardIds.add(cardId);
    }
    for (const cardId of player.cardIds) {
      unavailableCardIds.add(cardId);
    }
  }

  const availableCards = allCards.filter(card => !unavailableCardIds.has(card.id));

  if (availableCards.length < count) {
    throw new Error(`No hay suficientes cartones disponibles. Disponibles: ${availableCards.length}, Requeridos: ${count}`);
  }

  const shuffled = availableCards.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Input for requesting game cards
 */
export interface RequestGameCardsInput {
  playerId: string;
}

/**
 * Result of requesting game cards
 */
export interface RequestGameCardsResult {
  player: GamePlayer;
  cards: BunchCard[];
  deadline: Date;
  isChangingCards: boolean;
  maxSelectable: number;
}

/**
 * Request cards for a game player - locks cards, sets deadline
 * If player already has cards, this starts a "change cards" flow
 */
export async function requestGameCards(input: RequestGameCardsInput): Promise<RequestGameCardsResult> {
  const player = await gamePlayerRepository.findById(input.playerId);
  if (!player) {
    throw new Error('Jugador no encontrado');
  }

  const context = await getGameContext(player.gameId);
  if (!context) {
    throw new Error('Juego no encontrado');
  }

  const { game, params } = context;

  // Check if player is currently locked (round in progress)
  if (player.cardsLocked) {
    throw new Error('No puedes cambiar cartones durante una ronda activa');
  }

  // Check if player is already selecting
  if (player.status === 'selecting') {
    // If has valid deadline and locked cards, return current state
    if (player.selectionDeadline && player.lockedCardIds.length > 0) {
      const cards = await getPlayerGameCards(input.playerId);
      return {
        player,
        cards,
        deadline: player.selectionDeadline,
        isChangingCards: player.cardIds.length > 0,
        maxSelectable: params.freeCardsToSelect,
      };
    }
    // Otherwise fall through to get fresh cards
  }

  if (!game.cardBunchId) {
    throw new Error('El juego no tiene un lote de cartones asignado');
  }

  const isChangingCards = player.cardIds.length > 0;

  // Get available cards
  const cards = await getAvailableCardsForGame(
    game.cardBunchId,
    player.gameId,
    params.freeCardsDelivered
  );

  // Calculate deadline
  const selectionDeadline = new Date();
  selectionDeadline.setSeconds(
    selectionDeadline.getSeconds() + params.selectionTimeSeconds
  );

  // Update player
  const updatedPlayer = await gamePlayerRepository.updateForCardRequest(
    input.playerId,
    cards.map(c => c.id),
    selectionDeadline
  );

  if (!updatedPlayer) {
    throw new Error('Error al asignar cartones al jugador');
  }

  return {
    player: updatedPlayer,
    cards,
    deadline: selectionDeadline,
    isChangingCards,
    maxSelectable: params.freeCardsToSelect,
  };
}

/**
 * Input for selecting game cards
 */
export interface SelectGameCardsInput {
  playerId: string;
  selectedCardIds: string[];
}

/**
 * Select cards for a game player - confirms selection
 */
export async function selectGameCards(input: SelectGameCardsInput): Promise<GamePlayer> {
  const player = await gamePlayerRepository.findById(input.playerId);
  if (!player) {
    throw new Error('Jugador no encontrado');
  }

  if (player.status === 'cards_selected' || player.status === 'playing') {
    throw new Error('El jugador ya ha seleccionado sus cartones');
  }

  if (player.selectionDeadline && new Date() > player.selectionDeadline) {
    throw new Error('El tiempo de seleccion ha expirado');
  }

  // Validate selected cards are from locked cards
  const lockedSet = new Set(player.lockedCardIds);
  for (const cardId of input.selectedCardIds) {
    if (!lockedSet.has(cardId)) {
      throw new Error('Carton seleccionado no esta disponible para este jugador');
    }
  }

  // Get params for validation
  const context = await getGameContext(player.gameId);
  if (!context) {
    throw new Error('Configuracion de juego no encontrada');
  }

  const { params } = context;
  const maxCards = params.freeCardsToSelect;

  if (input.selectedCardIds.length === 0) {
    throw new Error('Debe seleccionar al menos un carton');
  }
  if (input.selectedCardIds.length > maxCards) {
    throw new Error(`Puede seleccionar maximo ${maxCards} cartones`);
  }

  const updated = await gamePlayerRepository.updateSelection(
    input.playerId,
    input.selectedCardIds
  );

  if (!updated) {
    throw new Error('Error al actualizar la seleccion');
  }

  return updated;
}

/**
 * Handle timeout for game card selection
 * - First time: auto-assign max cards
 * - Changing cards: keep previous cards
 */
export async function handleGameCardTimeout(playerId: string): Promise<GamePlayer> {
  const player = await gamePlayerRepository.findById(playerId);
  if (!player) {
    throw new Error('Jugador no encontrado');
  }

  if (player.status === 'cards_selected' || player.status === 'playing') {
    return player; // Already selected
  }

  const hadPreviousCards = player.cardIds.length > 0;

  if (hadPreviousCards) {
    // Changing cards scenario: keep previous cards, cancel change
    const updated = await gamePlayerRepository.updateSelection(
      playerId,
      player.cardIds // Keep existing cards
    );
    if (!updated) {
      throw new Error('Error al cancelar cambio de cartones');
    }
    return updated;
  } else {
    // First time selection: auto-assign max cards
    const context = await getGameContext(player.gameId);
    if (!context) {
      throw new Error('Configuracion de juego no encontrada');
    }

    const autoAssignCount = context.params.freeCardsToSelect;
    const autoSelectedIds = player.lockedCardIds.slice(0, autoAssignCount);

    const updated = await gamePlayerRepository.updateSelection(playerId, autoSelectedIds);
    if (!updated) {
      throw new Error('Error al asignar cartones automaticamente');
    }
    return updated;
  }
}

/**
 * Get cards for a game player (returns the actual BunchCard objects)
 */
export async function getPlayerGameCards(playerId: string): Promise<BunchCard[]> {
  const player = await gamePlayerRepository.findById(playerId);
  if (!player) {
    throw new Error('Jugador no encontrado');
  }

  // Return locked cards if selecting, cardIds if already selected
  const cardIds = player.status === 'selecting'
    ? player.lockedCardIds
    : player.cardIds;

  const cards: BunchCard[] = [];
  for (const cardId of cardIds) {
    const card = await bunchCardRepository.findById(cardId);
    if (card) {
      cards.push(card);
    }
  }

  return cards;
}
