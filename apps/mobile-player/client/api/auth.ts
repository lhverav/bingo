/**
 * Auth API Client
 *
 * API functions for authentication operations.
 */

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

// =============================================================================
// TYPES
// =============================================================================

export interface RegisterUserData {
  // Identity
  email?: string;
  password?: string;
  phone?: string;
  phoneVerified?: boolean;
  oauthEmail?: string;
  oauthId?: string;
  oauthProvider?: string;

  // Profile
  birthdate: string;
  gender: string;
  name: string;

  // Preferences
  noAds: boolean;
  shareData: boolean;
}

export interface User {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  birthdate: string;
  gender: string;
  createdAt: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Check if an email already exists in the system
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/auth/check-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error('Failed to check email');
    }

    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error('Error checking email:', error);
    throw error;
  }
}

/**
 * Register a new user
 */
export async function registerUser(userData: RegisterUserData): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
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
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
}

/**
 * Send SMS verification code to phone number
 */
export async function sendSmsCode(phone: string): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/auth/send-sms`, {
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
    const response = await fetch(`${API_URL}/auth/verify-sms`, {
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
