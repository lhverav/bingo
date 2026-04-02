import { Game, CreateGameData, UpdateGameData } from '@bingo/domain';
import { GameDocument } from '../schemas/game.schema';

/**
 * Mapper for Game entity <-> GameDocument conversion
 * Handles translation between domain and database layers
 */
export class GameMapper {
  /**
   * Convert database document to domain entity
   */
  static toDomain(doc: GameDocument): Game {
    return {
      id: doc._id.toString(),
      name: doc.name,
      cardType: doc.cardType,
      cardBunchId: doc.cardBunchId?.toString(),
      scheduledAt: doc.scheduledAt,
      status: doc.status,
      createdBy: doc.createdBy.toString(),
      isPaid: doc.isPaid,
      pricePerCard: doc.pricePerCard,
      currency: doc.currency,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  /**
   * Convert domain entity to database document format
   * Used for creating new documents
   */
  static toDatabase(data: CreateGameData): Record<string, unknown> {
    return {
      name: data.name,
      cardType: data.cardType,
      cardBunchId: data.cardBunchId,
      scheduledAt: data.scheduledAt,
      status: 'scheduled',
      createdBy: data.createdBy,
      isPaid: data.isPaid,
      pricePerCard: data.pricePerCard,
      currency: data.currency,
    };
  }

  /**
   * Convert update data to database update format
   * Only includes fields that are present in the update data
   */
  static toUpdateDatabase(data: UpdateGameData): Record<string, unknown> {
    const update: Record<string, unknown> = {};

    if (data.name !== undefined) update.name = data.name;
    if (data.cardType !== undefined) update.cardType = data.cardType;
    if (data.cardBunchId !== undefined) update.cardBunchId = data.cardBunchId;
    if (data.scheduledAt !== undefined) update.scheduledAt = data.scheduledAt;
    if (data.status !== undefined) update.status = data.status;
    if (data.isPaid !== undefined) update.isPaid = data.isPaid;
    if (data.pricePerCard !== undefined) update.pricePerCard = data.pricePerCard;
    if (data.currency !== undefined) update.currency = data.currency;

    return update;
  }
}
