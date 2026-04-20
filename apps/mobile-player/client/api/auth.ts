/**
 * Auth API Client
 *
 * API functions for authentication operations.
 */

import { serverConfig } from "@/config/server";

const AUTH_URL = `${serverConfig.baseUrl}/auth`;

// =============================================================================
// TYPES
// =============================================================================

export interface RegisterUserData {
  // Identity
  email?: string;
  password?: string;
  phone?: string;
  oauthEmail?: string;
  oauthProviderId?: string;
  oauthProvider?: 'google' | 'facebook' | 'apple';

  // Profile
  birthdate: string;
  gender: 'masculino' | 'femenino' | 'otro' | 'prefiero_no_decir';
  name: string;

  // Preferences
  noAds?: boolean;
  shareData?: boolean;
  notificationsEnabled?: boolean;
}

export interface User {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  birthdate: string;
  gender: string;
  noAds: boolean;
  shareData: boolean;
  notificationsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  expiresAt: string;
}

export interface OAuthCheckResponse {
  user?: LoginResponse;
  isNewUser?: boolean;
  oauthData?: {
    provider: string;
    providerId: string;
    email?: string;
    suggestedName?: string;
  };
  // Email conflict detection
  emailExistsWithDifferentMethod?: boolean;
  existingMethod?: 'email' | 'phone';
  email?: string;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

export type AuthMethod = 'email' | 'phone' | 'google' | 'facebook' | 'apple';

export interface CheckEmailResult {
  exists: boolean;
  authMethod?: AuthMethod;
}

/**
 * Check if an email already exists and get the auth method used
 */
export async function checkEmailExists(email: string): Promise<CheckEmailResult> {
  try {
    const response = await fetch(`${AUTH_URL}/check-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error('Failed to check email');
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking email:', error);
    throw error;
  }
}

/**
 * Check if a phone number already exists in the system
 */
export async function checkPhoneExists(phone: string): Promise<boolean> {
  try {
    const response = await fetch(`${AUTH_URL}/check-phone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });

    if (!response.ok) {
      throw new Error('Failed to check phone');
    }

    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error('Error checking phone:', error);
    throw error;
  }
}

/**
 * Login with phone number (for returning users after SMS verification)
 */
export async function loginWithPhone(phone: string): Promise<LoginResponse> {
  try {
    const response = await fetch(`${AUTH_URL}/login-phone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error logging in with phone:', error);
    throw error;
  }
}

/**
 * Register a new user
 */
export async function registerUser(userData: RegisterUserData): Promise<LoginResponse> {
  try {
    const response = await fetch(`${AUTH_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
}

/**
 * Login with email and password
 */
export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${AUTH_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  return await response.json();
}

/**
 * Send SMS verification code to phone number
 */
export async function sendSmsCode(phone: string): Promise<void> {
  try {
    const response = await fetch(`${AUTH_URL}/send-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send SMS');
    }
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
}

/**
 * Verify SMS code
 */
export async function verifySmsCode(phone: string, code: string): Promise<boolean> {
  try {
    const response = await fetch(`${AUTH_URL}/verify-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Verification failed');
    }

    const data = await response.json();
    return data.verified;
  } catch (error) {
    console.error('Error verifying SMS:', error);
    throw error;
  }
}

/**
 * Check OAuth user (returns existing user or isNewUser flag)
 */
export async function checkOAuthUser(
  provider: 'google',
  providerId: string,
  email?: string,
  suggestedName?: string
): Promise<OAuthCheckResponse> {
  try {
    const response = await fetch(`${AUTH_URL}/oauth/${provider}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId, email, suggestedName }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'OAuth check failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking OAuth user:', error);
    throw error;
  }
}

/**
 * Link OAuth provider to existing account (requires password verification)
 */
export async function linkOAuthToAccount(
  email: string,
  password: string,
  oauthProvider: 'google' | 'facebook' | 'apple',
  oauthProviderId: string
): Promise<LoginResponse> {
  const response = await fetch(`${AUTH_URL}/link-oauth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, oauthProvider, oauthProviderId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to link account');
  }

  return await response.json();
}
