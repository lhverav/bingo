import { RoundPlayer, CreateRoundPlayerData, BunchCard, Round, Game, GeneralParameters } from '@bingo/domain';
import { roundPlayerRepository, bunchCardRepository, roundRepository, gameRepository, generalParametersRepository } from '../repositories';

/**
 * RoundPlayer service - Business logic for player operations in rounds
 */

/**
 * Helper to get round context: round, game, and general parameters
 */
interface RoundContext {
  round: Round;
  game: Game;
  params: GeneralParameters;
}

async function getRoundContext(roundId: string): Promise<RoundContext | null> {
  const round = await roundRepository.findById(roundId);
  if (!round) return null;

  const game = await gameRepository.findById(round.gameId);
  if (!game) return null;

  const params = await generalParametersRepository.get();

  return { round, game, params };
}

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
 * Generate a unique player code for a round
 * Retries if code already exists in the round
 */
async function generateUniquePlayerCode(roundId: string): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const code = generateCode();
    const existing = await roundPlayerRepository.findByRoundAndCode(roundId, code);
    if (!existing) {
      return code;
    }
    attempts++;
  }

  throw new Error('No se pudo generar un codigo unico para el jugador');
}

/**
 * Get random cards from a bunch that are available (not locked or selected)
 *
 * Card states:
 * - Available: Not in any player's lockedCardIds or selectedCardIds
 * - Temporarily Locked: In a player's lockedCardIds (during selection)
 * - Permanently Assigned: In a player's selectedCardIds (after selection)
 */
async function getAvailableCards(
  bunchId: string,
  roundId: string,
  count: number
): Promise<BunchCard[]> {
  // Get all cards from the bunch
  const allCards = await bunchCardRepository.findByBunchId(bunchId);

  // Get all players in the round to find locked and selected cards
  const players = await roundPlayerRepository.findByRoundId(roundId);
  const unavailableCardIds = new Set<string>();

  for (const player of players) {
    // Exclude BOTH locked AND selected cards
    for (const cardId of player.lockedCardIds) {
      unavailableCardIds.add(cardId);
    }
    for (const cardId of player.selectedCardIds) {
      unavailableCardIds.add(cardId);
    }
  }

  // Filter available cards
  const availableCards = allCards.filter(card => !unavailableCardIds.has(card.id));

  if (availableCards.length < count) {
    throw new Error(`No hay suficientes cartones disponibles. Disponibles: ${availableCards.length}, Requeridos: ${count}`);
  }

  // Shuffle and take the required count
  const shuffled = availableCards.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Input for joining a round
 */
export interface JoinRoundInput {
  roundId: string;
  mobileUserId?: string;  // Link to authenticated user
}

/**
 * Result of joining a round
 */
export interface JoinRoundResult {
  player: RoundPlayer;
  isReconnect: boolean;  // True if returning existing player
}

/**
 * Join a round - creates player record only (no cards yet)
 * Returns existing player if mobileUserId already joined this round
 */
export async function joinRound(input: JoinRoundInput): Promise<JoinRoundResult> {
  const context = await getRoundContext(input.roundId);
  if (!context) {
    throw new Error('Ronda no encontrada');
  }

  const { round } = context;

  if (round.status !== 'en_progreso') {
    throw new Error('La ronda no esta disponible para unirse');
  }

  // Check if this user already joined this round (upsert protection)
  if (input.mobileUserId) {
    const existingPlayer = await roundPlayerRepository.findByRoundAndMobileUser(
      input.roundId,
      input.mobileUserId
    );

    if (existingPlayer) {
      // Return existing player (reconnection scenario)
      return { player: existingPlayer, isReconnect: true };
    }
  }

  // Generate unique player code
  const playerCode = await generateUniquePlayerCode(input.roundId);

  // Create the player (no cards yet, status: 'joined')
  const createData: CreateRoundPlayerData = {
    roundId: input.roundId,
    mobileUserId: input.mobileUserId,
    playerCode,
    // No lockedCardIds - cards come later via requestCards()
    // No selectionDeadline - set when cards are requested
  };

  const player = await roundPlayerRepository.create(createData);

  return { player, isReconnect: false };
}

/**
 * Input for selecting cards
 */
export interface SelectCardsInput {
  playerId: string;
  selectedCardIds: string[];
}

/**
 * Select cards - validates selection, permanently assigns selected cards,
 * and releases unselected cards back to the pool
 */
export async function selectCards(input: SelectCardsInput): Promise<RoundPlayer> {
  const player = await roundPlayerRepository.findById(input.playerId);
  if (!player) {
    throw new Error('Jugador no encontrado');
  }

  if (player.status === 'ready') {
    throw new Error('El jugador ya ha seleccionado sus cartones');
  }

  // Check if selection deadline has passed
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

  // Get round context to check card selection limits
  const context = await getRoundContext(player.roundId);
  if (!context) {
    throw new Error('Configuracion de ronda no encontrada');
  }

  const { params } = context;

  // Validate selection count (at least 1, up to max)
  const maxCards = params.freeCardsToSelect;
  if (input.selectedCardIds.length === 0) {
    throw new Error('Debe seleccionar al menos un carton');
  }
  if (input.selectedCardIds.length > maxCards) {
    throw new Error(`Puede seleccionar maximo ${maxCards} cartones`);
  }

  // Update player: move selected to permanent, clear locked (releases unselected)
  const updated = await roundPlayerRepository.updateSelection(
    input.playerId,
    input.selectedCardIds
  );

  if (!updated) {
    throw new Error('Error al actualizar la seleccion');
  }

  return updated;
}

/**
 * Input for requesting cards
 */
export interface RequestCardsInput {
  playerId: string;
}

/**
 * Result of requesting cards
 */
export interface RequestCardsResult {
  player: RoundPlayer;
  cards: BunchCard[];
  deadline: Date;
}

/**
 * Request cards for a player - locks cards, sets deadline, starts timer
 * Called when player reaches card-selection screen
 */
export async function requestCards(input: RequestCardsInput): Promise<RequestCardsResult> {
  const player = await roundPlayerRepository.findById(input.playerId);
  if (!player) {
    throw new Error('Jugador no encontrado');
  }

  // If player already has cards (selecting), return their current cards
  if (player.status === 'selecting') {
    // Handle edge case: player in 'selecting' but no deadline or no cards (stale data)
    // Reset them to get fresh cards
    if (!player.selectionDeadline || player.lockedCardIds.length === 0) {
      const context = await getRoundContext(player.roundId);
      const cardBunchId = context?.game.cardBunchId;
      if (!context || !cardBunchId) {
        throw new Error('Configuracion de ronda no encontrada');
      }

      const { params } = context;

      // Get NEW cards from the bunch
      const cards = await getAvailableCards(
        cardBunchId,
        player.roundId,
        params.freeCardsDelivered
      );

      const newDeadline = new Date();
      newDeadline.setSeconds(newDeadline.getSeconds() + params.selectionTimeSeconds);

      const updatedPlayer = await roundPlayerRepository.updateForCardRequest(
        input.playerId,
        cards.map(c => c.id),
        newDeadline
      );

      return {
        player: updatedPlayer || player,
        cards,
        deadline: newDeadline,
      };
    }

    // Normal case: player has cards and deadline
    const cards = await getPlayerCards(input.playerId);
    return {
      player,
      cards,
      deadline: player.selectionDeadline,
    };
  }

  if (player.status === 'ready') {
    throw new Error('El jugador ya ha completado la seleccion de cartones');
  }

  // Player must be in 'joined' status to request cards
  if (player.status !== 'joined') {
    throw new Error('Estado de jugador invalido para solicitar cartones');
  }

  // Get round configuration
  const context = await getRoundContext(player.roundId);
  if (!context) {
    throw new Error('Ronda no encontrada');
  }

  const { game, params } = context;

  if (!game.cardBunchId) {
    throw new Error('El juego no tiene un lote de cartones asignado');
  }

  // Get available cards from the bunch (temporarily lock them)
  const cards = await getAvailableCards(
    game.cardBunchId,
    player.roundId,
    params.freeCardsDelivered
  );

  // Calculate selection deadline (starts NOW)
  const selectionDeadline = new Date();
  selectionDeadline.setSeconds(
    selectionDeadline.getSeconds() + params.selectionTimeSeconds
  );

  // Update player: lock cards, set deadline, change status to 'selecting'
  const updatedPlayer = await roundPlayerRepository.updateForCardRequest(
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
  };
}

/**
 * Handle timeout - auto-assign cards for a player who didn't select
 * Releases unselected cards back to the pool
 */
export async function handleTimeout(playerId: string): Promise<RoundPlayer> {
  const player = await roundPlayerRepository.findById(playerId);
  if (!player) {
    throw new Error('Jugador no encontrado');
  }

  if (player.status === 'ready') {
    return player; // Already selected, nothing to do
  }

  // Get round configuration
  const context = await getRoundContext(player.roundId);
  if (!context) {
    throw new Error('Configuracion de ronda no encontrada');
  }

  const { params } = context;

  // Auto-assign the configured number of cards from locked cards
  // Uses freeCardsToSelect as the auto-assign count on timeout
  const autoAssignCount = params.freeCardsToSelect;
  const autoSelectedIds = player.lockedCardIds.slice(0, autoAssignCount);

  // Update player: assign selected, clear locked (releases the rest)
  const updated = await roundPlayerRepository.updateSelection(playerId, autoSelectedIds);

  if (!updated) {
    throw new Error('Error al asignar cartones automaticamente');
  }

  return updated;
}

/**
 * Get all players in a round
 */
export async function getPlayersByRound(roundId: string): Promise<RoundPlayer[]> {
  return roundPlayerRepository.findByRoundId(roundId);
}

/**
 * Get a player by ID
 */
export async function getPlayerById(id: string): Promise<RoundPlayer | null> {
  return roundPlayerRepository.findById(id);
}

/**
 * Get a player by round and code
 */
export async function getPlayerByCode(
  roundId: string,
  playerCode: string
): Promise<RoundPlayer | null> {
  return roundPlayerRepository.findByRoundAndCode(roundId, playerCode);
}

/**
 * Count players in a round
 */
export async function countPlayersInRound(roundId: string): Promise<number> {
  return roundPlayerRepository.countByRoundId(roundId);
}

/**
 * Get cards for a player (returns the actual BunchCard objects)
 */
export async function getPlayerCards(playerId: string): Promise<BunchCard[]> {
  const player = await roundPlayerRepository.findById(playerId);
  if (!player) {
    throw new Error('Jugador no encontrado');
  }

  // Return locked cards if still selecting, selected cards if ready
  const cardIds = player.status === 'selecting'
    ? player.lockedCardIds
    : player.selectedCardIds;

  const cards: BunchCard[] = [];
  for (const cardId of cardIds) {
    const card = await bunchCardRepository.findById(cardId);
    if (card) {
      cards.push(card);
    }
  }

  return cards;
}
