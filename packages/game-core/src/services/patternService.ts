import { GamePattern } from '@bingo/domain';

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
 * Check if the middle horizontal line (row) is complete
 */
function checkLine(cells: number[][], drawnNumbers: number[]): boolean {
  const size = cells.length;
  const middleRow = Math.floor(size / 2);

  // Only check the middle row
  for (let col = 0; col < size; col++) {
    if (!isCellMarked(cells[middleRow][col], drawnNumbers)) {
      return false;
    }
  }
  return true;
}

/**
 * Check if the middle vertical line (column) is complete
 */
function checkColumn(cells: number[][], drawnNumbers: number[]): boolean {
  const size = cells.length;
  const middleCol = Math.floor(size / 2);

  // Only check the middle column
  for (let row = 0; row < size; row++) {
    if (!isCellMarked(cells[row][middleCol], drawnNumbers)) {
      return false;
    }
  }
  return true;
}

/**
 * Check if BOTH diagonals are complete (X shape)
 */
function checkDiagonal(cells: number[][], drawnNumbers: number[]): boolean {
  const size = cells.length;

  // Check main diagonal (top-left to bottom-right)
  for (let i = 0; i < size; i++) {
    if (!isCellMarked(cells[i][i], drawnNumbers)) {
      return false;
    }
  }

  // Check anti-diagonal (top-right to bottom-left)
  for (let i = 0; i < size; i++) {
    if (!isCellMarked(cells[i][size - 1 - i], drawnNumbers)) {
      return false;
    }
  }

  return true;
}

/**
 * Check if all cells are marked (full card)
 */
function checkComplete(cells: number[][], drawnNumbers: number[]): boolean {
  const size = cells.length;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!isCellMarked(cells[row][col], drawnNumbers)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Check if a card matches the winning pattern given the drawn numbers
 *
 * @param cells - Card's cell grid (2D array, 0 = free space)
 * @param drawnNumbers - Numbers drawn so far
 * @param pattern - Pattern to check against
 * @returns true if the card matches the pattern
 */
export function checkPattern(
  cells: number[][],
  drawnNumbers: number[],
  pattern: GamePattern
): boolean {
  switch (pattern) {
    case 'linea':
      return checkLine(cells, drawnNumbers);

    case 'columna':
      return checkColumn(cells, drawnNumbers);

    case 'diagonal':
      return checkDiagonal(cells, drawnNumbers);

    case 'completo':
      return checkComplete(cells, drawnNumbers);

    case 'figura_especial':
      // X shape - both diagonals required
      return checkDiagonal(cells, drawnNumbers);

    default:
      return false;
  }
}

/**
 * Get the cells that need to be marked for a pattern
 * Useful for visualizing the pattern on mobile app
 *
 * @param pattern - Pattern to visualize
 * @param size - Grid size (default 5)
 * @returns 2D boolean array indicating which cells are part of the pattern
 */
export function getPatternMask(pattern: GamePattern, size: number = 5): boolean[][] {
  const mask: boolean[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(false));

  switch (pattern) {
    case 'linea':
      // Show middle row as example
      const middleRow = Math.floor(size / 2);
      for (let col = 0; col < size; col++) {
        mask[middleRow][col] = true;
      }
      break;

    case 'columna':
      // Show middle column as example
      const middleCol = Math.floor(size / 2);
      for (let row = 0; row < size; row++) {
        mask[row][middleCol] = true;
      }
      break;

    case 'diagonal':
      // Show both diagonals
      for (let i = 0; i < size; i++) {
        mask[i][i] = true; // Main diagonal
        mask[i][size - 1 - i] = true; // Anti-diagonal
      }
      break;

    case 'completo':
      // All cells
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          mask[row][col] = true;
        }
      }
      break;

    case 'figura_especial':
      // X shape (both diagonals) as placeholder
      for (let i = 0; i < size; i++) {
        mask[i][i] = true;
        mask[i][size - 1 - i] = true;
      }
      break;
  }

  return mask;
}
