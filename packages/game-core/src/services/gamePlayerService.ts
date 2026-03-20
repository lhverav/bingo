import { GamePlayer, CreateGamePlayerData, JoinGameResult } from '@bingo/domain';
import { gamePlayerRepository, gameRepository } from '../repositories';

/**
 * GamePlayer service - Business logic for player operations in games
 *
 * In the new game flow:
 * - Players join a GAME (not a round)
 * - Cards are selected per-game for FREE rounds
 * - Cards are purchased per-round for PAID rounds
 */

/**
 * Generate a unique 4-character alphanumeric player code
 * Format: A-Z and 0-9, e.g., "A7X9", "B3K2"
 */
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars: I, O, 0, 1
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generate a unique player code for a game
 * Retries if code already exists in the game
 */
async function generateUniquePlayerCode(gameId: string): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const code = generateCode();
    const existing = await gamePlayerRepository.findByGameAndCode(gameId, code);
    if (!existing) {
      return code;
    }
    attempts++;
  }

  throw new Error('No se pudo generar un codigo unico para el jugador');
}

/**
 * Input for joining a game
 */
export interface JoinGameInput {
  gameId: string;
  mobileUserId?: string;  // Link to authenticated user
}

/**
 * Join a game - creates player record
 * Returns existing player if mobileUserId already joined this game
 */
export async function joinGame(input: JoinGameInput): Promise<JoinGameResult> {
  // Verify the game exists
  const game = await gameRepository.findById(input.gameId);
  if (!game) {
    throw new Error('Juego no encontrado');
  }

  // Check game status - can only join scheduled or active games
  if (game.status !== 'scheduled' && game.status !== 'active') {
    throw new Error('El juego no esta disponible para unirse');
  }

  // Check if this user already joined this game (reconnection scenario)
  if (input.mobileUserId) {
    const existingPlayer = await gamePlayerRepository.findByGameAndMobileUser(
      input.gameId,
      input.mobileUserId
    );

    if (existingPlayer) {
      // Return existing player (reconnection scenario)
      return { player: existingPlayer, isReconnect: true };
    }
  }

  // Generate unique player code
  const playerCode = await generateUniquePlayerCode(input.gameId);

  // Create the player (no cards yet, status: 'joined')
  const createData: CreateGamePlayerData = {
    gameId: input.gameId,
    mobileUserId: input.mobileUserId,
    playerCode,
  };

  const player = await gamePlayerRepository.create(createData);

  return { player, isReconnect: false };
}

/**
 * Get all players in a game
 */
export async function getPlayersByGame(gameId: string): Promise<GamePlayer[]> {
  return gamePlayerRepository.findByGameId(gameId);
}

/**
 * Get a game player by ID
 */
export async function getGamePlayerById(id: string): Promise<GamePlayer | null> {
  return gamePlayerRepository.findById(id);
}

/**
 * Get a game player by game and code
 */
export async function getGamePlayerByCode(
  gameId: string,
  playerCode: string
): Promise<GamePlayer | null> {
  return gamePlayerRepository.findByGameAndCode(gameId, playerCode);
}

/**
 * Get a game player by game and mobile user
 */
export async function getGamePlayerByMobileUser(
  gameId: string,
  mobileUserId: string
): Promise<GamePlayer | null> {
  return gamePlayerRepository.findByGameAndMobileUser(gameId, mobileUserId);
}

/**
 * Count players in a game
 */
export async function countPlayersInGame(gameId: string): Promise<number> {
  return gamePlayerRepository.countByGameId(gameId);
}

/**
 * Update player status
 */
export async function updateGamePlayerStatus(
  playerId: string,
  status: 'joined' | 'cards_selected' | 'playing'
): Promise<GamePlayer | null> {
  return gamePlayerRepository.updateStatus(playerId, status);
}

/**
 * Leave a game - removes the player from the game
 * Can only leave if game hasn't started (status is 'scheduled')
 */
export async function leaveGame(gameId: string, mobileUserId: string): Promise<boolean> {
  // Verify the game exists and is still scheduled
  const game = await gameRepository.findById(gameId);
  if (!game) {
    throw new Error('Juego no encontrado');
  }

  if (game.status !== 'scheduled') {
    throw new Error('No puedes salir de un juego que ya ha comenzado');
  }

  // Find the player
  const player = await gamePlayerRepository.findByGameAndMobileUser(gameId, mobileUserId);
  if (!player) {
    throw new Error('No estas registrado en este juego');
  }

  // Delete the player
  return gamePlayerRepository.delete(player.id);
}

/**
 * Get all games a user has joined
 */
export async function getJoinedGames(mobileUserId: string): Promise<GamePlayer[]> {
  return gamePlayerRepository.findByMobileUserId(mobileUserId);
}
