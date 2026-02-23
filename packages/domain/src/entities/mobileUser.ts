/**
 * MobileUser entity - represents a registered mobile player
 *
 * Authentication: User registers with ONE primary method:
 * - Email + password
 * - Phone + SMS verification
 * - OAuth (Google)
 */

export interface MobileUser {
  id: string;

  // Authentication (at least ONE required)
  email?: string;
  passwordHash?: string;
  phone?: string;
  phoneVerified?: boolean;
  oauthProvider?: 'google' | 'facebook' | 'apple';
  oauthProviderId?: string;

  // Profile (required)
  name: string;
  birthdate: string; // YYYY-MM-DD format
  gender: 'masculino' | 'femenino' | 'otro' | 'prefiero_no_decir';

  // Preferences
  noAds: boolean;
  shareData: boolean;
  notificationsEnabled: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface CreateMobileUserData {
  // Auth method (one required)
  email?: string;
  password?: string; // Plain text, will be hashed by service
  phone?: string;
  oauthProvider?: 'google' | 'facebook' | 'apple';
  oauthProviderId?: string;
  oauthEmail?: string; // Email from OAuth provider

  // Profile
  name: string;
  birthdate: string;
  gender: 'masculino' | 'femenino' | 'otro' | 'prefiero_no_decir';

  // Preferences (defaults applied by service)
  noAds?: boolean;
  shareData?: boolean;
  notificationsEnabled?: boolean;
}

export interface AuthResult {
  user: Omit<MobileUser, 'passwordHash'>; // Never expose hash
  token: string;
  expiresAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface OAuthData {
  provider: 'google' | 'facebook' | 'apple';
  providerId: string;
  email?: string;
  suggestedName?: string;
}
