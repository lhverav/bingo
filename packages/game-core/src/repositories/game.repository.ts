import { Game, CreateGameData, UpdateGameData, GameStatus } from '@bingo/domain';
import { connectToDatabase } from '../database/connection';
import { GameModel } from '../database/schemas/game.schema';
import { GameMapper } from '../database/mappers/game.mapper';

/**
 * Repository for Game entity
 * Handles all database operations for games
 */
export class GameRepository {
  /**
   * Find a game by ID
   */
  async findById(id: string): Promise<Game | null> {
    await connectToDatabase();
    const doc = await GameModel.findById(id);
    return doc ? GameMapper.toDomain(doc) : null;
  }

  /**
   * Find all games
   */
  async findAll(): Promise<Game[]> {
    await connectToDatabase();
    const docs = await GameModel.find().sort({ scheduledAt: -1 });
    return docs.map(GameMapper.toDomain);
  }

  /**
   * Find games by status
   */
  async findByStatus(status: GameStatus): Promise<Game[]> {
    await connectToDatabase();
    const docs = await GameModel.find({ status }).sort({ scheduledAt: 1 });
    return docs.map(GameMapper.toDomain);
  }

  /**
   * Find games by user ID
   */
  async findByUserId(userId: string): Promise<Game[]> {
    await connectToDatabase();
    const docs = await GameModel.find({ createdBy: userId }).sort({ scheduledAt: -1 });
    return docs.map(GameMapper.toDomain);
  }

  /**
   * Find upcoming scheduled games
   */
  async findUpcoming(): Promise<Game[]> {
    await connectToDatabase();
    const docs = await GameModel.find({
      status: 'scheduled',
      scheduledAt: { $gte: new Date() },
    }).sort({ scheduledAt: 1 });
    return docs.map(GameMapper.toDomain);
  }

  /**
   * Create a new game
   */
  async create(data: CreateGameData): Promise<Game> {
    await connectToDatabase();
    const dbData = GameMapper.toDatabase(data);
    const doc = await GameModel.create(dbData);
    return GameMapper.toDomain(doc);
  }

  /**
   * Update a game
   */
  async update(id: string, data: UpdateGameData): Promise<Game | null> {
    await connectToDatabase();
    const dbData = GameMapper.toUpdateDatabase(data);
    const doc = await GameModel.findByIdAndUpdate(id, dbData, {
      new: true,
      runValidators: true,
    });
    return doc ? GameMapper.toDomain(doc) : null;
  }

  /**
   * Update game status
   */
  async updateStatus(id: string, status: GameStatus): Promise<Game | null> {
    await connectToDatabase();
    const doc = await GameModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    return doc ? GameMapper.toDomain(doc) : null;
  }

  /**
   * Delete a game
   */
  async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    const result = await GameModel.findByIdAndDelete(id);
    return result !== null;
  }

  /**
   * Find the currently published game
   * Only one game can be published at a time
   */
  async findPublished(): Promise<Game | null> {
    await connectToDatabase();
    const doc = await GameModel.findOne({
      isPublished: true,
      status: { $in: ['scheduled', 'active'] },
    });
    return doc ? GameMapper.toDomain(doc) : null;
  }

  /**
   * Set published status for a game
   */
  async setPublished(id: string, isPublished: boolean): Promise<Game | null> {
    await connectToDatabase();
    const doc = await GameModel.findByIdAndUpdate(
      id,
      { isPublished },
      { new: true }
    );
    return doc ? GameMapper.toDomain(doc) : null;
  }

  /**
   * Unpublish all games
   * Used before publishing a new game to ensure only one is published
   */
  async unpublishAll(): Promise<void> {
    await connectToDatabase();
    await GameModel.updateMany(
      { isPublished: true },
      { isPublished: false }
    );
  }
}

// Singleton instance for convenience
export const gameRepository = new GameRepository();
