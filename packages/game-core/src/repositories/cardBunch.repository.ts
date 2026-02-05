import { CardBunch, CreateCardBunchData } from '@bingo/domain';
import { connectToDatabase } from '../database/connection';
import { CardBunchModel } from '../database/schemas/cardBunch.schema';
import { CardBunchMapper } from '../database/mappers/cardBunch.mapper';

/**
 * Repository for CardBunch entity
 * Handles all database operations for card bunches
 */
export class CardBunchRepository {
  /**
   * Find a card bunch by ID
   */
  async findById(id: string): Promise<CardBunch | null> {
    await connectToDatabase();
    const doc = await CardBunchModel.findById(id);
    return doc ? CardBunchMapper.toDomain(doc) : null;
  }

  /**
   * Find all card bunches
   */
  async findAll(): Promise<CardBunch[]> {
    await connectToDatabase();
    const docs = await CardBunchModel.find().sort({ createdAt: -1 });
    return docs.map(CardBunchMapper.toDomain);
  }

  /**
   * Find card bunches by dimensions (cardSize and maxNumber)
   * This is the key query for matching bunches to round configuration
   */
  async findByDimensions(cardSize: number, maxNumber: number): Promise<CardBunch[]> {
    await connectToDatabase();
    const docs = await CardBunchModel.find({ cardSize, maxNumber }).sort({ name: 1 });
    return docs.map(CardBunchMapper.toDomain);
  }

  /**
   * Create a new card bunch
   */
  async create(data: CreateCardBunchData): Promise<CardBunch> {
    await connectToDatabase();
    const dbData = CardBunchMapper.toDatabase(data);
    const doc = await CardBunchModel.create(dbData);
    return CardBunchMapper.toDomain(doc);
  }

  /**
   * Delete a card bunch
   */
  async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    const result = await CardBunchModel.findByIdAndDelete(id);
    return result !== null;
  }
}

// Singleton instance for convenience
export const cardBunchRepository = new CardBunchRepository();
