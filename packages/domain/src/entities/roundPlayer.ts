export type RoundPlayerStatus = 'selecting' | 'ready';

export interface RoundPlayer {
  id: string;
  roundId: string;
  playerCode: string;
  status: RoundPlayerStatus;
  lockedCardIds: string[];       // Temporarily locked for selection
  selectedCardIds: string[];     // Permanently assigned after selection
  selectionDeadline: Date;
  joinedAt: Date;
}

export interface CreateRoundPlayerData {
  roundId: string;
  playerCode: string;
  lockedCardIds: string[];
  selectionDeadline: Date;
}
