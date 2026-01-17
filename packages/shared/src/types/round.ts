/**
 * Patrones de juego disponibles
 * Based on: casos de uso.pdf - Crear Ronda
 */
export type GamePattern =
  | 'linea'      // Línea horizontal
  | 'columna'    // Línea vertical
  | 'diagonal'   // Diagonal
  | 'completo'   // Cartón completo
  | 'especial';  // Figuras especiales

/**
 * Modo de inicio de la ronda
 */
export type StartMode = 'manual' | 'automatico';

/**
 * Estado de una ronda
 */
export type RoundStatus =
  | 'configurada'  // Created, not started
  | 'activa'       // In progress
  | 'finalizada'   // Completed
  | 'cancelada';   // Cancelled

/**
 * Configuración de una ronda de bingo
 * Based on: casos de uso.pdf - Crear Ronda
 */
export interface RoundConfig {
  /** Nombre identificador de la ronda */
  name: string;

  /** Tamaño de la carta (ej: 5 para 5x5) */
  cardSize: number;

  /** Rango de números disponibles */
  numberRange: {
    min: number;
    max: number;
  };

  /** Patrón de juego para ganar */
  pattern: GamePattern;

  /** Modo de inicio */
  startMode: StartMode;

  /** Tiempo en segundos antes de iniciar (solo si startMode es 'automatico') */
  autoStartDelay?: number;
}

/**
 * Ronda completa con estado y metadata
 */
export interface Round {
  id: string;
  config: RoundConfig;
  status: RoundStatus;
  createdAt: Date;
  startedAt?: Date;
  finishedAt?: Date;

  /** Números que han sido cantados */
  calledNumbers: number[];

  /** IDs de jugadores conectados */
  playerIds: string[];

  /** ID del ganador (si hay) */
  winnerId?: string;
}
