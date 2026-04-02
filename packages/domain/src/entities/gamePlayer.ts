/**
 * GamePlayer Entity
 * Represents a player who has joined a game (not a round)
 *
 * Card flow:
 * - Player joins game and gets/buys cards (depending on isPaid at game level)
 * - Player can CHANGE cards before each round starts (always free)
 * - Once a round starts, cards are locked until round ends
 */

export type GamePlayerStatus = 'joined' | 'selecting' | 'cards_selected' | 'playing';

export const GAME_PLAYER_STATUS_LABELS: Record<GamePlayerStatus, string> = {
  joined: 'Unido',
  selecting: 'Seleccionando Cartones',
  cards_selected: 'Cartones Seleccionados',
  playing: 'Jugando',
};

/**
 * GamePlayer entity - Player participation in a game
 */
export interface GamePlayer {
  id: string;
  gameId: string;                    // Reference to Game
  mobileUserId?: string;             // Reference to MobileUser (if authenticated)
  playerCode: string;                // Unique 4-char code for this game
  status: GamePlayerStatus;

  // Current cards (can be changed before each round)
  cardIds: string[];

  // Temporarily locked cards during selection (released when selection confirmed)
  lockedCardIds: string[];

  // Payment tracking (for paid games)
  hasPaid: boolean;                  // Has the player paid for this game?
  paidAt?: Date;                     // When payment was made

  // Card selection tracking
  cardsLocked: boolean;              // True when round is in progress (can't change)
  selectionDeadline?: Date;          // Deadline for card selection/change

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
  cardIds?: string[];
  lockedCardIds?: string[];
  hasPaid?: boolean;
  paidAt?: Date;
  cardsLocked?: boolean;
  selectionDeadline?: Date;
}

/**
 * Result of joining a game
 */
export interface JoinGameResult {
  player: GamePlayer;
  isReconnect: boolean;
}
