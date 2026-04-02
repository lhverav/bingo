import { CardBunch, CreateCardBunchData, CreateBunchCardData, CardType, getCardTypeConfig } from '@bingo/domain';
import { cardBunchRepository, bunchCardRepository } from '../repositories';

/**
 * Input for creating a card bunch
 */
export interface CreateCardBunchInput {
  name: string;
  cardType: CardType;
  count: number; // how many cards to generate
}

/**
 * Pick N unique random numbers from a range
 */
function pickFromRange(min: number, max: number, count: number): number[] {
  const pool: number[] = [];
  for (let i = min; i <= max; i++) {
    pool.push(i);
  }

  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, count);
}

/**
 * Generate a single card based on card type configuration
 * Uses column ranges to distribute numbers properly
 *
 * @param cardType - 'bingo' or 'bingote'
 * @returns 2D array (rows x columns) with numbers, 0 = free space
 */
export function generateCardByType(cardType: CardType): number[][] {
  const config = getCardTypeConfig(cardType);
  const { columns, rows, ranges, freeSpacePosition } = config;

  // Generate numbers for each column from its designated range
  const columnNumbers: number[][] = [];
  for (let col = 0; col < columns; col++) {
    const range = ranges[col];
    // If this column contains the free space, we need one less number
    const hasFreeSpace = freeSpacePosition.col === col;
    const count = hasFreeSpace ? rows - 1 : rows;
    columnNumbers.push(pickFromRange(range.min, range.max, count));
  }

  // Build grid row by row
  const grid: number[][] = [];
  for (let row = 0; row < rows; row++) {
    const rowCells: number[] = [];
    for (let col = 0; col < columns; col++) {
      if (row === freeSpacePosition.row && col === freeSpacePosition.col) {
        // Free space
        rowCells.push(0);
      } else {
        // Get the appropriate number from this column
        // Adjust index for columns with free space
        let idx = row;
        if (freeSpacePosition.col === col && row > freeSpacePosition.row) {
          idx = row - 1; // Skip past the free space position
        }
        rowCells.push(columnNumbers[col][idx]);
      }
    }
    grid.push(rowCells);
  }

  return grid;
}

/**
 * Input for generating and saving cards in chunks
 */
export interface GenerateAndSaveInput {
  bunchId: string;
  cardType: CardType;
  count: number;
  onProgress: (current: number, total: number) => void;
  shouldCancel: () => boolean;
  chunkSize?: number;
}

/**
 * Generate cards and save to database in chunks
 * Memory-efficient: only keeps one chunk in memory at a time
 *
 * @returns Number of cards successfully generated and saved
 * @throws Error if cancelled or database error
 */
export async function generateAndSaveCardsInChunks(
  input: GenerateAndSaveInput
): Promise<number> {
  const {
    bunchId,
    cardType,
    count,
    onProgress,
    shouldCancel,
    chunkSize = 1000,
  } = input;

  let generated = 0;

  while (generated < count) {
    // Check if cancelled before starting next chunk
    if (shouldCancel()) {
      throw new Error('Card generation cancelled by user');
    }

    // Calculate chunk size
    const remaining = count - generated;
    const currentChunkSize = Math.min(chunkSize, remaining);

    // Generate one chunk of cards
    const chunkCards: CreateBunchCardData[] = [];

    for (let i = 0; i < currentChunkSize; i++) {
      const grid = generateCardByType(cardType);

      chunkCards.push({
        bunchId,
        index: generated + i,
        cells: grid,
      });
    }

    // Save chunk to database immediately
    await bunchCardRepository.insertMany(chunkCards);

    // Update count (chunk is now saved and can be garbage collected)
    generated += currentChunkSize;

    // Report progress
    onProgress(generated, count);
  }

  // Update the bunch with final card count
  await cardBunchRepository.updateCardCount(bunchId, generated);

  return generated;
}

/**
 * Get all card bunches
 */
export async function getCardBunches(): Promise<CardBunch[]> {
  return cardBunchRepository.findAll();
}

/**
 * Get card bunches by card type
 */
export async function getCardBunchesByType(cardType: CardType): Promise<CardBunch[]> {
  return cardBunchRepository.findByCardType(cardType);
}

/**
 * Delete a card bunch and its associated cards
 */
export async function deleteCardBunch(id: string): Promise<boolean> {
  // First delete all associated BunchCards
  await bunchCardRepository.deleteByBunchId(id);
  // Then delete the bunch itself
  return cardBunchRepository.delete(id);
}
