/**
 * Authentication Controllers
 *
 * Handles OAuth2 authentication logic
 * Based on BingoteDeOro3 structure
 */

import { Request, Response } from "express";
import {
  getGoogleAuthUrl,
  exchangeCodeForUser,
} from "../services/googleOAuth.service";

// Deep link base URL for mobile app
// For Expo Go: exp://YOUR_IP:8081/--/
// For standalone app: bingo-player://
const MOBILE_APP_DEEP_LINK_BASE =
  process.env.MOBILE_APP_DEEP_LINK_BASE || "exp://localhost:8081/--/";

/**
 * Step 1: Initiate Google OAuth flow
 * Redirects user to Google's login page
 *
 * GET /auth/google
 */
export async function googleAuth(_req: Request, res: Response) {
  const authUrl = getGoogleAuthUrl();
  res.redirect(authUrl);
}

/**
 * Step 2: Handle Google OAuth callback
 * After user authenticates with Google, Google redirects back here with an authorization code
 * We exchange the code for user info, then redirect back to the mobile app with user data
 *
 * GET /auth/google/callback?code=...
 */
export async function googleCallback(req: Request, res: Response) {
  const { code } = req.query;

  if (!code || typeof code !== "string") {
    return res.status(400).send("No code received");
  }

  try {
    // Exchange authorization code for user information
    const { user } = await exchangeCodeForUser(code);

    console.log("User info:", user, "Date:", new Date().toISOString());

    // Encode user data as query parameters for deep link
    const email = encodeURIComponent(user.email || "");
    const name = encodeURIComponent(user.name || "");
    const googleId = encodeURIComponent(user.sub || "");

    // Create deep link back to mobile app with user data
    const deepLink = `${MOBILE_APP_DEEP_LINK_BASE}oauth-callback?email=${email}&name=${name}&googleId=${googleId}`;

    console.log("Redirecting to deep link:", deepLink);

    return res.redirect(deepLink);
  } catch (err) {
    const error = err as Error;
    console.error("TOKEN ERROR:", error.message);
    res.status(500).json({ error: "Token exchange failed" });
  }
}
