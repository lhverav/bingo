import {
  MobileUser,
  CreateMobileUserData,
  AuthResult,
  LoginCredentials,
  OAuthData,
} from '@bingo/domain';
import { mobileUserRepository } from '../repositories';
import { MobileUserMapper } from '../database/mappers';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// JWT secret - should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'bingo-mobile-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

/**
 * MobileUser service - Business logic for mobile user operations
 */

/**
 * Register a new mobile user
 * Throws error if email/phone already exists
 */
export async function register(
  data: CreateMobileUserData
): Promise<AuthResult> {
  // Check for duplicate email
  if (data.email) {
    const existingEmail = await mobileUserRepository.emailExists(data.email);
    if (existingEmail) {
      throw new Error('EMAIL_EXISTS');
    }
  }

  // Check for duplicate phone
  if (data.phone) {
    const existingPhone = await mobileUserRepository.phoneExists(data.phone);
    if (existingPhone) {
      throw new Error('PHONE_EXISTS');
    }
  }

  // Check for duplicate OAuth
  if (data.oauthProvider && data.oauthProviderId) {
    const existingOAuth = await mobileUserRepository.findByOAuth(
      data.oauthProvider,
      data.oauthProviderId
    );
    if (existingOAuth) {
      throw new Error('OAUTH_EXISTS');
    }
  }

  // Hash password if provided
  let hashedPassword: string | undefined;
  if (data.password) {
    hashedPassword = await bcrypt.hash(data.password, 10);
  }

  // Create user
  const user = await mobileUserRepository.create(data, hashedPassword);

  // Generate token
  const token = generateToken(user.id);
  const expiresAt = getExpirationDate();

  return {
    user: MobileUserMapper.toSafeUser(user),
    token,
    expiresAt,
  };
}

/**
 * Login with email and password
 * Returns null if credentials are invalid
 */
export async function loginWithEmail(
  credentials: LoginCredentials
): Promise<AuthResult | null> {
  const user = await mobileUserRepository.findByEmail(credentials.email);

  if (!user || !user.passwordHash) {
    return null;
  }

  const isPasswordValid = await bcrypt.compare(
    credentials.password,
    user.passwordHash
  );

  if (!isPasswordValid) {
    return null;
  }

  // Update last login
  await mobileUserRepository.updateLastLogin(user.id);

  // Generate token
  const token = generateToken(user.id);
  const expiresAt = getExpirationDate();

  return {
    user: MobileUserMapper.toSafeUser(user),
    token,
    expiresAt,
  };
}

/**
 * Login with phone number (for SMS-verified returning users)
 * Returns null if phone not found
 */
export async function loginWithPhoneNumber(
  phone: string
): Promise<AuthResult | null> {
  const user = await mobileUserRepository.findByPhone(phone);

  if (!user) {
    return null;
  }

  // Update last login
  await mobileUserRepository.updateLastLogin(user.id);

  // Generate token
  const token = generateToken(user.id);
  const expiresAt = getExpirationDate();

  return {
    user: MobileUserMapper.toSafeUser(user),
    token,
    expiresAt,
  };
}

/**
 * OAuth login result types
 */
export type OAuthLoginResult =
  | { user: AuthResult }
  | { isNewUser: true; oauthData: OAuthData }
  | { emailExistsWithDifferentMethod: true; existingMethod: 'email' | 'phone'; email: string };

/**
 * Login or check OAuth user
 * Returns user if exists, conflict info if email exists via different method,
 * or isNewUser flag if truly new user
 */
export async function loginWithOAuth(data: OAuthData): Promise<OAuthLoginResult> {
  // 1. Check if user exists by OAuth provider + id
  const existingOAuthUser = await mobileUserRepository.findByOAuth(
    data.provider,
    data.providerId
  );

  if (existingOAuthUser) {
    // Update last login
    await mobileUserRepository.updateLastLogin(existingOAuthUser.id);

    // Generate token
    const token = generateToken(existingOAuthUser.id);
    const expiresAt = getExpirationDate();

    return {
      user: {
        user: MobileUserMapper.toSafeUser(existingOAuthUser),
        token,
        expiresAt,
      },
    };
  }

  // 2. Check if email exists via different auth method
  if (data.email) {
    const existingEmailUser = await mobileUserRepository.findByEmail(data.email);
    if (existingEmailUser) {
      // Email exists but registered via different method
      const existingMethod = existingEmailUser.passwordHash ? 'email' : 'phone';
      return {
        emailExistsWithDifferentMethod: true,
        existingMethod,
        email: data.email,
      };
    }
  }

  // 3. Truly new user - return OAuth data for registration flow
  return {
    isNewUser: true,
    oauthData: data,
  };
}

/**
 * Verify JWT token and return user
 */
export async function verifyToken(token: string): Promise<MobileUser | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await mobileUserRepository.findById(decoded.userId);
    return user;
  } catch {
    return null;
  }
}

/**
 * Get user by ID (without password hash)
 */
export async function getMobileUserById(
  id: string
): Promise<Omit<MobileUser, 'passwordHash'> | null> {
  const user = await mobileUserRepository.findById(id);
  return user ? MobileUserMapper.toSafeUser(user) : null;
}

/**
 * Update user profile
 */
export async function updateProfile(
  id: string,
  data: Partial<Pick<MobileUser, 'name' | 'birthdate' | 'gender' | 'noAds' | 'shareData' | 'notificationsEnabled'>>
): Promise<Omit<MobileUser, 'passwordHash'> | null> {
  const user = await mobileUserRepository.update(id, data);
  return user ? MobileUserMapper.toSafeUser(user) : null;
}

/**
 * Check if email exists
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  return mobileUserRepository.emailExists(email);
}

/**
 * Auth method type for email check
 */
export type AuthMethod = 'email' | 'phone' | 'google' | 'facebook' | 'apple';

/**
 * Check if email exists and return the auth method used
 */
export async function checkEmailWithAuthMethod(
  email: string
): Promise<{ exists: boolean; authMethod?: AuthMethod }> {
  const user = await mobileUserRepository.findByEmail(email);

  if (!user) {
    return { exists: false };
  }

  // Determine auth method
  let authMethod: AuthMethod;
  if (user.oauthProvider) {
    authMethod = user.oauthProvider as AuthMethod;
  } else if (user.passwordHash) {
    authMethod = 'email';
  } else if (user.phone) {
    authMethod = 'phone';
  } else {
    authMethod = 'email'; // fallback
  }

  return { exists: true, authMethod };
}

/**
 * Check if phone exists
 */
export async function checkPhoneExists(phone: string): Promise<boolean> {
  return mobileUserRepository.phoneExists(phone);
}

/**
 * Link OAuth provider to existing account after password verification
 * Returns AuthResult on success, null if password is invalid
 */
export async function linkOAuthToAccount(
  email: string,
  password: string,
  oauthProvider: 'google' | 'facebook' | 'apple',
  oauthProviderId: string
): Promise<AuthResult | null> {
  // Find user by email
  const user = await mobileUserRepository.findByEmail(email);

  if (!user || !user.passwordHash) {
    return null;
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    return null;
  }

  // Link OAuth to account
  const updatedUser = await mobileUserRepository.linkOAuth(
    user.id,
    oauthProvider,
    oauthProviderId
  );

  if (!updatedUser) {
    return null;
  }

  // Update last login
  await mobileUserRepository.updateLastLogin(updatedUser.id);

  // Generate token
  const token = generateToken(updatedUser.id);
  const expiresAt = getExpirationDate();

  return {
    user: MobileUserMapper.toSafeUser(updatedUser),
    token,
    expiresAt,
  };
}

// Helper functions

function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function getExpirationDate(): Date {
  const now = new Date();
  now.setDate(now.getDate() + 7); // 7 days from now
  return now;
}
