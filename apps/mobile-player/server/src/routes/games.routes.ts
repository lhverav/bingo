import { Router } from "express";
import { getScheduledGames, getGame, getMyJoinedGames, getActiveRounds, getPublished } from "../controllers/games.controller";

const router = Router();

/**
 * GET /games
 * Get all upcoming scheduled games with their rounds
 */
router.get("/", getScheduledGames);

/**
 * GET /games/published
 * Get the currently published game (the one visible to players)
 */
router.get("/published", getPublished);

/**
 * GET /games/active-rounds
 * Get all active rounds (for "Juegos en Curso" tab)
 */
router.get("/active-rounds", getActiveRounds);

/**
 * GET /games/joined/:mobileUserId
 * Get all games a user has joined with game details
 */
router.get("/joined/:mobileUserId", getMyJoinedGames);

/**
 * GET /games/:id
 * Get a single game by ID with its rounds
 */
router.get("/:id", getGame);

export default router;
