/**
 * Google OAuth2 Service
 *
 * Handles Google OAuth2 authentication flow:
 * 1. Generate authorization URL for user login
 * 2. Exchange authorization code for access tokens
 * 3. Decode user information from ID token
 */

import axios from "axios";
import jwt from "jsonwebtoken";
import { googleOAuthConfig } from "../config/oauth.google";

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  refresh_token?: string;
}

interface GoogleUserInfo {
  email: string;
  name: string;
  sub: string; // Google user ID
  email_verified?: boolean;
  picture?: string;
}

/**
 * Step 1: Generate Google Authorization URL
 * This URL is used to redirect the user to Google's login page
 */
export function getGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: googleOAuthConfig.clientId,
    redirect_uri: googleOAuthConfig.redirectUri,
    response_type: "code",
    scope: googleOAuthConfig.scope,
    access_type: "offline",
    prompt: "consent",
  });

  return `${googleOAuthConfig.oauthUri}?${params.toString()}`;
}

/**
 * Step 2: Exchange authorization code for tokens and decode user info
 * @param code - Authorization code received from Google callback
 * @returns User information and access token
 */
export async function exchangeCodeForUser(code: string): Promise<{
  user: GoogleUserInfo;
  accessToken: string;
}> {
  try {
    // Exchange authorization code for tokens
    const tokenResponse = await axios.post<GoogleTokenResponse>(
      googleOAuthConfig.tokenUri,
      new URLSearchParams({
        client_id: googleOAuthConfig.clientId,
        client_secret: googleOAuthConfig.clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: googleOAuthConfig.redirectUri,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // Decode the ID token to get user information
    // Note: In production, you should verify the JWT signature
    const decoded = jwt.decode(tokenResponse.data.id_token) as GoogleUserInfo;

    if (!decoded || !decoded.email) {
      throw new Error("Invalid ID token received from Google");
    }

    return {
      user: decoded,
      accessToken: tokenResponse.data.access_token,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Google OAuth token exchange failed:", error.response?.data || error.message);
      throw new Error(`OAuth token exchange failed: ${error.response?.data?.error || error.message}`);
    }
    throw error;
  }
}
