import { GamePattern, RoundStatus, StartMode } from '../value-objects';

/**
 * Round entity - Pure domain object
 * Represents a bingo game round configuration and state
 */
export interface Round {
  id: string;
  name: string;
  cardSize: number;
  numberRange: {
    min: number;
    max: number;
  };
  gamePattern: GamePattern;
  startMode: StartMode;
  autoStartDelay?: number; // in seconds, only if startMode is 'automatico'
  status: RoundStatus;
  createdBy: string; // User ID
  drawnNumbers: number[];
  cardBunchId?: string; // Optional reference to pre-generated card bunch
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data required to create a new round
 */
export interface CreateRoundData {
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
}

/**
 * Data allowed when updating a round
 */
export interface UpdateRoundData {
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
}
