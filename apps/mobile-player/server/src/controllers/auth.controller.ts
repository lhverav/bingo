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
import {
  register,
  loginWithEmail,
  loginWithOAuth,
  linkOAuthToAccount,
  checkEmailWithAuthMethod,
  checkPhoneExists,
  loginWithPhoneNumber,
} from "@bingo/game-core";

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

/**
 * Register a new mobile user
 * POST /auth/register
 */
export async function registerUser(req: Request, res: Response) {
  try {
    const {
      email,
      password,
      phone,
      oauthProvider,
      oauthProviderId,
      oauthEmail,
      name,
      birthdate,
      gender,
      noAds,
      shareData,
      notificationsEnabled,
    } = req.body;

    // Validate required fields
    if (!name || !birthdate || !gender) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Nombre, fecha de nacimiento y género son requeridos',
      });
    }

    // Validate at least one auth method
    if (!email && !phone && !oauthProvider) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Se requiere email, teléfono o cuenta de Google',
      });
    }

    // If email auth, password is required
    if (email && !oauthProvider && !password) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'La contraseña es requerida',
      });
    }

    const result = await register({
      email: email || oauthEmail,
      password,
      phone,
      oauthProvider,
      oauthProviderId,
      oauthEmail,
      name,
      birthdate,
      gender,
      noAds,
      shareData,
      notificationsEnabled,
    });

    return res.status(201).json(result);
  } catch (err) {
    const error = err as Error;

    if (error.message === 'EMAIL_EXISTS') {
      return res.status(409).json({
        error: 'EMAIL_EXISTS',
        message: 'Este email ya está registrado',
      });
    }

    if (error.message === 'PHONE_EXISTS') {
      return res.status(409).json({
        error: 'PHONE_EXISTS',
        message: 'Este teléfono ya está registrado',
      });
    }

    if (error.message === 'OAUTH_EXISTS') {
      return res.status(409).json({
        error: 'OAUTH_EXISTS',
        message: 'Esta cuenta de Google ya está registrada',
      });
    }

    console.error('Register error:', error.message);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error al crear la cuenta',
    });
  }
}

/**
 * Login with email and password
 * POST /auth/login
 */
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Email y contraseña son requeridos',
      });
    }

    const result = await loginWithEmail({ email, password });

    if (!result) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Email o contraseña incorrectos',
      });
    }

    return res.json(result);
  } catch (err) {
    const error = err as Error;
    console.error('Login error:', error.message);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error al iniciar sesión',
    });
  }
}

/**
 * Login or check OAuth user
 * POST /auth/oauth/google
 */
export async function oauthGoogleLogin(req: Request, res: Response) {
  try {
    const { providerId, email, suggestedName } = req.body;

    if (!providerId) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Provider ID es requerido',
      });
    }

    const result = await loginWithOAuth({
      provider: 'google',
      providerId,
      email,
      suggestedName,
    });

    return res.json(result);
  } catch (err) {
    const error = err as Error;
    console.error('OAuth login error:', error.message);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error al iniciar sesión con Google',
    });
  }
}

/**
 * Check if email exists and return auth method
 * POST /auth/check-email
 */
export async function checkEmail(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Email es requerido',
      });
    }

    const result = await checkEmailWithAuthMethod(email);
    return res.json(result);
  } catch (err) {
    const error = err as Error;
    console.error('Check email error:', error.message);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error al verificar email',
    });
  }
}

/**
 * Check if phone exists (for smart detection)
 * POST /auth/check-phone
 */
export async function checkPhone(req: Request, res: Response) {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Teléfono es requerido',
      });
    }

    console.log('[checkPhone] Checking phone:', phone);
    const exists = await checkPhoneExists(phone);
    console.log('[checkPhone] Result:', exists);

    return res.json({ exists });
  } catch (err) {
    const error = err as Error;
    console.error('Check phone error:', error.message);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error al verificar teléfono',
    });
  }
}

/**
 * Login with phone number (for returning users after SMS verification)
 * POST /auth/login-phone
 */
export async function loginWithPhone(req: Request, res: Response) {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Teléfono es requerido',
      });
    }

    const result = await loginWithPhoneNumber(phone);

    if (!result) {
      return res.status(404).json({
        error: 'USER_NOT_FOUND',
        message: 'No existe una cuenta con este teléfono',
      });
    }

    return res.json(result);
  } catch (err) {
    const error = err as Error;
    console.error('Login with phone error:', error.message);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error al iniciar sesión',
    });
  }
}

/**
 * Link OAuth provider to existing account
 * Requires password verification for security
 * POST /auth/link-oauth
 */
export async function linkOAuth(req: Request, res: Response) {
  try {
    const { email, password, oauthProvider, oauthProviderId } = req.body;

    if (!email || !password || !oauthProvider || !oauthProviderId) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Email, contraseña y datos de OAuth son requeridos',
      });
    }

    const result = await linkOAuthToAccount(
      email,
      password,
      oauthProvider,
      oauthProviderId
    );

    if (!result) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Contraseña incorrecta',
      });
    }

    return res.json(result);
  } catch (err) {
    const error = err as Error;
    console.error('Link OAuth error:', error.message);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error al vincular cuenta',
    });
  }
}
