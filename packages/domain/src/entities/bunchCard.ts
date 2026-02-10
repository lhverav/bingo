/**
 * Represents a pre-generated bingo card stored in a CardBunch
 * These cards are templates that get assigned to players when they join a round
 */
export interface BunchCard {
  /** Unique identifier */
  id: string;

  /** Reference to the parent CardBunch */
  bunchId: string;

  /** Position in the bunch (0-based), used for ordering */
  index: number;

  /** The card grid - 2D array of numbers (0 = free space) */
  cells: number[][];

  /** When the card was created */
  createdAt: Date;
}

/**
 * Data needed to create a new BunchCard
 */
export interface CreateBunchCardData {
  bunchId: string;
  index: number;
  cells: number[][];
}
