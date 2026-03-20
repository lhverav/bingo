import { RoundStatus } from '../value-objects';

/**
 * Currency options for paid rounds
 */
export type Currency = 'USD' | 'COP';

export const CURRENCY_LABELS: Record<Currency, string> = {
  USD: 'Dólares (USD)',
  COP: 'Pesos Colombianos (COP)',
};

export const ALL_CURRENCIES: Currency[] = ['USD', 'COP'];

/**
 * Round entity - Pure domain object
 * Represents a bingo game round within a Game
 */
export interface Round {
  id: string;
  gameId: string;              // Reference to parent Game
  name: string;
  order: number;               // Sequence within game (1, 2, 3...)
  patternId: string;           // Reference to Pattern
  isPaid: boolean;             // Free or paid round
  pricePerCard?: number;       // If paid: price per card
  currency?: Currency;         // If paid: currency
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
  isPaid: boolean;
  pricePerCard?: number;
  currency?: Currency;
}

/**
 * Data allowed when updating a round
 */
export interface UpdateRoundData {
  name?: string;
  order?: number;
  patternId?: string;
  isPaid?: boolean;
  pricePerCard?: number;
  currency?: Currency;
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
