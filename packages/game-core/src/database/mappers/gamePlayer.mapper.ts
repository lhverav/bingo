import { GamePlayer, CreateGamePlayerData, PaidRoundCards } from '@bingo/domain';
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
      freeCardIds: doc.freeCardIds.map((id) => id.toString()),
      paidRoundCards: doc.paidRoundCards.map((prc) => ({
        roundId: prc.roundId.toString(),
        cardIds: prc.cardIds.map((id) => id.toString()),
        purchasedAt: prc.purchasedAt,
      })),
      freeCardsLocked: doc.freeCardsLocked.map((id) => id.toString()),
      freeSelectionDeadline: doc.freeSelectionDeadline,
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
      freeCardIds: [],
      paidRoundCards: [],
      freeCardsLocked: [],
      joinedAt: new Date(),
    };
  }
}
