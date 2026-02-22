/**
 * Server Configuration
 *
 * Central configuration for all server URLs.
 * Configure once in .env, use everywhere.
 *
 * Environment variables:
 * - EXPO_PUBLIC_SERVER_URL: Base URL for the mobile-player server (e.g., http://10.0.0.35:3001)
 */

const SERVER_URL =
  process.env.EXPO_PUBLIC_SERVER_URL || "http://localhost:3001";

export const serverConfig = {
  /** Base server URL for Socket.io and API calls */
  baseUrl: SERVER_URL,

  /** API endpoint base */
  apiUrl: `${SERVER_URL}/api`,

  /** OAuth endpoint */
  oauthUrl: `${SERVER_URL}/auth/google`,
};

export default serverConfig;
