import { CardBunch, CreateCardBunchData, CardType } from '@bingo/domain';
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
      cardType: doc.cardType as CardType,
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
      cardType: data.cardType,
      cardCount: 0, // Will be updated as cards are generated
    };
  }
}
