import { CardType } from '../value-objects/card-type';

/**
 * A pre-generated set of bingo cards
 * Cards are stored separately in BunchCard collection
 */
export interface CardBunch {
  id: string;
  name: string;
  cardType: CardType;    // 'bingo' or 'bingote'
  cardCount: number;     // Number of cards in BunchCard collection
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data required to create a new card bunch
 */
export interface CreateCardBunchData {
  name: string;
  cardType: CardType;
}
