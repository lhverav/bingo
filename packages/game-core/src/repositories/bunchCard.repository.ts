import { BunchCard, CreateBunchCardData } from '@bingo/domain';
import { connectToDatabase } from '../database/connection';
import { BunchCardModel } from '../database/schemas/bunchCard.schema';
import { BunchCardMapper } from '../database/mappers/bunchCard.mapper';

/**
 * Repository for BunchCard entity
 * Handles all database operations for individual cards in a bunch
 */
export class BunchCardRepository {
  /**
   * Find a card by ID
   */
  async findById(id: string): Promise<BunchCard | null> {
    await connectToDatabase();
    const doc = await BunchCardModel.findById(id);
    return doc ? BunchCardMapper.toDomain(doc) : null;
  }

  /**
   * Find all cards belonging to a bunch
   */
  async findByBunchId(bunchId: string): Promise<BunchCard[]> {
    await connectToDatabase();
    const docs = await BunchCardModel.find({ bunchId }).sort({ index: 1 });
    return docs.map(BunchCardMapper.toDomain);
  }

  /**
   * Find cards by bunch with pagination
   */
  async findByBunchIdPaginated(
    bunchId: string,
    skip: number,
    limit: number
  ): Promise<BunchCard[]> {
    await connectToDatabase();
    const docs = await BunchCardModel.find({ bunchId })
      .sort({ index: 1 })
      .skip(skip)
      .limit(limit);
    return docs.map(BunchCardMapper.toDomain);
  }

  /**
   * Insert many cards at once (used for chunked generation)
   * This is the key method for efficient bulk inserts
   */
  async insertMany(dataArray: CreateBunchCardData[]): Promise<number> {
    await connectToDatabase();
    const dbData = BunchCardMapper.toDatabaseMany(dataArray);
    const result = await BunchCardModel.insertMany(dbData);
    return result.length;
  }

  /**
   * Count cards in a bunch
   */
  async countByBunchId(bunchId: string): Promise<number> {
    await connectToDatabase();
    return BunchCardModel.countDocuments({ bunchId });
  }

  /**
   * Delete all cards belonging to a bunch
   */
  async deleteByBunchId(bunchId: string): Promise<number> {
    await connectToDatabase();
    const result = await BunchCardModel.deleteMany({ bunchId });
    return result.deletedCount;
  }
}

// Singleton instance for convenience
export const bunchCardRepository = new BunchCardRepository();
