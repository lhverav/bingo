import { CardBunch, CreateCardBunchData } from '@bingo/domain';
import { CardBunchDocument } from '../schemas/cardBunch.schema';

/**
 * Mapper for CardBunch entity <-> CardBunchDocument conversion
 * Handles translation between domain and database layers
 */
export class CardBunchMapper {
  /**
   * Convert database document to domain entity
   */
  static toDomain(doc: CardBunchDocument): CardBunch {
    return {
      id: doc._id.toString(),
      name: doc.name,
      cardSize: doc.cardSize,
      maxNumber: doc.maxNumber,
      cards: doc.cards,
      cardCount: doc.cardCount,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  /**
   * Convert domain entity to database document format
   * Used for creating new documents
   */
  static toDatabase(data: CreateCardBunchData): Record<string, unknown> {
    return {
      name: data.name,
      cardSize: data.cardSize,
      maxNumber: data.maxNumber,
      cards: data.cards,
    };
  }
}
