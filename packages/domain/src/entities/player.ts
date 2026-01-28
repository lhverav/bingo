/**
 * Player entity - Pure domain object
 * Represents a player in the bingo game
 */
export interface Player {
  id: string;
  name: string;
  currentRoundId?: string;
  connected: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data required to create a new player
 */
export interface CreatePlayerData {
  name: string;
}

/**
 * Data allowed when updating a player
 */
export interface UpdatePlayerData {
  name?: string;
  currentRoundId?: string | null;
  connected?: boolean;
}
