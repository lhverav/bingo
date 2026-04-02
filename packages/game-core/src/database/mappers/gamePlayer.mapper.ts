import { GamePlayer, CreateGamePlayerData, UpdateGamePlayerData } from '@bingo/domain';
import { GamePlayerDocument } from '../schemas/gamePlayer.schema';

/**
 * GamePlayer Mapper
 * Converts between domain entities and database documents
 */
export class GamePlayerMapper {
  /**
   * Convert database document to domain entity
   */
  static toDomain(doc: GamePlayerDocument): GamePlayer {
    return {
      id: doc._id.toString(),
      gameId: doc.gameId.toString(),
      mobileUserId: doc.mobileUserId?.toString(),
      playerCode: doc.playerCode,
      status: doc.status,
      cardIds: doc.cardIds.map((id) => id.toString()),
      lockedCardIds: doc.lockedCardIds?.map((id) => id.toString()) || [],
      hasPaid: doc.hasPaid,
      paidAt: doc.paidAt,
      cardsLocked: doc.cardsLocked,
      selectionDeadline: doc.selectionDeadline,
      joinedAt: doc.joinedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  /**
   * Convert create data to database document format
   */
  static toDatabase(data: CreateGamePlayerData): Record<string, unknown> {
    return {
      gameId: data.gameId,
      mobileUserId: data.mobileUserId,
      playerCode: data.playerCode,
      status: 'joined',
      cardIds: [],
      lockedCardIds: [],
      hasPaid: false,
      cardsLocked: false,
      joinedAt: new Date(),
    };
  }

  /**
   * Convert update data to database update format
   * Only includes fields that are present in the update data
   */
  static toUpdateDatabase(data: UpdateGamePlayerData): Record<string, unknown> {
    const update: Record<string, unknown> = {};

    if (data.status !== undefined) update.status = data.status;
    if (data.cardIds !== undefined) update.cardIds = data.cardIds;
    if (data.lockedCardIds !== undefined) update.lockedCardIds = data.lockedCardIds;
    if (data.hasPaid !== undefined) update.hasPaid = data.hasPaid;
    if (data.paidAt !== undefined) update.paidAt = data.paidAt;
    if (data.cardsLocked !== undefined) update.cardsLocked = data.cardsLocked;
    if (data.selectionDeadline !== undefined) update.selectionDeadline = data.selectionDeadline;

    return update;
  }
}
