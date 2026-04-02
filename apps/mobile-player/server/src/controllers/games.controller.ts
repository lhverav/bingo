import { Request, Response } from "express";
import { getUpcomingGames, getGameById, roundRepository, patternRepository, getJoinedGames } from "@bingo/game-core";
import { Game, Round, GamePlayer } from "@bingo/domain";

/**
 * Games controller - Handles game-related API requests for mobile app
 */

export interface RoundSummary {
  id: string;
  name: string;
  order: number;
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
 * Get all games a user has joined with game details
 */
export async function getMyJoinedGames(req: Request, res: Response) {
  try {
    const { mobileUserId } = req.params;

    if (!mobileUserId) {
      return res.status(400).json({ error: "Se requiere mobileUserId" });
    }

    // Get all game players for this user
    const gamePlayers = await getJoinedGames(mobileUserId);

    // Enrich with game details
    const joinedGamesWithDetails: JoinedGameInfo[] = [];

    for (const player of gamePlayers) {
      const game = await getGameById(player.gameId);

      if (game) {
        // Get rounds for the game
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
              patternName: pattern?.name,
            };
          });

        joinedGamesWithDetails.push({
          playerId: player.id,
          playerCode: player.playerCode,
          status: player.status,
          joinedAt: player.joinedAt.toISOString(),
          game: {
            ...game,
            rounds: roundSummaries,
          },
        });
      }
    }

    res.json(joinedGamesWithDetails);
  } catch (error) {
    console.error("Error getting joined games:", error);
    res.status(500).json({ error: "Error al obtener juegos unidos" });
  }
}
