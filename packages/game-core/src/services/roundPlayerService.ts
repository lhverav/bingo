import { RoundPlayer, CreateRoundPlayerData, BunchCard } from '@bingo/domain';
import { roundPlayerRepository, roundRepository, bunchCardRepository } from '../repositories';

/**
 * RoundPlayer service - Business logic for player operations in rounds
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
}

/**
 * Result of joining a round
 */
export interface JoinRoundResult {
  player: RoundPlayer;
  cards: BunchCard[];
}

/**
 * Join a round - creates player, temporarily locks cards, sets deadline
 */
export async function joinRound(input: JoinRoundInput): Promise<JoinRoundResult> {
  const round = await roundRepository.findById(input.roundId);
  if (!round) {
    throw new Error('Ronda no encontrada');
  }

  if (round.status !== 'en_progreso') {
    throw new Error('La ronda no esta disponible para unirse');
  }

  if (!round.cardBunchId) {
    throw new Error('La ronda no tiene un lote de cartones asignado');
  }

  if (!round.cardDelivery) {
    throw new Error('La ronda no tiene configuracion de entrega de cartones');
  }

  // Generate unique player code
  const playerCode = await generateUniquePlayerCode(input.roundId);

  // Get available cards from the bunch (temporarily lock them)
  const cards = await getAvailableCards(
    round.cardBunchId,
    input.roundId,
    round.cardDelivery.freeCardsDelivered
  );

  // Calculate selection deadline
  const selectionDeadline = new Date();
  selectionDeadline.setSeconds(
    selectionDeadline.getSeconds() + round.cardDelivery.selectionTimeSeconds
  );

  // Create the player with locked cards
  const createData: CreateRoundPlayerData = {
    roundId: input.roundId,
    playerCode,
    lockedCardIds: cards.map(c => c.id),  // Temporarily locked
    selectionDeadline,
  };

  const player = await roundPlayerRepository.create(createData);

  return { player, cards };
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
  if (new Date() > player.selectionDeadline) {
    throw new Error('El tiempo de seleccion ha expirado');
  }

  // Validate selected cards are from locked cards
  const lockedSet = new Set(player.lockedCardIds);
  for (const cardId of input.selectedCardIds) {
    if (!lockedSet.has(cardId)) {
      throw new Error('Carton seleccionado no esta disponible para este jugador');
    }
  }

  // Get round to check card selection limits
  const round = await roundRepository.findById(player.roundId);
  if (!round?.cardDelivery) {
    throw new Error('Configuracion de ronda no encontrada');
  }

  // Validate selection count
  if (input.selectedCardIds.length !== round.cardDelivery.freeCardsToSelect) {
    throw new Error(
      `Debe seleccionar exactamente ${round.cardDelivery.freeCardsToSelect} cartones`
    );
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
  const round = await roundRepository.findById(player.roundId);
  if (!round?.cardDelivery) {
    throw new Error('Configuracion de ronda no encontrada');
  }

  // Auto-assign the configured number of cards from locked cards
  const autoAssignCount = round.cardDelivery.freeCardsOnTimeout;
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
