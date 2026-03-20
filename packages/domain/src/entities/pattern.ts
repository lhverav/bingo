/**
 * Pattern Entity
 * Defines a winning pattern for bingo games
 */

import { CardType } from '../value-objects/card-type';

export interface Pattern {
  id: string;
  name: string;
  cardType: CardType;
  cells: boolean[][];
  isPreset: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePatternData {
  name: string;
  cardType: CardType;
  cells: boolean[][];
  isPreset?: boolean;
  createdBy?: string;
}

export interface UpdatePatternData {
  name?: string;
  cells?: boolean[][];
}

/**
 * Preset pattern names
 */
export type PresetPatternName = 'line' | 'column' | 'diagonal' | 'corners' | 'full';

export const PRESET_PATTERN_LABELS: Record<PresetPatternName, string> = {
  line: 'Línea',
  column: 'Columna',
  diagonal: 'Diagonal',
  corners: 'Esquinas',
  full: 'Cartón Completo',
};
