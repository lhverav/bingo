import { Round, CreateRoundData, UpdateRoundData, RoundStatus } from '@bingo/domain';
import { connectToDatabase } from '../database/connection';
import { RoundModel } from '../database/schemas/round.schema';
import { RoundMapper } from '../database/mappers/round.mapper';

/**
 * Repository for Round entity
 * Handles all database operations for rounds
 */
export class RoundRepository {
  /**
   * Find a round by ID
   */
  async findById(id: string): Promise<Round | null> {
    await connectToDatabase();
    const doc = await RoundModel.findById(id);
    return doc ? RoundMapper.toDomain(doc) : null;
  }

  /**
   * Find all rounds by game ID (new structure)
   */
  async findByGameId(gameId: string): Promise<Round[]> {
    await connectToDatabase();
    const docs = await RoundModel.find({ gameId }).sort({ order: 1 });
    return docs.map(RoundMapper.toDomain);
  }

  /**
   * Find all rounds by user ID (legacy)
   * @deprecated Use findByGameId instead
   */
  async findByUserId(userId: string): Promise<Round[]> {
    await connectToDatabase();
    const docs = await RoundModel.find({ createdBy: userId }).sort({ createdAt: -1 });
    return docs.map(RoundMapper.toDomain);
  }

  /**
   * Find all rounds
   */
  async findAll(): Promise<Round[]> {
    await connectToDatabase();
    const docs = await RoundModel.find().sort({ createdAt: -1 });
    return docs.map(RoundMapper.toDomain);
  }

  /**
   * Get the next order number for a game
   */
  async getNextOrder(gameId: string): Promise<number> {
    await connectToDatabase();
    const lastRound = await RoundModel.findOne({ gameId }).sort({ order: -1 });
    return lastRound ? (lastRound.order ?? 0) + 1 : 1;
  }

  /**
   * Create a new round
   */
  async create(data: CreateRoundData): Promise<Round> {
    await connectToDatabase();
    const dbData = RoundMapper.toDatabase(data);
    const doc = await RoundModel.create(dbData);
    return RoundMapper.toDomain(doc);
  }

  /**
   * Update a round
   */
  async update(id: string, data: UpdateRoundData): Promise<Round | null> {
    await connectToDatabase();
    const dbData = RoundMapper.toUpdateDatabase(data);
    const doc = await RoundModel.findByIdAndUpdate(id, dbData, {
      new: true,
      runValidators: true,
    });
    return doc ? RoundMapper.toDomain(doc) : null;
  }

  /**
   * Update round status
   */
  async updateStatus(id: string, status: RoundStatus): Promise<Round | null> {
    await connectToDatabase();
    const doc = await RoundModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    return doc ? RoundMapper.toDomain(doc) : null;
  }

  /**
   * Add a drawn number to a round
   */
  async addDrawnNumber(id: string, number: number): Promise<Round | null> {
    await connectToDatabase();
    const doc = await RoundModel.findByIdAndUpdate(
      id,
      { $push: { drawnNumbers: number } },
      { new: true }
    );
    return doc ? RoundMapper.toDomain(doc) : null;
  }

  /**
   * Clear drawn numbers (for reset)
   */
  async clearDrawnNumbers(id: string): Promise<Round | null> {
    await connectToDatabase();
    const doc = await RoundModel.findByIdAndUpdate(
      id,
      { drawnNumbers: [] },
      { new: true }
    );
    return doc ? RoundMapper.toDomain(doc) : null;
  }

  /**
   * Delete a round
   */
  async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    const result = await RoundModel.findByIdAndDelete(id);
    return result !== null;
  }

  /**
   * Delete all rounds for a game
   */
  async deleteByGameId(gameId: string): Promise<number> {
    await connectToDatabase();
    const result = await RoundModel.deleteMany({ gameId });
    return result.deletedCount;
  }

  /**
   * Count rounds in a game
   */
  async countByGameId(gameId: string): Promise<number> {
    await connectToDatabase();
    return RoundModel.countDocuments({ gameId });
  }
}

// Singleton instance for convenience
export const roundRepository = new RoundRepository();
