import { GamePlayer, CreateGamePlayerData, GamePlayerStatus } from '@bingo/domain';
import { GamePlayerModel } from '../database/schemas/gamePlayer.schema';
import { GamePlayerMapper } from '../database/mappers/gamePlayer.mapper';
import { connectToDatabase, mongoose } from '../database/connection';

/**
 * GamePlayer Repository
 * Handles database operations for GamePlayer entities
 */
class GamePlayerRepository {
  /**
   * Find a game player by ID
   */
  async findById(id: string): Promise<GamePlayer | null> {
    await connectToDatabase();
    const doc = await GamePlayerModel.findById(id);
    return doc ? GamePlayerMapper.toDomain(doc) : null;
  }

  /**
   * Find all players in a game
   */
  async findByGameId(gameId: string): Promise<GamePlayer[]> {
    await connectToDatabase();
    const docs = await GamePlayerModel.find({ gameId }).sort({ joinedAt: 1 });
    return docs.map(GamePlayerMapper.toDomain);
  }

  /**
   * Find a player by game and mobile user
   */
  async findByGameAndMobileUser(
    gameId: string,
    mobileUserId: string
  ): Promise<GamePlayer | null> {
    await connectToDatabase();
    const doc = await GamePlayerModel.findOne({ gameId, mobileUserId });
    return doc ? GamePlayerMapper.toDomain(doc) : null;
  }

  /**
   * Find a player by game and player code
   */
  async findByGameAndCode(
    gameId: string,
    playerCode: string
  ): Promise<GamePlayer | null> {
    await connectToDatabase();
    const doc = await GamePlayerModel.findOne({ gameId, playerCode });
    return doc ? GamePlayerMapper.toDomain(doc) : null;
  }

  /**
   * Count players in a game
   */
  async countByGameId(gameId: string): Promise<number> {
    console.log('[gamePlayerRepository] countByGameId - connecting to database...');
    const conn = await connectToDatabase();

    // Check connection state
    console.log('[gamePlayerRepository] countByGameId - connection state:', conn.connection.readyState);

    // Convert string to ObjectId
    const objectId = new mongoose.Types.ObjectId(gameId);
    console.log('[gamePlayerRepository] countByGameId - querying gameId:', objectId.toString());

    try {
      // Add timeout to query
      const count = await GamePlayerModel.countDocuments({ gameId: objectId }).maxTimeMS(5000);
      console.log('[gamePlayerRepository] countByGameId - result:', count);
      return count;
    } catch (error) {
      console.error('[gamePlayerRepository] countByGameId - query error:', error);
      // If collection doesn't exist, return 0
      if ((error as Error).message?.includes('doesn\'t exist')) {
        return 0;
      }
      throw error;
    }
  }

  /**
   * Create a new game player
   */
  async create(data: CreateGamePlayerData): Promise<GamePlayer> {
    await connectToDatabase();
    const dbData = GamePlayerMapper.toDatabase(data);
    const doc = await GamePlayerModel.create(dbData);
    return GamePlayerMapper.toDomain(doc);
  }

  /**
   * Update player status
   */
  async updateStatus(
    id: string,
    status: GamePlayerStatus
  ): Promise<GamePlayer | null> {
    await connectToDatabase();
    const doc = await GamePlayerModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    return doc ? GamePlayerMapper.toDomain(doc) : null;
  }

  /**
   * Update player for card request - locks cards, sets deadline, status='selecting'
   */
  async updateForCardRequest(
    id: string,
    lockedCardIds: string[],
    selectionDeadline: Date
  ): Promise<GamePlayer | null> {
    await connectToDatabase();
    const doc = await GamePlayerModel.findByIdAndUpdate(
      id,
      {
        lockedCardIds,
        selectionDeadline,
        status: 'selecting',
      },
      { new: true }
    );
    return doc ? GamePlayerMapper.toDomain(doc) : null;
  }

  /**
   * Update player selection - confirms cards, clears locked, status='cards_selected'
   */
  async updateSelection(
    id: string,
    selectedCardIds: string[]
  ): Promise<GamePlayer | null> {
    await connectToDatabase();
    const doc = await GamePlayerModel.findByIdAndUpdate(
      id,
      {
        cardIds: selectedCardIds,
        lockedCardIds: [],
        selectionDeadline: null,
        status: 'cards_selected',
      },
      { new: true }
    );
    return doc ? GamePlayerMapper.toDomain(doc) : null;
  }

  /**
   * Delete a game player
   */
  async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    const result = await GamePlayerModel.findByIdAndDelete(id);
    return !!result;
  }

  /**
   * Delete all players in a game
   */
  async deleteByGameId(gameId: string): Promise<number> {
    await connectToDatabase();
    const result = await GamePlayerModel.deleteMany({ gameId });
    return result.deletedCount || 0;
  }

  /**
   * Find all games a mobile user has joined
   */
  async findByMobileUserId(mobileUserId: string): Promise<GamePlayer[]> {
    await connectToDatabase();
    const docs = await GamePlayerModel.find({ mobileUserId }).sort({ joinedAt: -1 });
    return docs.map(GamePlayerMapper.toDomain);
  }
}

export const gamePlayerRepository = new GamePlayerRepository();
