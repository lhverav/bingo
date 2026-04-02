import { RoundStatus } from '../value-objects';

/**
 * Round entity - Pure domain object
 * Represents a bingo game round within a Game
 *
 * Note: Payment info (isPaid, pricePerCard, currency) is now at the GAME level,
 * not the round level. All rounds in a game share the same payment configuration.
 */
export interface Round {
  id: string;
  gameId: string;              // Reference to parent Game
  name: string;
  order: number;               // Sequence within game (1, 2, 3...)
  patternId: string;           // Reference to Pattern
  status: RoundStatus;
  drawnNumbers: number[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data required to create a new round
 */
export interface CreateRoundData {
  gameId: string;
  name: string;
  order: number;
  patternId: string;
}

/**
 * Data allowed when updating a round
 */
export interface UpdateRoundData {
  name?: string;
  order?: number;
  patternId?: string;
}

/**
 * Round with expanded pattern info (for display)
 */
export interface RoundWithPattern extends Round {
  patternName?: string;
  patternCells?: boolean[][];
}
