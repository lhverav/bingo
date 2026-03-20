import { Pattern, CreatePatternData, UpdatePatternData } from '@bingo/domain';
import { PatternDocument } from '../schemas/pattern.schema';

/**
 * Mapper for Pattern entity <-> PatternDocument conversion
 * Handles translation between domain and database layers
 */
export class PatternMapper {
  /**
   * Convert database document to domain entity
   */
  static toDomain(doc: PatternDocument): Pattern {
    return {
      id: doc._id.toString(),
      name: doc.name,
      cardType: doc.cardType,
      cells: doc.cells,
      isPreset: doc.isPreset,
      createdBy: doc.createdBy?.toString(),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  /**
   * Convert domain entity to database document format
   * Used for creating new documents
   */
  static toDatabase(data: CreatePatternData): Record<string, unknown> {
    return {
      name: data.name,
      cardType: data.cardType,
      cells: data.cells,
      isPreset: data.isPreset ?? false,
      createdBy: data.createdBy,
    };
  }

  /**
   * Convert update data to database update format
   * Only includes fields that are present in the update data
   */
  static toUpdateDatabase(data: UpdatePatternData): Record<string, unknown> {
    const update: Record<string, unknown> = {};

    if (data.name !== undefined) update.name = data.name;
    if (data.cells !== undefined) update.cells = data.cells;

    return update;
  }
}
