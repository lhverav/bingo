import { Round, CreateRoundData, UpdateRoundData } from '@bingo/domain';
import { RoundDocument } from '../schemas/round.schema';

/**
 * Mapper for Round entity <-> RoundDocument conversion
 * Handles translation between domain and database layers
 */
export class RoundMapper {
  /**
   * Convert database document to domain entity
   */
  static toDomain(doc: RoundDocument): Round {
    return {
      id: doc._id.toString(),
      name: doc.name,
      cardSize: doc.cardSize,
      numberRange: {
        min: doc.minNumber,
        max: doc.maxNumber,
      },
      gamePattern: doc.gamePattern,
      startMode: doc.startMode,
      autoStartDelay: doc.autoStartDelay,
      status: doc.status,
      createdBy: doc.createdBy.toString(),
      drawnNumbers: doc.drawnNumbers,
      cardBunchId: doc.cardBunchId?.toString(),
      cardDelivery: doc.cardDelivery ? {
        selectionTimeSeconds: doc.cardDelivery.selectionTimeSeconds,
        freeCardsDelivered: doc.cardDelivery.freeCardsDelivered,
        freeCardsToSelect: doc.cardDelivery.freeCardsToSelect,
        freeCardsOnTimeout: doc.cardDelivery.freeCardsOnTimeout,
      } : undefined,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  /**
   * Convert domain entity to database document format
   * Used for creating new documents
   */
  static toDatabase(data: CreateRoundData): Record<string, unknown> {
    return {
      name: data.name,
      cardSize: data.cardSize,
      minNumber: data.numberRange.min,
      maxNumber: data.numberRange.max,
      gamePattern: data.gamePattern,
      startMode: data.startMode,
      autoStartDelay: data.autoStartDelay,
      status: 'configurada',
      createdBy: data.createdBy,
      drawnNumbers: [],
      cardBunchId: data.cardBunchId,
      cardDelivery: data.cardDelivery,
    };
  }

  /**
   * Convert update data to database update format
   * Only includes fields that are present in the update data
   */
  static toUpdateDatabase(data: UpdateRoundData): Record<string, unknown> {
    const update: Record<string, unknown> = {};

    if (data.name !== undefined) update.name = data.name;
    if (data.cardSize !== undefined) update.cardSize = data.cardSize;
    if (data.numberRange !== undefined) {
      update.minNumber = data.numberRange.min;
      update.maxNumber = data.numberRange.max;
    }
    if (data.gamePattern !== undefined) update.gamePattern = data.gamePattern;
    if (data.startMode !== undefined) update.startMode = data.startMode;
    if (data.autoStartDelay !== undefined) update.autoStartDelay = data.autoStartDelay;
    if (data.cardBunchId !== undefined) update.cardBunchId = data.cardBunchId;
    if (data.cardDelivery !== undefined) update.cardDelivery = data.cardDelivery;

    return update;
  }
}
