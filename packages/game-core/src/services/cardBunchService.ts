import { CardBunch, CreateCardBunchData, CreateBunchCardData } from '@bingo/domain';
import { cardBunchRepository, bunchCardRepository } from '../repositories';

/**
 * Input for creating a card bunch
 */
export interface CreateCardBunchInput {
  name: string;
  cardSize: number;
  maxNumber: number;
  count: number; // how many cards to generate
}

/**
 * Generate bingo cards with random numbers
 * Pure function - no side effects
 *
 * @param cardSize - Grid size (3-10)
 * @param maxNumber - Maximum number (numbers are 1 to maxNumber)
 * @param count - How many cards to generate
 * @returns Array of cards, each card is a 2D grid. 0 = free center space.
 */
export function generateCards(
  cardSize: number,
  maxNumber: number,
  count: number
): number[][][] {
  const cards: number[][][] = [];
  const totalCells = cardSize * cardSize;
  const hasFreeCenter = cardSize % 2 === 1; // odd sizes get a free center
  const centerIndex = hasFreeCenter ? Math.floor(totalCells / 2) : -1;

  for (let i = 0; i < count; i++) {
    // Pick unique random numbers for this card
    const numbers = pickUniqueNumbers(maxNumber, totalCells, centerIndex);

    // Convert flat array to 2D grid
    const grid: number[][] = [];
    for (let row = 0; row < cardSize; row++) {
      const rowCells: number[] = [];
      for (let col = 0; col < cardSize; col++) {
        const index = row * cardSize + col;
        rowCells.push(numbers[index]);
      }
      grid.push(rowCells);
    }

    cards.push(grid);
  }

  return cards;
}

/**
 * Generate bingo cards in chunks with progress tracking and cancellation support
 *
 * @param cardSize - Grid size (3-10)
 * @param maxNumber - Maximum number (numbers are 1 to maxNumber)
 * @param count - How many cards to generate
 * @param onProgress - Callback called after each chunk with (current, total)
 * @param shouldCancel - Callback that returns true if generation should stop
 * @param chunkSize - How many cards to generate per chunk (default 1000)
 * @returns Array of cards, each card is a 2D grid. 0 = free center space.
 * @throws Error if shouldCancel() returns true
 */
export function generateCardsInChunks(
  cardSize: number,
  maxNumber: number,
  count: number,
  onProgress: (current: number, total: number) => void,
  shouldCancel: () => boolean,
  chunkSize: number = 1000
): number[][][] {
  const allCards: number[][][] = [];
  const totalCells = cardSize * cardSize;
  const hasFreeCenter = cardSize % 2 === 1;
  const centerIndex = hasFreeCenter ? Math.floor(totalCells / 2) : -1;

  let generated = 0;

  while (generated < count) {
    // Check if cancelled before starting next chunk
    if (shouldCancel()) {
      throw new Error('Card generation cancelled by user');
    }

    // Generate one chunk
    const remaining = count - generated;
    const currentChunkSize = Math.min(chunkSize, remaining);

    for (let i = 0; i < currentChunkSize; i++) {
      const numbers = pickUniqueNumbers(maxNumber, totalCells, centerIndex);

      // Convert flat array to 2D grid
      const grid: number[][] = [];
      for (let row = 0; row < cardSize; row++) {
        const rowCells: number[] = [];
        for (let col = 0; col < cardSize; col++) {
          const index = row * cardSize + col;
          rowCells.push(numbers[index]);
        }
        grid.push(rowCells);
      }

      allCards.push(grid);
    }

    generated += currentChunkSize;

    // Report progress after chunk completion
    onProgress(generated, count);
  }

  return allCards;
}

/**
 * Input for generating and saving cards in chunks
 */
export interface GenerateAndSaveInput {
  bunchId: string;
  cardSize: number;
  maxNumber: number;
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
    cardSize,
    maxNumber,
    count,
    onProgress,
    shouldCancel,
    chunkSize = 1000,
  } = input;

  const totalCells = cardSize * cardSize;
  const hasFreeCenter = cardSize % 2 === 1;
  const centerIndex = hasFreeCenter ? Math.floor(totalCells / 2) : -1;

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
      const numbers = pickUniqueNumbers(maxNumber, totalCells, centerIndex);

      // Convert flat array to 2D grid
      const grid: number[][] = [];
      for (let row = 0; row < cardSize; row++) {
        const rowCells: number[] = [];
        for (let col = 0; col < cardSize; col++) {
          const idx = row * cardSize + col;
          rowCells.push(numbers[idx]);
        }
        grid.push(rowCells);
      }

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

  return generated;
}

/**
 * Pick N unique random numbers from 1 to max
 * If centerIndex is provided, that position gets 0 (free space)
 */
function pickUniqueNumbers(
  max: number,
  count: number,
  centerIndex: number
): number[] {
  // Generate pool of available numbers
  const pool: number[] = [];
  for (let i = 1; i <= max; i++) {
    pool.push(i);
  }

  // Shuffle pool
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Pick first 'count' numbers
  const picked = pool.slice(0, count);

  // If there's a center, replace that position with 0
  if (centerIndex >= 0 && centerIndex < picked.length) {
    picked[centerIndex] = 0;
  }

  return picked;
}

/**
 * Create a new card bunch (generates cards automatically)
 */
export async function createCardBunch(input: CreateCardBunchInput): Promise<CardBunch> {
  const cards = generateCards(input.cardSize, input.maxNumber, input.count);

  const data: CreateCardBunchData = {
    name: input.name,
    cardSize: input.cardSize,
    maxNumber: input.maxNumber,
    cards,
  };

  return cardBunchRepository.create(data);
}

/**
 * Input for saving pre-generated cards
 */
export interface SaveCardBunchInput {
  name: string;
  cardSize: number;
  maxNumber: number;
  cards: number[][][];
}

/**
 * Save a card bunch with pre-generated cards
 * Use this when cards have already been generated (e.g., with generateCardsInChunks)
 */
export async function saveCardBunch(input: SaveCardBunchInput): Promise<CardBunch> {
  const data: CreateCardBunchData = {
    name: input.name,
    cardSize: input.cardSize,
    maxNumber: input.maxNumber,
    cards: input.cards,
  };

  return cardBunchRepository.create(data);
}

/**
 * Get all card bunches
 */
export async function getCardBunches(): Promise<CardBunch[]> {
  return cardBunchRepository.findAll();
}

/**
 * Get card bunches by dimensions
 */
export async function getCardBunchesByDimensions(
  cardSize: number,
  maxNumber: number
): Promise<CardBunch[]> {
  return cardBunchRepository.findByDimensions(cardSize, maxNumber);
}

/**
 * Delete a card bunch
 */
export async function deleteCardBunch(id: string): Promise<boolean> {
  return cardBunchRepository.delete(id);
}
