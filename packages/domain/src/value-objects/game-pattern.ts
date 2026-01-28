/**
 * Patrones de juego disponibles para ganar una ronda
 * Based on: casos de uso.pdf - Crear Ronda
 */
export type GamePattern =
  | 'linea'           // Linea horizontal
  | 'columna'         // Linea vertical
  | 'diagonal'        // Diagonal
  | 'completo'        // Carton completo
  | 'figura_especial'; // Figuras especiales

export const GAME_PATTERN_LABELS: Record<GamePattern, string> = {
  linea: 'Linea',
  columna: 'Columna',
  diagonal: 'Diagonal',
  completo: 'Carton Completo',
  figura_especial: 'Figura Especial',
};

export const ALL_GAME_PATTERNS: GamePattern[] = [
  'linea',
  'columna',
  'diagonal',
  'completo',
  'figura_especial',
];
