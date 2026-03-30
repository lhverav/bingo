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

// ============================================================================
// LEGACY TYPES - Keep for backwards compatibility during migration
// These will be removed after migration is complete
// ============================================================================

import { GamePattern, StartMode } from '../value-objects';

/**
 * @deprecated Use GeneralParameters instead
 */
export interface CardDeliveryConfig {
  selectionTimeSeconds: number;
  freeCardsDelivered: number;
  freeCardsToSelect: number;
  freeCardsOnTimeout: number;
}

/**
 * @deprecated Legacy Round structure
 */
export interface LegacyRound {
  id: string;
  name: string;
  cardSize: number;
  numberRange: {
    min: number;
    max: number;
  };
  gamePattern: GamePattern;
  startMode: StartMode;
  autoStartDelay?: number;
  status: RoundStatus;
  createdBy: string;
  drawnNumbers: number[];
  cardBunchId?: string;
  cardDelivery?: CardDeliveryConfig;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @deprecated Legacy create data
 */
export interface LegacyCreateRoundData {
  name: string;
  cardSize: number;
  numberRange: {
    min: number;
    max: number;
  };
  gamePattern: GamePattern;
  startMode: StartMode;
  autoStartDelay?: number;
  createdBy: string;
  cardBunchId?: string;
  cardDelivery?: CardDeliveryConfig;
}

/**
 * @deprecated Legacy update data
 */
export interface LegacyUpdateRoundData {
  name?: string;
  cardSize?: number;
  numberRange?: {
    min: number;
    max: number;
  };
  gamePattern?: GamePattern;
  startMode?: StartMode;
  autoStartDelay?: number;
  cardBunchId?: string;
  cardDelivery?: CardDeliveryConfig;
}
