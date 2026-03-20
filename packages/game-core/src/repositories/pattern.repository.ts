import { Pattern, CreatePatternData, UpdatePatternData, CardType } from '@bingo/domain';
import { connectToDatabase } from '../database/connection';
import { PatternModel } from '../database/schemas/pattern.schema';
import { PatternMapper } from '../database/mappers/pattern.mapper';

/**
 * Repository for Pattern entity
 * Handles all database operations for patterns
 */
export class PatternRepository {
  /**
   * Find a pattern by ID
   */
  async findById(id: string): Promise<Pattern | null> {
    await connectToDatabase();
    const doc = await PatternModel.findById(id);
    return doc ? PatternMapper.toDomain(doc) : null;
  }

  /**
   * Find all patterns
   */
  async findAll(): Promise<Pattern[]> {
    await connectToDatabase();
    const docs = await PatternModel.find().sort({ isPreset: -1, name: 1 });
    return docs.map(PatternMapper.toDomain);
  }

  /**
   * Find patterns by card type
   */
  async findByCardType(cardType: CardType): Promise<Pattern[]> {
    await connectToDatabase();
    const docs = await PatternModel.find({ cardType }).sort({ isPreset: -1, name: 1 });
    return docs.map(PatternMapper.toDomain);
  }

  /**
   * Find preset patterns by card type
   */
  async findPresetsByCardType(cardType: CardType): Promise<Pattern[]> {
    await connectToDatabase();
    const docs = await PatternModel.find({ cardType, isPreset: true }).sort({ name: 1 });
    return docs.map(PatternMapper.toDomain);
  }

  /**
   * Find custom patterns by card type
   */
  async findCustomByCardType(cardType: CardType): Promise<Pattern[]> {
    await connectToDatabase();
    const docs = await PatternModel.find({ cardType, isPreset: false }).sort({ name: 1 });
    return docs.map(PatternMapper.toDomain);
  }

  /**
   * Create a new pattern
   */
  async create(data: CreatePatternData): Promise<Pattern> {
    await connectToDatabase();
    const dbData = PatternMapper.toDatabase(data);
    const doc = await PatternModel.create(dbData);
    return PatternMapper.toDomain(doc);
  }

  /**
   * Update a pattern
   */
  async update(id: string, data: UpdatePatternData): Promise<Pattern | null> {
    await connectToDatabase();
    const dbData = PatternMapper.toUpdateDatabase(data);
    const doc = await PatternModel.findByIdAndUpdate(id, dbData, {
      new: true,
      runValidators: true,
    });
    return doc ? PatternMapper.toDomain(doc) : null;
  }

  /**
   * Delete a pattern (only non-preset patterns can be deleted)
   */
  async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    const result = await PatternModel.findOneAndDelete({ _id: id, isPreset: false });
    return result !== null;
  }

  /**
   * Find by name and card type (for uniqueness check)
   */
  async findByNameAndCardType(name: string, cardType: CardType): Promise<Pattern | null> {
    await connectToDatabase();
    const doc = await PatternModel.findOne({ name, cardType });
    return doc ? PatternMapper.toDomain(doc) : null;
  }
}

// Singleton instance for convenience
export const patternRepository = new PatternRepository();
