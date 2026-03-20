import {
  Game,
  CreateGameData,
  UpdateGameData,
  GameStatus,
  CardType,
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
  scheduledAt: Date;
  createdBy: string;
}

/**
 * Service layer input for updating a game
 */
export interface UpdateGameInput {
  name?: string;
  cardType?: CardType;
  scheduledAt?: Date;
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
  const createData: CreateGameData = {
    name: data.name,
    cardType: data.cardType,
    scheduledAt: data.scheduledAt,
    createdBy: data.createdBy,
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

  const updateData: UpdateGameData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.cardType !== undefined) updateData.cardType = data.cardType;
  if (data.scheduledAt !== undefined) updateData.scheduledAt = data.scheduledAt;

  return gameRepository.update(id, updateData);
}

/**
 * Start a game (change status to 'active')
 */
export async function startGame(id: string): Promise<Game | null> {
  const game = await gameRepository.findById(id);
  if (!game) return null;

  // Business rule: Can only start if status is 'scheduled'
  if (game.status !== 'scheduled') {
    throw new Error('Este juego ya ha sido iniciado o finalizado');
  }

  // Business rule: Game must have at least one round
  const roundCount = await roundRepository.countByGameId(id);
  if (roundCount === 0) {
    throw new Error('El juego debe tener al menos una ronda');
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
