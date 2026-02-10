/**
 * A pre-generated set of bingo cards with shared dimensions
 */
export interface CardBunch {
  id: string;
  name: string;
  cardSize: number;
  maxNumber: number; // numbers are always 1 to maxNumber
  cards: number[][][]; // Legacy: embedded cards (empty for new bunches)
  cardCount?: number;  // New: count of cards in BunchCard collection
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
