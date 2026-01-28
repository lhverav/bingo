/**
 * Individual cell in a bingo card
 */
export interface CardCell {
  number: number | null; // null for free space
  marked: boolean;
  row: number;
  col: number;
}

/**
 * Card entity - Pure domain object
 * Represents a player's bingo card in a round
 */
export interface Card {
  id: string;
  playerId: string;
  roundId: string;
  size: number;
  cells: CardCell[][];
  bingoClaimed: boolean;
  createdAt: Date;
}

/**
 * Parameters for generating a new card
 */
export interface CreateCardData {
  playerId: string;
  roundId: string;
  size: number;
  numberRange: {
    min: number;
    max: number;
  };
  hasFreeCenter: boolean;
}
