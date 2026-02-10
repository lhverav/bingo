import { BunchCard, CreateBunchCardData } from '@bingo/domain';
import { BunchCardDocument } from '../schemas/bunchCard.schema';

/**
 * Mapper for BunchCard entity <-> BunchCardDocument conversion
 * Handles translation between domain and database layers
 */
export class BunchCardMapper {
  /**
   * Convert database document to domain entity
   */
  static toDomain(doc: BunchCardDocument): BunchCard {
    return {
      id: doc._id.toString(),
      bunchId: doc.bunchId.toString(),
      index: doc.index,
      cells: doc.cells,
      createdAt: doc.createdAt,
    };
  }

  /**
   * Convert domain data to database document format
   * Used for creating new documents
   */
  static toDatabase(data: CreateBunchCardData): Record<string, unknown> {
    return {
      bunchId: data.bunchId,
      index: data.index,
      cells: data.cells,
    };
  }

  /**
   * Convert array of domain data to database format
   * Used for bulk inserts
   */
  static toDatabaseMany(dataArray: CreateBunchCardData[]): Record<string, unknown>[] {
    return dataArray.map((data) => BunchCardMapper.toDatabase(data));
  }
}
