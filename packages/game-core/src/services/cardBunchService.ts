import { CardBunch, CreateCardBunchData } from '@bingo/domain';
import { cardBunchRepository } from '../repositories';

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
 * Create a new card bunch
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
