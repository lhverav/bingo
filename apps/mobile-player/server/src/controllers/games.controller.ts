import { Request, Response } from "express";
import { getUpcomingGames, getGameById, roundRepository, patternRepository } from "@bingo/game-core";
import { Game, Round } from "@bingo/domain";

/**
 * Games controller - Handles game-related API requests for mobile app
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

export interface GameWithRounds extends Game {
  rounds: RoundSummary[];
}

/**
 * Get all upcoming scheduled games with their rounds
 */
export async function getScheduledGames(req: Request, res: Response) {
  try {
    const games = await getUpcomingGames();

    // Enrich each game with its rounds
    const gamesWithRounds: GameWithRounds[] = [];

    for (const game of games) {
      const rounds = await roundRepository.findByGameId(game.id);
      const patterns = await patternRepository.findByCardType(game.cardType);
      const patternMap = new Map(patterns.map((p) => [p.id, p]));

      const roundSummaries: RoundSummary[] = rounds
        .sort((a, b) => a.order - b.order)
        .map((round) => {
          const pattern = patternMap.get(round.patternId);
          return {
            id: round.id,
            name: round.name,
            order: round.order,
            isPaid: round.isPaid,
            pricePerCard: round.pricePerCard,
            currency: round.currency,
            patternName: pattern?.name,
          };
        });

      gamesWithRounds.push({
        ...game,
        rounds: roundSummaries,
      });
    }

    res.json(gamesWithRounds);
  } catch (error) {
    console.error("Error getting scheduled games:", error);
    res.status(500).json({ error: "Error al obtener juegos programados" });
  }
}

/**
 * Get a single game by ID with its rounds
 */
export async function getGame(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const game = await getGameById(id);

    if (!game) {
      return res.status(404).json({ error: "Juego no encontrado" });
    }

    const rounds = await roundRepository.findByGameId(id);
    const patterns = await patternRepository.findByCardType(game.cardType);
    const patternMap = new Map(patterns.map((p) => [p.id, p]));

    const roundSummaries: RoundSummary[] = rounds
      .sort((a, b) => a.order - b.order)
      .map((round) => {
        const pattern = patternMap.get(round.patternId);
        return {
          id: round.id,
          name: round.name,
          order: round.order,
          isPaid: round.isPaid,
          pricePerCard: round.pricePerCard,
          currency: round.currency,
          patternName: pattern?.name,
        };
      });

    const gameWithRounds: GameWithRounds = {
      ...game,
      rounds: roundSummaries,
    };

    res.json(gameWithRounds);
  } catch (error) {
    console.error("Error getting game:", error);
    res.status(500).json({ error: "Error al obtener el juego" });
  }
}
