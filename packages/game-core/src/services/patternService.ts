import { Pattern, CreatePatternData, UpdatePatternData, CardType } from '@bingo/domain';
import { patternRepository } from '../repositories';

// ============================================================================
// PATTERN CRUD OPERATIONS
// ============================================================================

/**
 * Service layer input for creating a pattern
 */
export interface CreatePatternInput {
  name: string;
  cardType: CardType;
  cells: boolean[][];
  isPreset?: boolean;
  createdBy?: string;
}

/**
 * Service layer input for updating a pattern
 */
export interface UpdatePatternInput {
  name?: string;
  cells?: boolean[][];
}

/**
 * Create a new pattern
 */
export async function createPattern(data: CreatePatternInput): Promise<Pattern> {
  // Validate cells dimensions match card type
  validatePatternCells(data.cells, data.cardType);

  // Check for duplicate name
  const existing = await patternRepository.findByNameAndCardType(data.name, data.cardType);
  if (existing) {
    throw new Error(`Ya existe un patrón con el nombre "${data.name}" para este tipo de cartón`);
  }

  const createData: CreatePatternData = {
    name: data.name,
    cardType: data.cardType,
    cells: data.cells,
    isPreset: data.isPreset ?? false,
    createdBy: data.createdBy,
  };

  return patternRepository.create(createData);
}

/**
 * Get all patterns
 */
export async function getAllPatterns(): Promise<Pattern[]> {
  return patternRepository.findAll();
}

/**
 * Get patterns by card type
 */
export async function getPatternsByCardType(cardType: CardType): Promise<Pattern[]> {
  return patternRepository.findByCardType(cardType);
}

/**
 * Get preset patterns by card type
 */
export async function getPresetPatterns(cardType: CardType): Promise<Pattern[]> {
  return patternRepository.findPresetsByCardType(cardType);
}

/**
 * Get custom patterns by card type
 */
export async function getCustomPatterns(cardType: CardType): Promise<Pattern[]> {
  return patternRepository.findCustomByCardType(cardType);
}

/**
 * Get a pattern by ID
 */
export async function getPatternById(id: string): Promise<Pattern | null> {
  return patternRepository.findById(id);
}

/**
 * Update a pattern (only non-preset patterns can be updated)
 */
export async function updatePattern(
  id: string,
  data: UpdatePatternInput
): Promise<Pattern | null> {
  const pattern = await patternRepository.findById(id);
  if (!pattern) return null;

  // Business rule: Preset patterns cannot be modified
  if (pattern.isPreset) {
    throw new Error('Los patrones predefinidos no pueden ser modificados');
  }

  // Validate cells if provided
  if (data.cells) {
    validatePatternCells(data.cells, pattern.cardType);
  }

  // Check for duplicate name if name is being changed
  if (data.name && data.name !== pattern.name) {
    const existing = await patternRepository.findByNameAndCardType(data.name, pattern.cardType);
    if (existing) {
      throw new Error(`Ya existe un patrón con el nombre "${data.name}" para este tipo de cartón`);
    }
  }

  const updateData: UpdatePatternData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.cells !== undefined) updateData.cells = data.cells;

  return patternRepository.update(id, updateData);
}

/**
 * Delete a pattern (only non-preset patterns can be deleted)
 */
export async function deletePattern(id: string): Promise<boolean> {
  const pattern = await patternRepository.findById(id);
  if (!pattern) return false;

  // Business rule: Preset patterns cannot be deleted
  if (pattern.isPreset) {
    throw new Error('Los patrones predefinidos no pueden ser eliminados');
  }

  return patternRepository.delete(id);
}

/**
 * Validate pattern cells dimensions match card type
 */
function validatePatternCells(cells: boolean[][], cardType: CardType): void {
  const expectedRows = 5;
  const expectedCols = cardType === 'bingo' ? 5 : 7;

  if (cells.length !== expectedRows) {
    throw new Error(`El patrón debe tener ${expectedRows} filas`);
  }

  for (const row of cells) {
    if (row.length !== expectedCols) {
      throw new Error(`Cada fila debe tener ${expectedCols} columnas`);
    }
  }

  // At least one cell must be selected
  const hasSelectedCell = cells.some(row => row.some(cell => cell));
  if (!hasSelectedCell) {
    throw new Error('El patrón debe tener al menos una celda seleccionada');
  }
}

// ============================================================================
// PATTERN CHECKING FOR GAME PLAY
// ============================================================================

/**
 * Check if a cell is considered "marked" for pattern matching
 * - Free space (0) always counts as marked
 * - Other numbers count if they're in the drawn numbers list
 */
function isCellMarked(cellValue: number, drawnNumbers: number[]): boolean {
  if (cellValue === 0) return true; // Free space always marked
  return drawnNumbers.includes(cellValue);
}

/**
 * Check if a card matches a pattern
 * Uses the boolean[][] cells from Pattern entity
 *
 * @param cardCells - Card's cell grid (2D array of numbers, 0 = free space)
 * @param drawnNumbers - Numbers drawn so far
 * @param patternCells - Pattern's cell grid (2D array of booleans)
 * @returns true if all required cells are marked
 */
export function checkCustomPattern(
  cardCells: number[][],
  drawnNumbers: number[],
  patternCells: boolean[][]
): boolean {
  const rows = patternCells.length;

  for (let row = 0; row < rows; row++) {
    const cols = patternCells[row].length;
    for (let col = 0; col < cols; col++) {
      // If this cell is part of the pattern
      if (patternCells[row][col]) {
        // Check if the corresponding card cell is marked
        if (!isCellMarked(cardCells[row][col], drawnNumbers)) {
          return false;
        }
      }
    }
  }

  return true;
}
