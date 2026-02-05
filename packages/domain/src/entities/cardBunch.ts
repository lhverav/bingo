/**
 * A pre-generated set of bingo cards with shared dimensions
 */
export interface CardBunch {
  id: string;
  name: string;
  cardSize: number;
  maxNumber: number; // numbers are always 1 to maxNumber
  cards: number[][][]; // each card is a 2D grid; 0 = free center
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data required to persist a new card bunch
 */
export interface CreateCardBunchData {
  name: string;
  cardSize: number;
  maxNumber: number;
  cards: number[][][];
}
