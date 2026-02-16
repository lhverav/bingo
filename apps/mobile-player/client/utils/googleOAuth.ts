/**
 * Google OAuth Handler for Mobile App
 *
 * Handles the OAuth flow on the mobile side:
 * 1. Opens browser to backend OAuth endpoint
 * 2. Backend redirects to Google
 * 3. User authenticates
 * 4. Google redirects back to backend
 * 5. Backend redirects to deep link with user data
 * 6. Deep link listener captures the data
 */

import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || "http://10.0.0.35:3001";

export interface GoogleOAuthResult {
  success: boolean;
  email?: string;
  name?: string;
  googleId?: string;
  error?: string;
}

/**
 * IMPORTANT: Call this at the module level of your app entry point
 * This completes the auth session when the browser redirects back to the app
 */
export function initializeOAuth() {
  console.log("🔐 Initializing OAuth...");
  WebBrowser.maybeCompleteAuthSession();

  // Check if app was opened with a deep link
  Linking.getInitialURL().then((url) => {
    if (url) {
      console.log("🔗 App opened with initial URL:", url);
    } else {
      console.log("🔗 No initial URL");
    }
  });
}

/**
 * Initiate Google OAuth flow
 * Opens a browser to the backend OAuth endpoint, which redirects to Google
 */
export async function initiateGoogleLogin(): Promise<void> {
  try {
    console.log("Opening Google OAuth flow...");
    console.log("Server URL:", SERVER_URL);

    // Open the OAuth endpoint
    // Note: If using ngrok, user may see a "Visit Site" warning page first
    const result = await WebBrowser.openBrowserAsync(`${SERVER_URL}/auth/google`);
    console.log("Browser result:", result);
  } catch (error) {
    console.error("Error opening Google OAuth:", error);
    throw error;
  }
}

/**
 * Set up deep link listener for OAuth callback
 * Call this in useEffect to listen for the OAuth callback
 *
 * @param onResult - Callback function to handle the OAuth result
 * @returns Cleanup function to remove the listener
 */
export function setupOAuthListener(
  onResult: (result: GoogleOAuthResult) => void
): () => void {
  console.log("🔗 OAuth listener initialized");

  const subscription = Linking.addEventListener("url", ({ url }) => {
    console.log("🔗 Deep link received:", url);

    // Parse the deep link URL
    const parsed = Linking.parse(url);
    console.log("🔗 Parsed:", JSON.stringify(parsed, null, 2));

    // Check if this is our app's scheme
    if (parsed.scheme !== "bingo-player") {
      console.log("🔗 Wrong scheme, ignoring. Scheme:", parsed.scheme);
      return;
    }

    // Check if this is an OAuth callback (by hostname or path)
    const isOAuthCallback =
      parsed.hostname === "oauth-callback" ||
      parsed.path === "oauth-callback" ||
      parsed.path === "/oauth-callback";

    if (!isOAuthCallback) {
      console.log("🔗 Not an OAuth callback, ignoring. Hostname:", parsed.hostname, "Path:", parsed.path);
      return;
    }

    console.log("🔗 OAuth callback detected!");

    const params = parsed.queryParams;

    // Check for error
    if (params?.error) {
      onResult({
        success: false,
        error: String(params.error),
      });
      return;
    }

    // Extract user data
    const email = params?.email ? String(params.email) : undefined;
    const name = params?.name ? String(params.name) : undefined;
    const googleId = params?.googleId ? String(params.googleId) : undefined;

    if (email && name && googleId) {
      onResult({
        success: true,
        email,
        name,
        googleId,
      });
    } else {
      onResult({
        success: false,
        error: "Missing required user data from OAuth callback",
      });
    }
  });

  // Return cleanup function
  return () => subscription.remove();
}
