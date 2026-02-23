import { MobileUser, CreateMobileUserData } from '@bingo/domain';
import { MobileUserDocument } from '../schemas/mobileUser.schema';

/**
 * Mapper for MobileUser entity <-> MobileUserDocument conversion
 * Handles translation between domain and database layers
 */
export class MobileUserMapper {
  /**
   * Convert database document to domain entity
   */
  static toDomain(doc: MobileUserDocument): MobileUser {
    return {
      id: doc._id.toString(),
      // Auth
      email: doc.email,
      passwordHash: doc.passwordHash,
      phone: doc.phone,
      phoneVerified: doc.phoneVerified,
      oauthProvider: doc.oauthProvider,
      oauthProviderId: doc.oauthProviderId,
      // Profile
      name: doc.name,
      birthdate: doc.birthdate,
      gender: doc.gender,
      // Preferences
      noAds: doc.noAds,
      shareData: doc.shareData,
      notificationsEnabled: doc.notificationsEnabled,
      // Metadata
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      lastLoginAt: doc.lastLoginAt,
    };
  }

  /**
   * Convert domain entity to domain entity WITHOUT passwordHash
   * Used for API responses
   */
  static toSafeUser(user: MobileUser): Omit<MobileUser, 'passwordHash'> {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Convert create data to database document format
   * Note: password hashing happens in service layer
   */
  static toDatabase(
    data: CreateMobileUserData,
    hashedPassword?: string
  ): Record<string, unknown> {
    return {
      // Auth
      email: data.email,
      passwordHash: hashedPassword,
      phone: data.phone,
      phoneVerified: false,
      oauthProvider: data.oauthProvider,
      oauthProviderId: data.oauthProviderId,
      // Profile
      name: data.name,
      birthdate: data.birthdate,
      gender: data.gender,
      // Preferences
      noAds: data.noAds ?? false,
      shareData: data.shareData ?? false,
      notificationsEnabled: data.notificationsEnabled ?? true,
    };
  }

  /**
   * Convert update data to database update format
   * Only includes fields that are present
   */
  static toUpdateDatabase(
    data: Partial<MobileUser>
  ): Record<string, unknown> {
    const update: Record<string, unknown> = {};

    // Profile updates
    if (data.name !== undefined) update.name = data.name;
    if (data.birthdate !== undefined) update.birthdate = data.birthdate;
    if (data.gender !== undefined) update.gender = data.gender;

    // Preference updates
    if (data.noAds !== undefined) update.noAds = data.noAds;
    if (data.shareData !== undefined) update.shareData = data.shareData;
    if (data.notificationsEnabled !== undefined) {
      update.notificationsEnabled = data.notificationsEnabled;
    }

    // Metadata
    if (data.lastLoginAt !== undefined) update.lastLoginAt = data.lastLoginAt;

    return update;
  }
}
