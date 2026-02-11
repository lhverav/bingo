import { RoundPlayer, CreateRoundPlayerData } from '@bingo/domain';
import { RoundPlayerDocument } from '../schemas/roundPlayer.schema';

/**
 * Mapper for RoundPlayer entity <-> RoundPlayerDocument conversion
 * Handles translation between domain and database layers
 */
export class RoundPlayerMapper {
  /**
   * Convert database document to domain entity
   */
  static toDomain(doc: RoundPlayerDocument): RoundPlayer {
    return {
      id: doc._id.toString(),
      roundId: doc.roundId.toString(),
      playerCode: doc.playerCode,
      status: doc.status,
      lockedCardIds: doc.lockedCardIds.map((id) => id.toString()),
      selectedCardIds: doc.selectedCardIds.map((id) => id.toString()),
      selectionDeadline: doc.selectionDeadline,
      joinedAt: doc.joinedAt,
    };
  }

  /**
   * Convert domain entity to database document format
   * Used for creating new documents
   */
  static toDatabase(data: CreateRoundPlayerData): Record<string, unknown> {
    return {
      roundId: data.roundId,
      playerCode: data.playerCode,
      status: 'selecting',
      lockedCardIds: data.lockedCardIds,
      selectedCardIds: [],
      selectionDeadline: data.selectionDeadline,
      joinedAt: new Date(),
    };
  }
}
