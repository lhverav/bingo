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
   * Convert domain entity to database document format
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
}
