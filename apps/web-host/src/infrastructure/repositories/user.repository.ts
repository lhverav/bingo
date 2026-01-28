import { User, CreateUserData, UpdateUserData } from '@bingo/domain';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '../database/schemas/user.schema';
import { UserMapper } from '../database/mappers/user.mapper';

/**
 * Repository for User entity
 * Handles all database operations for users
 */
export class UserRepository {
  /**
   * Find a user by ID
   */
  async findById(id: string): Promise<User | null> {
    await connectToDatabase();
    const doc = await UserModel.findById(id);
    return doc ? UserMapper.toDomain(doc) : null;
  }

  /**
   * Find a user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    await connectToDatabase();
    const doc = await UserModel.findOne({ email: email.toLowerCase() });
    return doc ? UserMapper.toDomain(doc) : null;
  }

  /**
   * Create a new user
   */
  async create(data: CreateUserData): Promise<User> {
    await connectToDatabase();
    const dbData = UserMapper.toDatabase(data);
    const doc = await UserModel.create(dbData);
    return UserMapper.toDomain(doc);
  }

  /**
   * Update a user
   */
  async update(id: string, data: UpdateUserData): Promise<User | null> {
    await connectToDatabase();
    const dbData = UserMapper.toUpdateDatabase(data);
    const doc = await UserModel.findByIdAndUpdate(id, dbData, {
      new: true,
      runValidators: true,
    });
    return doc ? UserMapper.toDomain(doc) : null;
  }

  /**
   * Delete a user
   */
  async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    const result = await UserModel.findByIdAndDelete(id);
    return result !== null;
  }
}

// Singleton instance for convenience
export const userRepository = new UserRepository();
