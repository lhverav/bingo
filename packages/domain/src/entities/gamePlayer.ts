/**
 * GamePlayer Entity
 * Represents a player who has joined a game (not a round)
 *
 * In the new game flow:
 * - Players join a GAME (via gameId)
 * - Cards are selected per-game for FREE rounds
 * - Cards are purchased per-round for PAID rounds
 */

export type GamePlayerStatus = 'joined' | 'cards_selected' | 'playing';

export const GAME_PLAYER_STATUS_LABELS: Record<GamePlayerStatus, string> = {
  joined: 'Unido',
  cards_selected: 'Cartones Seleccionados',
  playing: 'Jugando',
};

/**
 * Cards purchased for a specific paid round
 */
export interface PaidRoundCards {
  roundId: string;
  cardIds: string[];
  purchasedAt: Date;
}

/**
 * GamePlayer entity - Player participation in a game
 */
export interface GamePlayer {
  id: string;
  gameId: string;                    // Reference to Game
  mobileUserId?: string;             // Reference to MobileUser (if authenticated)
  playerCode: string;                // Unique 4-char code for this game
  status: GamePlayerStatus;

  // Cards for FREE rounds (selected once, used for all free rounds)
  freeCardIds: string[];

  // Cards for PAID rounds (purchased separately per round)
  paidRoundCards: PaidRoundCards[];

  // Selection tracking
  freeCardsLocked: string[];         // Temporarily locked during selection
  freeSelectionDeadline?: Date;      // Deadline for free card selection

  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data required to create a new GamePlayer
 */
export interface CreateGamePlayerData {
  gameId: string;
  mobileUserId?: string;
  playerCode: string;
}

/**
 * Data allowed when updating a GamePlayer
 */
export interface UpdateGamePlayerData {
  status?: GamePlayerStatus;
  freeCardIds?: string[];
  freeCardsLocked?: string[];
  freeSelectionDeadline?: Date;
}

/**
 * Result of joining a game
 */
export interface JoinGameResult {
  player: GamePlayer;
  isReconnect: boolean;
}
