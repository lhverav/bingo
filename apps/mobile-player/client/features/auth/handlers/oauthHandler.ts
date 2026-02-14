import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

// Complete auth session for web browser
WebBrowser.maybeCompleteAuthSession();

export interface OAuthResult {
  success: boolean;
  email?: string;
  name?: string;
  token?: string;
  providerId?: string;
  error?: string;
}

export interface GoogleAccount {
  email: string;
  name: string;
  picture?: string;
}

// Stored Google accounts (in a real app, this would be persisted)
let storedGoogleAccounts: GoogleAccount[] = [];

/**
 * Get previously used Google accounts
 */
export function getStoredGoogleAccounts(): GoogleAccount[] {
  return storedGoogleAccounts;
}

/**
 * Add a Google account to stored accounts
 */
function addStoredGoogleAccount(account: GoogleAccount) {
  const exists = storedGoogleAccounts.find((a) => a.email === account.email);
  if (!exists) {
    storedGoogleAccounts = [account, ...storedGoogleAccounts];
  }
}

/**
 * Configure Google OAuth
 * Note: You need to set up Google OAuth credentials in Google Cloud Console
 * and add the client IDs to your app.json/app.config.js
 */
export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    // These should be configured in your app.json or environment
    // expoClientId: 'YOUR_EXPO_CLIENT_ID',
    // iosClientId: 'YOUR_IOS_CLIENT_ID',
    // androidClientId: 'YOUR_ANDROID_CLIENT_ID',
    // webClientId: 'YOUR_WEB_CLIENT_ID',
    scopes: ['profile', 'email'],
    redirectUri: makeRedirectUri({
      scheme: 'bingotedeoro',
    }),
  });

  return { request, response, promptAsync };
}

/**
 * Handle Google OAuth flow
 */
export async function handleGoogleOAuth(
  promptAsync: () => Promise<any>
): Promise<OAuthResult> {
  try {
    const result = await promptAsync();

    if (result.type === 'success') {
      const { authentication } = result;

      if (!authentication?.accessToken) {
        return { success: false, error: 'No se obtuvo token de acceso' };
      }

      // Fetch user info from Google
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/userinfo/v2/me',
        {
          headers: { Authorization: `Bearer ${authentication.accessToken}` },
        }
      );

      const userInfo = await userInfoResponse.json();

      // Store the account for future use
      addStoredGoogleAccount({
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
      });

      return {
        success: true,
        email: userInfo.email,
        name: userInfo.name,
        token: authentication.accessToken,
        providerId: userInfo.id,
      };
    } else if (result.type === 'cancel') {
      return { success: false, error: 'Autenticacion cancelada' };
    } else {
      return { success: false, error: 'Error de autenticacion' };
    }
  } catch (error) {
    console.error('Google OAuth error:', error);
    return { success: false, error: 'Error de conexion con Google' };
  }
}

/**
 * Handle Facebook OAuth flow (placeholder)
 */
export async function handleFacebookOAuth(): Promise<OAuthResult> {
  // Facebook OAuth implementation would go here
  // For now, return not implemented
  return { success: false, error: 'Facebook OAuth no implementado' };
}

/**
 * Login with a previously stored Google account
 * This simulates "quick login" with a stored account
 */
export async function loginWithStoredGoogleAccount(
  account: GoogleAccount
): Promise<OAuthResult> {
  // In a real implementation, you might:
  // 1. Use stored refresh token to get new access token
  // 2. Or trigger a silent sign-in
  // For now, we'll just return the stored account info
  return {
    success: true,
    email: account.email,
    name: account.name,
  };
}
