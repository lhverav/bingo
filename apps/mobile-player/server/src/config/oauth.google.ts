/**
 * Google OAuth2 Configuration
 */

import dotenv from "dotenv";

// Load environment variables BEFORE reading them
dotenv.config();

export const googleOAuthConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID || "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  redirectUri: process.env.GOOGLE_REDIRECT_URI || "",
  scope: "openid email profile",
  oauthUri: process.env.GOOGLE_OAUTH_URI || "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUri: process.env.GOOGLE_TOKEN_URI || "https://oauth2.googleapis.com/token",
};

// Debug: Log configuration to verify .env is loaded
console.log("=== Google OAuth Config ===");
console.log("Client ID:", googleOAuthConfig.clientId ? "✓ Set" : "✗ Missing");
console.log("Client Secret:", googleOAuthConfig.clientSecret ? "✓ Set" : "✗ Missing");
console.log("Redirect URI:", googleOAuthConfig.redirectUri || "✗ MISSING!");
console.log("===========================");
