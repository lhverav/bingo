import { Router } from "express";
import { getScheduledGames, getGame, getMyJoinedGames } from "../controllers/games.controller";

const router = Router();

/**
 * GET /games
 * Get all upcoming scheduled games with their rounds
 */
router.get("/", getScheduledGames);

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
