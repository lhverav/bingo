import { serverConfig } from "@/config/server";

/**
 * Games API client - Fetch games and rounds from server
 */

export interface RoundSummary {
  id: string;
  name: string;
  order: number;
  isPaid: boolean;
  pricePerCard?: number;
  currency?: string;
  patternName?: string;
}

export interface GameWithRounds {
  id: string;
  name: string;
  cardType: "bingo" | "bingote";
  scheduledAt: string;
  status: "scheduled" | "active" | "finished" | "cancelled";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  rounds: RoundSummary[];
}

/**
 * Fetch all upcoming scheduled games with their rounds
 * @deprecated Use getPublishedGame() instead - only one game is visible at a time
 */
export async function getScheduledGames(): Promise<GameWithRounds[]> {
  const response = await fetch(`${serverConfig.baseUrl}/games`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error al obtener juegos");
  }

  return response.json();
}

/**
 * Fetch the currently published game (the one visible to players)
 * Only one game can be published at a time
 * Returns null if no game is published
 */
export async function getPublishedGame(): Promise<GameWithRounds | null> {
  const response = await fetch(`${serverConfig.baseUrl}/games/published`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error al obtener el juego publicado");
  }

  return response.json();
}

/**
 * Fetch a single game by ID with its rounds
 */
export async function getGameById(id: string): Promise<GameWithRounds> {
  const response = await fetch(`${serverConfig.baseUrl}/games/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error al obtener el juego");
  }

  return response.json();
}

/**
 * Format price with currency
 */
export function formatPrice(price: number, currency?: string): string {
  if (currency === "COP") {
    return `$${price.toLocaleString("es-CO")} COP`;
  }
  if (currency === "USD") {
    return `$${price.toFixed(2)} USD`;
  }
  return `$${price}`;
}

/**
 * Format date for display
 */
export function formatGameDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Joined game info with game details
 */
export interface JoinedGameInfo {
  playerId: string;
  playerCode: string;
  status: string;
  joinedAt: string;
  game: GameWithRounds;
}

/**
 * Fetch all games a user has joined with game details
 */
export async function getJoinedGames(mobileUserId: string): Promise<JoinedGameInfo[]> {
  const response = await fetch(`${serverConfig.baseUrl}/games/joined/${mobileUserId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error al obtener juegos unidos");
  }

  return response.json();
}
