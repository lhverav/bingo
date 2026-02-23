/**
 * Authentication Routes
 *
 * Defines OAuth2 authentication endpoints
 * Based on BingoteDeOro3 structure
 */

import { Router } from "express";
import {
  googleAuth,
  googleCallback,
  registerUser,
  login,
  oauthGoogleLogin,
  checkEmail,
} from "../controllers/auth.controller";

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

/**
 * Register a new mobile user
 * POST /auth/register
 */
router.post("/register", registerUser);

/**
 * Login with email and password
 * POST /auth/login
 */
router.post("/login", login);

/**
 * Login or check OAuth user (returns isNewUser or user data)
 * POST /auth/oauth/google
 */
router.post("/oauth/google", oauthGoogleLogin);

/**
 * Check if email exists
 * POST /auth/check-email
 */
router.post("/check-email", checkEmail);

export default router;
