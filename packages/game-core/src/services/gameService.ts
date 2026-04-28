import {
  Game,
  CreateGameData,
  UpdateGameData,
  GameStatus,
  CardType,
  Currency,
} from '@bingo/domain';
import { gameRepository, roundRepository, gamePlayerRepository } from '../repositories';

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
 * Auto-publishes the game if not already published
 */
export async function startGame(id: string): Promise<Game | null> {
  const game = await gameRepository.findById(id);
  if (!game) return null;

  // Business rule: Can only start if status is 'scheduled'
  if (game.status !== 'scheduled') {
    throw new Error('Este juego ya ha sido iniciado o finalizado');
  }

  // Auto-publish when starting (if not already published)
  if (!game.isPublished) {
    const publishResult = await publishGame(id);
    if (!publishResult.success) {
      throw new Error(publishResult.error || 'No se pudo publicar el juego');
    }
  }

  return gameRepository.updateStatus(id, 'active');
}

/**
 * Finish a game (change status to 'finished')
 * Auto-unpublishes the game and removes all players
 */
export async function finishGame(id: string): Promise<Game | null> {
  const game = await gameRepository.findById(id);
  if (!game) return null;

  // Business rule: Can only finish if status is 'active'
  if (game.status !== 'active') {
    throw new Error('Solo se pueden finalizar juegos activos');
  }

  // Auto-unpublish when finishing
  if (game.isPublished) {
    await gameRepository.setPublished(id, false);
  }

  // Remove all players from the game (cleanup)
  const deletedCount = await gamePlayerRepository.deleteByGameId(id);
  console.log(`[gameService] Removed ${deletedCount} players from finished game ${id}`);

  return gameRepository.updateStatus(id, 'finished');
}

/**
 * Cancel a game (change status to 'cancelled')
 * Auto-unpublishes the game and removes all players
 */
export async function cancelGame(id: string): Promise<Game | null> {
  const game = await gameRepository.findById(id);
  if (!game) return null;

  // Business rule: Cannot cancel finished games
  if (game.status === 'finished') {
    throw new Error('No se pueden cancelar juegos finalizados');
  }

  // Auto-unpublish when cancelling
  if (game.isPublished) {
    await gameRepository.setPublished(id, false);
  }

  // Remove all players from the game (cleanup)
  const deletedCount = await gamePlayerRepository.deleteByGameId(id);
  console.log(`[gameService] Removed ${deletedCount} players from cancelled game ${id}`);

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

  // Business rule: Cannot delete published game
  if (game.isPublished) {
    throw new Error('No se puede eliminar un juego publicado. Despublíquelo primero.');
  }

  // Delete all rounds for this game
  await roundRepository.deleteByGameId(id);

  return gameRepository.delete(id);
}

// ============================================================================
// PUBLISH / UNPUBLISH FUNCTIONS
// ============================================================================

/**
 * Result type for publish/unpublish operations
 */
export interface PublishResult {
  success: boolean;
  error?: string;
  game?: Game;
}

/**
 * Get the currently published game
 * Only one game can be published at a time
 */
export async function getPublishedGame(): Promise<Game | null> {
  return gameRepository.findPublished();
}

/**
 * Publish a game (make it visible to mobile players)
 *
 * Rules:
 * - Only scheduled or active games can be published
 * - Cannot publish if another game has players
 * - Publishing unpublishes any other game (if it has no players)
 */
export async function publishGame(id: string): Promise<PublishResult> {
  const game = await gameRepository.findById(id);
  if (!game) {
    return { success: false, error: 'Juego no encontrado' };
  }

  // Rule: Only scheduled or active games can be published
  if (game.status !== 'scheduled' && game.status !== 'active') {
    return { success: false, error: 'Solo se pueden publicar juegos programados o activos' };
  }

  // Rule: Already published
  if (game.isPublished) {
    return { success: true, game };
  }

  // Check if another game is published
  const currentPublished = await gameRepository.findPublished();
  if (currentPublished && currentPublished.id !== id) {
    // Check if the currently published game has players
    const playerCount = await gamePlayerRepository.countByGameId(currentPublished.id);
    if (playerCount > 0) {
      return {
        success: false,
        error: `No se puede publicar: "${currentPublished.name}" tiene ${playerCount} jugador(es) unidos`,
      };
    }

    // Unpublish the other game (no players)
    await gameRepository.setPublished(currentPublished.id, false);
  }

  // Publish this game
  const updatedGame = await gameRepository.setPublished(id, true);
  return { success: true, game: updatedGame || game };
}

/**
 * Unpublish a game (hide from mobile players)
 *
 * Rules:
 * - Cannot unpublish an active game
 * - Cannot unpublish if game has players
 */
export async function unpublishGame(id: string): Promise<PublishResult> {
  console.log('[gameService] unpublishGame - starting for id:', id);

  const game = await gameRepository.findById(id);
  console.log('[gameService] unpublishGame - game found:', !!game);

  if (!game) {
    return { success: false, error: 'Juego no encontrado' };
  }

  // Rule: Already unpublished
  if (!game.isPublished) {
    console.log('[gameService] unpublishGame - already unpublished');
    return { success: true, game };
  }

  // Rule: Cannot unpublish active game
  if (game.status === 'active') {
    console.log('[gameService] unpublishGame - cannot unpublish active game');
    return { success: false, error: 'No se puede despublicar un juego en curso' };
  }

  // Rule: Cannot unpublish if has players
  console.log('[gameService] unpublishGame - checking player count...');
  const playerCount = await gamePlayerRepository.countByGameId(id);
  console.log('[gameService] unpublishGame - player count:', playerCount);

  if (playerCount > 0) {
    return {
      success: false,
      error: `No se puede despublicar: ${playerCount} jugador(es) ya unidos`,
    };
  }

  console.log('[gameService] unpublishGame - setting published to false...');
  const updatedGame = await gameRepository.setPublished(id, false);
  console.log('[gameService] unpublishGame - done');
  return { success: true, game: updatedGame || game };
}
