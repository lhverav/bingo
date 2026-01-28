import { User, CreateUserData, UpdateUserData } from '@bingo/domain';
import { UserDocument } from '../schemas/user.schema';

/**
 * Mapper for User entity <-> UserDocument conversion
 * Handles translation between domain and database layers
 */
export class UserMapper {
  /**
   * Convert database document to domain entity
   */
  static toDomain(doc: UserDocument): User {
    return {
      id: doc._id.toString(),
      email: doc.email,
      password: doc.password,
      name: doc.name,
      role: doc.role,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  /**
   * Convert domain entity to database document format
   * Used for creating new documents
   */
  static toDatabase(data: CreateUserData): Record<string, unknown> {
    return {
      email: data.email,
      password: data.password,
      name: data.name,
      role: data.role ?? 'host',
    };
  }

  /**
   * Convert update data to database update format
   * Only includes fields that are present in the update data
   */
  static toUpdateDatabase(data: UpdateUserData): Record<string, unknown> {
    const update: Record<string, unknown> = {};

    if (data.email !== undefined) update.email = data.email;
    if (data.password !== undefined) update.password = data.password;
    if (data.name !== undefined) update.name = data.name;
    if (data.role !== undefined) update.role = data.role;

    return update;
  }
}
