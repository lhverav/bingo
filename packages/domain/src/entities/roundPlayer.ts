export type RoundPlayerStatus = 'joined' | 'selecting' | 'ready';

export interface RoundPlayer {
  id: string;
  roundId: string;
  mobileUserId?: string;          // Link to MobileUser (if authenticated)
  playerCode: string;
  status: RoundPlayerStatus;
  lockedCardIds: string[];       // Temporarily locked for selection
  selectedCardIds: string[];     // Permanently assigned after selection
  selectionDeadline?: Date;      // Set when cards are requested
  joinedAt: Date;
}

export interface CreateRoundPlayerData {
  roundId: string;
  mobileUserId?: string;
  playerCode: string;
  lockedCardIds?: string[];        // Optional: empty when first joining
  selectedCardIds?: string[];      // Optional: set directly if using game-level cards
  selectionDeadline?: Date;        // Optional: set when cards are requested
  status?: RoundPlayerStatus;      // Optional: defaults to 'joined', set to 'ready' if using game-level cards
}
