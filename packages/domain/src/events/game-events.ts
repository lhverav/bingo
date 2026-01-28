/**
 * Game event types for real-time synchronization
 * These are NOT persisted - they are used for Socket.io communication
 */
export type GameEventType =
  | 'round_started'
  | 'number_called'
  | 'player_joined'
  | 'player_left'
  | 'bingo_claimed'
  | 'bingo_verified'
  | 'round_ended';

/**
 * Game event structure for real-time communication
 */
export interface GameEvent {
  type: GameEventType;
  roundId: string;
  timestamp: Date;
  payload: Record<string, unknown>;
}

/**
 * Current game state for synchronization
 * Used to sync mobile clients with current game state
 */
export interface GameState {
  round: {
    id: string;
    status: string;
    calledNumbers: number[];
    currentNumber?: number;
  };
  players: {
    id: string;
    name: string;
    connected: boolean;
  }[];
}
