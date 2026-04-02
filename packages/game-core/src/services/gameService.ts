import {
  Game,
  CreateGameData,
  UpdateGameData,
  GameStatus,
  CardType,
  Currency,
} from '@bingo/domain';
import { gameRepository, roundRepository } from '../repositories';

/**
 * Game service - Business logic for game operations
 * Uses GameRepository for data access
 */

/**
 * Service layer input for creating a game
 */
export interface CreateGameInput {
  name: string;
  cardType: CardType;
  cardBunchId?: string;
  scheduledAt: Date;
  createdBy: string;
  isPaid: boolean;
  pricePerCard?: number;
  currency?: Currency;
}

/**
 * Service layer input for updating a game
 */
export interface UpdateGameInput {
  name?: string;
  cardType?: CardType;
  cardBunchId?: string;
  scheduledAt?: Date;
  isPaid?: boolean;
  pricePerCard?: number;
  currency?: Currency;
}

/**
 * Game with round count for list display
 */
export interface GameWithRoundCount extends Game {
  roundCount: number;
}

/**
 * Create a new game
 */
export async function createGame(data: CreateGameInput): Promise<Game> {
  // Business rule: Paid games must have price and currency
  if (data.isPaid && (!data.pricePerCard || !data.currency)) {
    throw new Error('Los juegos pagos requieren precio y moneda');
  }

  // Business rule: Free games should not have price
  if (!data.isPaid && data.pricePerCard) {
    throw new Error('Los juegos gratuitos no deben tener precio');
  }

  const createData: CreateGameData = {
    name: data.name,
    cardType: data.cardType,
    cardBunchId: data.cardBunchId,
    scheduledAt: data.scheduledAt,
    createdBy: data.createdBy,
    isPaid: data.isPaid,
    pricePerCard: data.isPaid ? data.pricePerCard : undefined,
    currency: data.isPaid ? data.currency : undefined,
  };

  return gameRepository.create(createData);
}

/**
 * Get all games
 */
export async function getAllGames(): Promise<Game[]> {
  return gameRepository.findAll();
}

/**
 * Get all games with round count
 */
export async function getAllGamesWithRoundCount(): Promise<GameWithRoundCount[]> {
  const games = await gameRepository.findAll();
  const gamesWithCount: GameWithRoundCount[] = [];

  for (const game of games) {
    const roundCount = await roundRepository.countByGameId(game.id);
    gamesWithCount.push({ ...game, roundCount });
  }

  return gamesWithCount;
}

/**
 * Get games by status
 */
export async function getGamesByStatus(status: GameStatus): Promise<Game[]> {
  return gameRepository.findByStatus(status);
}

/**
 * Get games by user ID
 */
export async function getGamesByUser(userId: string): Promise<Game[]> {
  return gameRepository.findByUserId(userId);
}

/**
 * Get upcoming scheduled games
 */
export async function getUpcomingGames(): Promise<Game[]> {
  return gameRepository.findUpcoming();
}

/**
 * Get a game by ID
 */
export async function getGameById(id: string): Promise<Game | null> {
  return gameRepository.findById(id);
}

/**
 * Update a game (only if status is 'scheduled')
 */
export async function updateGame(
  id: string,
  data: UpdateGameInput
): Promise<Game | null> {
  const game = await gameRepository.findById(id);
  if (!game) return null;

  // Business rule: Only allow editing if game is scheduled
  if (game.status !== 'scheduled') {
    throw new Error('Solo se pueden editar juegos que no han iniciado');
  }

  // Determine what isPaid will be after update
  const willBePaid = data.isPaid !== undefined ? data.isPaid : game.isPaid;
  const newPricePerCard = data.pricePerCard !== undefined ? data.pricePerCard : game.pricePerCard;
  const newCurrency = data.currency !== undefined ? data.currency : game.currency;

  // Business rule: Paid games must have price and currency
  if (willBePaid && (!newPricePerCard || !newCurrency)) {
    throw new Error('Los juegos pagos requieren precio y moneda');
  }

  const updateData: UpdateGameData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.cardType !== undefined) updateData.cardType = data.cardType;
  if (data.cardBunchId !== undefined) updateData.cardBunchId = data.cardBunchId;
  if (data.scheduledAt !== undefined) updateData.scheduledAt = data.scheduledAt;
  if (data.isPaid !== undefined) updateData.isPaid = data.isPaid;
  if (data.pricePerCard !== undefined) updateData.pricePerCard = data.pricePerCard;
  if (data.currency !== undefined) updateData.currency = data.currency;

  return gameRepository.update(id, updateData);
}

/**
 * Start a game (change status to 'active')
 * Note: Rounds can be created before or after the game starts (on the fly)
 */
export async function startGame(id: string): Promise<Game | null> {
  const game = await gameRepository.findById(id);
  if (!game) return null;

  // Business rule: Can only start if status is 'scheduled'
  if (game.status !== 'scheduled') {
    throw new Error('Este juego ya ha sido iniciado o finalizado');
  }

  return gameRepository.updateStatus(id, 'active');
}

/**
 * Finish a game (change status to 'finished')
 */
export async function finishGame(id: string): Promise<Game | null> {
  const game = await gameRepository.findById(id);
  if (!game) return null;

  // Business rule: Can only finish if status is 'active'
  if (game.status !== 'active') {
    throw new Error('Solo se pueden finalizar juegos activos');
  }

  return gameRepository.updateStatus(id, 'finished');
}

/**
 * Cancel a game (change status to 'cancelled')
 */
export async function cancelGame(id: string): Promise<Game | null> {
  const game = await gameRepository.findById(id);
  if (!game) return null;

  // Business rule: Cannot cancel finished games
  if (game.status === 'finished') {
    throw new Error('No se pueden cancelar juegos finalizados');
  }

  return gameRepository.updateStatus(id, 'cancelled');
}

/**
 * Delete a game (only if status is 'scheduled' or 'cancelled')
 */
export async function deleteGame(id: string): Promise<boolean> {
  const game = await gameRepository.findById(id);
  if (!game) return false;

  // Business rule: Only allow deleting scheduled or cancelled games
  if (game.status !== 'scheduled' && game.status !== 'cancelled') {
    throw new Error('Solo se pueden eliminar juegos programados o cancelados');
  }

  // Delete all rounds for this game
  await roundRepository.deleteByGameId(id);

  return gameRepository.delete(id);
}
