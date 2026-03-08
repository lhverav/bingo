import { GamePattern } from '@bingo/domain';
import { roundRepository, roundPlayerRepository, bunchCardRepository } from '../repositories';
import { checkPattern } from './patternService';

/**
 * Information about a winner
 */
export interface WinnerInfo {
  playerId: string;
  playerCode: string;
  cardId: string;
}

/**
 * Result of checking for winners
 */
export interface WinnerCheckResult {
  hasWinners: boolean;
  winners: WinnerInfo[];
  pattern: GamePattern;
  drawnNumbers: number[];
}

/**
 * Check if there are any winners in a round
 * Checks all players with 'ready' status and their selected cards
 *
 * @param roundId - The round to check
 * @returns WinnerCheckResult with winner info
 */
export async function checkForWinners(roundId: string): Promise<WinnerCheckResult> {
  // Get round to get pattern and drawn numbers
  const round = await roundRepository.findById(roundId);
  if (!round) {
    throw new Error('Ronda no encontrada');
  }

  if (!round.gamePattern) {
    throw new Error('La ronda no tiene un patron definido');
  }

  const pattern = round.gamePattern as GamePattern;
  const drawnNumbers = round.drawnNumbers || [];

  console.log('[checkForWinners] Pattern:', pattern, 'Drawn numbers:', drawnNumbers.length);

  // Get all players in the round who are ready to play
  const players = await roundPlayerRepository.findByRoundId(roundId);
  const readyPlayers = players.filter(p => p.status === 'ready');

  console.log('[checkForWinners] Ready players:', readyPlayers.length);

  const winners: WinnerInfo[] = [];

  // Check each player's selected cards
  for (const player of readyPlayers) {
    console.log(`[checkForWinners] Player ${player.playerCode} has ${player.selectedCardIds.length} cards`);
    for (const cardId of player.selectedCardIds) {
      const card = await bunchCardRepository.findById(cardId);
      if (!card) {
        console.log(`[checkForWinners] Card ${cardId} not found!`);
        continue;
      }

      // Check if this card matches the pattern
      const isWinner = checkPattern(card.cells, drawnNumbers, pattern);
      console.log(`[checkForWinners] Card ${cardId} isWinner:`, isWinner);
      if (isWinner) {
        winners.push({
          playerId: player.id,
          playerCode: player.playerCode,
          cardId: card.id,
        });
      }
    }
  }

  return {
    hasWinners: winners.length > 0,
    winners,
    pattern,
    drawnNumbers,
  };
}

/**
 * Verify if a specific card is a winner
 * Used when a player claims BINGO to double-check
 *
 * @param roundId - The round
 * @param cardId - The card to verify
 * @returns true if the card is a valid winner
 */
export async function verifyWinner(roundId: string, cardId: string): Promise<boolean> {
  const round = await roundRepository.findById(roundId);
  if (!round || !round.gamePattern) {
    return false;
  }

  const card = await bunchCardRepository.findById(cardId);
  if (!card) {
    return false;
  }

  const pattern = round.gamePattern as GamePattern;
  const drawnNumbers = round.drawnNumbers || [];

  return checkPattern(card.cells, drawnNumbers, pattern);
}

/**
 * Get game summary for round end
 */
export interface GameSummary {
  roundId: string;
  roundName: string;
  pattern: GamePattern;
  totalPlayers: number;
  numbersDrawn: number;
  winners: WinnerInfo[];
}

/**
 * Get a summary of the game for the results screen
 *
 * @param roundId - The round to summarize
 * @param claimedWinners - Winners who successfully claimed BINGO
 * @returns GameSummary with all relevant info
 */
export async function getGameSummary(
  roundId: string,
  claimedWinners: WinnerInfo[]
): Promise<GameSummary> {
  const round = await roundRepository.findById(roundId);
  if (!round) {
    throw new Error('Ronda no encontrada');
  }

  const players = await roundPlayerRepository.findByRoundId(roundId);
  const readyPlayers = players.filter(p => p.status === 'ready');

  return {
    roundId,
    roundName: round.name,
    pattern: round.gamePattern as GamePattern,
    totalPlayers: readyPlayers.length,
    numbersDrawn: round.drawnNumbers?.length || 0,
    winners: claimedWinners,
  };
}
