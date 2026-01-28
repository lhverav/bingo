import { UserRole } from '../value-objects';

/**
 * User entity - Pure domain object
 * Represents a host or admin user in the bingo system
 */
export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data required to create a new user
 */
export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

/**
 * Data allowed when updating a user
 */
export interface UpdateUserData {
  email?: string;
  password?: string;
  name?: string;
  role?: UserRole;
}
