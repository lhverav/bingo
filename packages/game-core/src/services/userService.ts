import { User, CreateUserData } from '@bingo/domain';
import { userRepository } from '../repositories';
import bcrypt from 'bcryptjs';

/**
 * User service - Business logic for user operations
 * Uses UserRepository for data access
 */

/**
 * Find a user by credentials (email and password)
 * Returns null if credentials are invalid
 */
export async function findUserByCredentials(
  email: string,
  password: string
): Promise<User | null> {
  const user = await userRepository.findByEmail(email);

  if (!user) {
    return null;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return null;
  }

  return user;
}

/**
 * Get a user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  return userRepository.findById(id);
}

/**
 * Create a new user with hashed password
 */
export async function createUser(
  email: string,
  password: string,
  name: string,
  role: 'host' | 'admin' = 'host'
): Promise<User> {
  const hashedPassword = await bcrypt.hash(password, 10);

  const userData: CreateUserData = {
    email: email.toLowerCase(),
    password: hashedPassword,
    name,
    role,
  };

  return userRepository.create(userData);
}
