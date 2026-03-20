/**
 * Card Type Value Object
 * Defines the two predefined card types: BINGO (5×5) and BINGOTE (7×5)
 */

export type CardType = 'bingo' | 'bingote';

export interface ColumnRange {
  letter: string;
  min: number;
  max: number;
}

export interface CardTypeConfig {
  columns: number;
  rows: number;
  letters: string[];
  ranges: ColumnRange[];
  freeSpacePosition: { row: number; col: number };
  totalNumbers: number;
}

export const CARD_TYPE_CONFIG: Record<CardType, CardTypeConfig> = {
  bingo: {
    columns: 5,
    rows: 5,
    letters: ['B', 'I', 'N', 'G', 'O'],
    ranges: [
      { letter: 'B', min: 1, max: 15 },
      { letter: 'I', min: 16, max: 30 },
      { letter: 'N', min: 31, max: 45 },
      { letter: 'G', min: 46, max: 60 },
      { letter: 'O', min: 61, max: 75 },
    ],
    freeSpacePosition: { row: 2, col: 2 },
    totalNumbers: 75,
  },
  bingote: {
    columns: 7,
    rows: 5,
    letters: ['B', 'I', 'N', 'G', 'O', 'T', 'E'],
    ranges: [
      { letter: 'B', min: 1, max: 15 },
      { letter: 'I', min: 16, max: 30 },
      { letter: 'N', min: 31, max: 45 },
      { letter: 'G', min: 46, max: 60 },
      { letter: 'O', min: 61, max: 75 },
      { letter: 'T', min: 76, max: 89 },
      { letter: 'E', min: 90, max: 103 },
    ],
    freeSpacePosition: { row: 2, col: 3 },
    totalNumbers: 103,
  },
};

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  bingo: 'BINGO',
  bingote: 'BINGOTE',
};

export const ALL_CARD_TYPES: CardType[] = ['bingo', 'bingote'];

export function getCardTypeConfig(cardType: CardType): CardTypeConfig {
  return CARD_TYPE_CONFIG[cardType];
}

export function getColumnRange(cardType: CardType, columnIndex: number): ColumnRange | null {
  const config = CARD_TYPE_CONFIG[cardType];
  if (columnIndex < 0 || columnIndex >= config.ranges.length) {
    return null;
  }
  return config.ranges[columnIndex];
}

export function isFreeSpace(cardType: CardType, row: number, col: number): boolean {
  const config = CARD_TYPE_CONFIG[cardType];
  return config.freeSpacePosition.row === row && config.freeSpacePosition.col === col;
}
