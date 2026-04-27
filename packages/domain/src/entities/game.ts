/**
 * Game Entity
 * A game is a container for multiple rounds with a scheduled start time
 *
 * Payment is at the GAME level (not round level):
 * - FREE game: Players select cards for free
 * - PAID game: Players pay once to get cards
 * - In both cases, players can change cards before each round starts
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

/**
 * Currency options for paid games
 */
export type Currency = 'USD' | 'COP';

export const CURRENCY_LABELS: Record<Currency, string> = {
  USD: 'Dólares (USD)',
  COP: 'Pesos Colombianos (COP)',
};

export const ALL_CURRENCIES: Currency[] = ['USD', 'COP'];

export interface Game {
  id: string;
  name: string;
  cardType: CardType;
  cardBunchId?: string;        // Reference to pre-generated CardBunch
  scheduledAt: Date;
  status: GameStatus;
  createdBy: string;

  // Visibility to mobile players
  isPublished: boolean;        // Only ONE game can be published at a time

  // Payment configuration (at game level)
  isPaid: boolean;
  pricePerCard?: number;       // If paid: price per card
  currency?: Currency;         // If paid: currency

  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGameData {
  name: string;
  cardType: CardType;
  cardBunchId?: string;
  scheduledAt: Date;
  createdBy: string;
  isPaid: boolean;
  pricePerCard?: number;
  currency?: Currency;
}

export interface UpdateGameData {
  name?: string;
  cardType?: CardType;
  cardBunchId?: string;
  scheduledAt?: Date;
  status?: GameStatus;
  isPaid?: boolean;
  pricePerCard?: number;
  currency?: Currency;
}
