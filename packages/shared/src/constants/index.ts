import type { GamePattern } from '../types';

/**
 * Valores por defecto para la configuración de rondas
 */
export const DEFAULT_ROUND_CONFIG = {
  cardSize: 5,
  numberRange: {
    min: 1,
    max: 75,
  },
  pattern: 'linea' as GamePattern,
  startMode: 'manual' as const,
} as const;

/**
 * Límites del sistema
 */
export const LIMITS = {
  /** Tamaño mínimo de carta */
  MIN_CARD_SIZE: 3,
  /** Tamaño máximo de carta */
  MAX_CARD_SIZE: 10,
  /** Número mínimo permitido */
  MIN_NUMBER: 1,
  /** Número máximo permitido */
  MAX_NUMBER: 99,
  /** Máximo de jugadores por ronda */
  MAX_PLAYERS_PER_ROUND: 100,
  /** Tiempo máximo de auto-inicio (segundos) */
  MAX_AUTO_START_DELAY: 3600,
} as const;

/**
 * Etiquetas para patrones de juego (español)
 */
export const PATTERN_LABELS: Record<GamePattern, string> = {
  linea: 'Línea horizontal',
  columna: 'Línea vertical',
  diagonal: 'Diagonal',
  completo: 'Cartón completo',
  especial: 'Figura especial',
};
