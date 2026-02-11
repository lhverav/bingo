import { RoundPlayer, CreateRoundPlayerData } from '@bingo/domain';
import { connectToDatabase } from '../database/connection';
import { RoundPlayerModel } from '../database/schemas';
import { RoundPlayerMapper } from '../database/mappers';

/**
 * Repository for RoundPlayer entity
 * Handles all database operations for players in rounds
 */
export class RoundPlayerRepository {
  /**
   * Find a round player by ID
   */
  async findById(id: string): Promise<RoundPlayer | null> {
    await connectToDatabase();
    const doc = await RoundPlayerModel.findById(id);
    return doc ? RoundPlayerMapper.toDomain(doc) : null;
  }

  /**
   * Find a round player by round ID and player code
   */
  async findByRoundAndCode(roundId: string, playerCode: string): Promise<RoundPlayer | null> {
    await connectToDatabase();
    const doc = await RoundPlayerModel.findOne({ roundId, playerCode: playerCode.toUpperCase() });
    return doc ? RoundPlayerMapper.toDomain(doc) : null;
  }

  /**
   * Find all players in a round
   */
  async findByRoundId(roundId: string): Promise<RoundPlayer[]> {
    await connectToDatabase();
    const docs = await RoundPlayerModel.find({ roundId }).sort({ joinedAt: 1 });
    return docs.map(RoundPlayerMapper.toDomain);
  }

  /**
   * Create a new round player
   */
  async create(data: CreateRoundPlayerData): Promise<RoundPlayer> {
    await connectToDatabase();
    const dbData = RoundPlayerMapper.toDatabase(data);
    const doc = await RoundPlayerModel.create(dbData);
    return RoundPlayerMapper.toDomain(doc);
  }

  /**
   * Update player's selected cards and status
   */
  async updateSelection(id: string, selectedCardIds: string[]): Promise<RoundPlayer | null> {
    await connectToDatabase();
    const doc = await RoundPlayerModel.findByIdAndUpdate(
      id,
      { selectedCardIds, lockedCardIds: [], status: 'ready' },  // Clear locks, release unselected
      { new: true }
    );
    return doc ? RoundPlayerMapper.toDomain(doc) : null;
  }

  /**
   * Update player status
   */
  async updateStatus(id: string, status: 'selecting' | 'ready'): Promise<RoundPlayer | null> {
    await connectToDatabase();
    const doc = await RoundPlayerModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    return doc ? RoundPlayerMapper.toDomain(doc) : null;
  }

  /**
   * Count players in a round
   */
  async countByRoundId(roundId: string): Promise<number> {
    await connectToDatabase();
    return RoundPlayerModel.countDocuments({ roundId });
  }

  /**
   * Delete a round player
   */
  async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    const result = await RoundPlayerModel.findByIdAndDelete(id);
    return result !== null;
  }

  /**
   * Delete all players in a round
   */
  async deleteByRoundId(roundId: string): Promise<number> {
    await connectToDatabase();
    const result = await RoundPlayerModel.deleteMany({ roundId });
    return result.deletedCount;
  }
}

// Singleton instance for convenience
export const roundPlayerRepository = new RoundPlayerRepository();
