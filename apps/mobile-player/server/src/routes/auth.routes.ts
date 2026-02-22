/**
 * Authentication Routes
 *
 * Defines OAuth2 authentication endpoints
 * Based on BingoteDeOro3 structure
 */

import { Router } from "express";
import { googleAuth, googleCallback } from "../controllers/auth.controller";

const router = Router();

/**
 * Step 1: Initiate Google OAuth flow
 * GET /auth/google
 */
router.get("/google", googleAuth);

/**
 * Step 2: Handle Google OAuth callback
 * GET /auth/google/callback?code=...
 */
router.get("/google/callback", googleCallback);

export default router;
