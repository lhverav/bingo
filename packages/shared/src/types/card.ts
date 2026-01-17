/**
 * Celda individual del cartón de bingo
 */
export interface CardCell {
  /** Número en la celda (null si es espacio libre) */
  number: number | null;

  /** Si el número ha sido marcado */
  marked: boolean;

  /** Posición en la carta */
  row: number;
  col: number;
}

/**
 * Cartón de bingo de un jugador
 */
export interface BingoCard {
  id: string;

  /** ID del jugador dueño del cartón */
  playerId: string;

  /** ID de la ronda a la que pertenece */
  roundId: string;

  /** Tamaño del cartón (ej: 5 para 5x5) */
  size: number;

  /** Matriz de celdas [fila][columna] */
  cells: CardCell[][];

  /** Si el jugador ha reclamado bingo */
  bingoClaimed: boolean;
}

/**
 * Parámetros para generar un cartón
 */
export interface CardGenerationParams {
  size: number;
  numberRange: {
    min: number;
    max: number;
  };
  /** Si debe tener espacio libre en el centro */
  hasFreeCenter: boolean;
}
