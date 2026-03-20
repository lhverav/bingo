/**
 * Game Entity
 * A game is a container for multiple rounds with a scheduled start time
 */

import { CardType } from '../value-objects/card-type';

export type GameStatus = 'scheduled' | 'active' | 'finished' | 'cancelled';

export const GAME_STATUS_LABELS: Record<GameStatus, string> = {
  scheduled: 'Programado',
  active: 'En Progreso',
  finished: 'Finalizado',
  cancelled: 'Cancelado',
};

export const ALL_GAME_STATUSES: GameStatus[] = ['scheduled', 'active', 'finished', 'cancelled'];

export interface Game {
  id: string;
  name: string;
  cardType: CardType;
  scheduledAt: Date;
  status: GameStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGameData {
  name: string;
  cardType: CardType;
  scheduledAt: Date;
  createdBy: string;
}

export interface UpdateGameData {
  name?: string;
  cardType?: CardType;
  scheduledAt?: Date;
  status?: GameStatus;
}
