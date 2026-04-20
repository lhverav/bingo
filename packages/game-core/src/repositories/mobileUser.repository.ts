import { MobileUser, CreateMobileUserData } from '@bingo/domain';
import { connectToDatabase } from '../database/connection';
import { MobileUserModel } from '../database/schemas';
import { MobileUserMapper } from '../database/mappers';

/**
 * Repository for MobileUser entity
 * Handles all database operations for mobile users
 */
export class MobileUserRepository {
  /**
   * Find a user by ID
   */
  async findById(id: string): Promise<MobileUser | null> {
    await connectToDatabase();
    const doc = await MobileUserModel.findById(id);
    return doc ? MobileUserMapper.toDomain(doc) : null;
  }

  /**
   * Find a user by email
   */
  async findByEmail(email: string): Promise<MobileUser | null> {
    await connectToDatabase();
    const doc = await MobileUserModel.findOne({ email: email.toLowerCase() });
    return doc ? MobileUserMapper.toDomain(doc) : null;
  }

  /**
   * Find a user by phone number
   */
  async findByPhone(phone: string): Promise<MobileUser | null> {
    await connectToDatabase();
    const doc = await MobileUserModel.findOne({ phone });
    return doc ? MobileUserMapper.toDomain(doc) : null;
  }

  /**
   * Find a user by OAuth provider and ID
   */
  async findByOAuth(
    provider: 'google' | 'facebook' | 'apple',
    providerId: string
  ): Promise<MobileUser | null> {
    await connectToDatabase();
    const doc = await MobileUserModel.findOne({
      oauthProvider: provider,
      oauthProviderId: providerId,
    });
    return doc ? MobileUserMapper.toDomain(doc) : null;
  }

  /**
   * Create a new mobile user
   * Password should already be hashed by the service layer
   */
  async create(
    data: CreateMobileUserData,
    hashedPassword?: string
  ): Promise<MobileUser> {
    await connectToDatabase();
    const dbData = MobileUserMapper.toDatabase(data, hashedPassword);
    const doc = await MobileUserModel.create(dbData);
    return MobileUserMapper.toDomain(doc);
  }

  /**
   * Update a user's profile
   */
  async update(
    id: string,
    data: Partial<MobileUser>
  ): Promise<MobileUser | null> {
    await connectToDatabase();
    const dbData = MobileUserMapper.toUpdateDatabase(data);
    const doc = await MobileUserModel.findByIdAndUpdate(id, dbData, {
      new: true,
      runValidators: true,
    });
    return doc ? MobileUserMapper.toDomain(doc) : null;
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<void> {
    await connectToDatabase();
    await MobileUserModel.findByIdAndUpdate(id, {
      lastLoginAt: new Date(),
    });
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    await connectToDatabase();
    const count = await MobileUserModel.countDocuments({
      email: email.toLowerCase(),
    });
    return count > 0;
  }

  /**
   * Check if phone exists
   */
  async phoneExists(phone: string): Promise<boolean> {
    await connectToDatabase();
    console.log('[mobileUserRepo] phoneExists query for:', phone);
    const count = await MobileUserModel.countDocuments({ phone });
    console.log('[mobileUserRepo] countDocuments result:', count);
    return count > 0;
  }

  /**
   * Delete a user
   */
  async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    const result = await MobileUserModel.findByIdAndDelete(id);
    return result !== null;
  }

  /**
   * Link OAuth provider to existing user
   */
  async linkOAuth(
    id: string,
    provider: 'google' | 'facebook' | 'apple',
    providerId: string
  ): Promise<MobileUser | null> {
    await connectToDatabase();
    const doc = await MobileUserModel.findByIdAndUpdate(
      id,
      {
        oauthProvider: provider,
        oauthProviderId: providerId,
      },
      { new: true, runValidators: true }
    );
    return doc ? MobileUserMapper.toDomain(doc) : null;
  }
}

// Singleton instance for convenience
export const mobileUserRepository = new MobileUserRepository();
