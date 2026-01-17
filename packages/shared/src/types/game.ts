/**
 * Jugador en una ronda
 */
export interface Player {
  id: string;
  name: string;

  /** ID de la ronda actual (si está en una) */
  currentRoundId?: string;

  /** Estado de conexión */
  connected: boolean;
}

/**
 * Evento de juego para sincronización en tiempo real
 */
export type GameEventType =
  | 'round_started'
  | 'number_called'
  | 'player_joined'
  | 'player_left'
  | 'bingo_claimed'
  | 'bingo_verified'
  | 'round_ended';

export interface GameEvent {
  type: GameEventType;
  roundId: string;
  timestamp: Date;
  payload: Record<string, unknown>;
}

/**
 * Estado del juego para sincronización
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
