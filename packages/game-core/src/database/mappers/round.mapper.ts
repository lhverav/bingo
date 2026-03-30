import {
  Round,
  CreateRoundData,
  UpdateRoundData,
  LegacyRound,
  LegacyCreateRoundData,
  LegacyUpdateRoundData,
} from '@bingo/domain';
import { RoundDocument } from '../schemas/round.schema';

/**
 * Mapper for Round entity <-> RoundDocument conversion
 * Handles translation between domain and database layers
 * Supports both new structure and legacy structure during migration
 */
export class RoundMapper {
  /**
   * Convert database document to new domain entity
   */
  static toDomain(doc: RoundDocument): Round {
    return {
      id: doc._id.toString(),
      gameId: doc.gameId?.toString() ?? '',
      name: doc.name,
      order: doc.order ?? 1,
      patternId: doc.patternId?.toString() ?? '',
      status: doc.status,
      drawnNumbers: doc.drawnNumbers,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  /**
   * Convert database document to legacy domain entity
   * @deprecated Use toDomain instead
   */
  static toLegacyDomain(doc: RoundDocument): LegacyRound {
    return {
      id: doc._id.toString(),
      name: doc.name,
      cardSize: doc.cardSize ?? 5,
      numberRange: {
        min: doc.minNumber ?? 1,
        max: doc.maxNumber ?? 75,
      },
      gamePattern: doc.gamePattern ?? 'linea',
      startMode: doc.startMode ?? 'manual',
      autoStartDelay: doc.autoStartDelay,
      status: doc.status,
      createdBy: doc.createdBy?.toString() ?? '',
      drawnNumbers: doc.drawnNumbers,
      cardBunchId: doc.cardBunchId?.toString(),
      cardDelivery: doc.cardDelivery
        ? {
            selectionTimeSeconds: doc.cardDelivery.selectionTimeSeconds,
            freeCardsDelivered: doc.cardDelivery.freeCardsDelivered,
            freeCardsToSelect: doc.cardDelivery.freeCardsToSelect,
            freeCardsOnTimeout: doc.cardDelivery.freeCardsOnTimeout,
          }
        : undefined,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  /**
   * Convert new domain entity to database document format
   * Used for creating new documents
   */
  static toDatabase(data: CreateRoundData): Record<string, unknown> {
    return {
      gameId: data.gameId,
      name: data.name,
      order: data.order,
      patternId: data.patternId,
      status: 'configurada',
      drawnNumbers: [],
    };
  }

  /**
   * Convert legacy domain entity to database document format
   * @deprecated Use toDatabase instead
   */
  static toLegacyDatabase(data: LegacyCreateRoundData): Record<string, unknown> {
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
    if (data.order !== undefined) update.order = data.order;
    if (data.patternId !== undefined) update.patternId = data.patternId;

    return update;
  }

  /**
   * Convert legacy update data to database update format
   * @deprecated Use toUpdateDatabase instead
   */
  static toLegacyUpdateDatabase(data: LegacyUpdateRoundData): Record<string, unknown> {
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
