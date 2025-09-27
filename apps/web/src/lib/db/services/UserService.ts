/**
 * User service for NCLEX311 application
 * Handles user-related database operations using Drizzle ORM
 */

import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { BaseService, PaginationParams, ServiceError } from './BaseService';
import { users, User, NewUser, UserUpdate } from '../schema';

/**
 * User search parameters
 */
export interface UserSearchParams extends PaginationParams {
  email?: string;
}

/**
 * User service class
 * Provides user-related database operations
 */
export class UserService extends BaseService {
  /**
   * Create a new user
   */
  async createUser(userData: NewUser): Promise<User> {
    return this.executeOperation(async () => {
      return await this.create(users, userData);
    }, 'createUser');
  }

  /**
   * Find user by ID
   */
  async findUserById(id: string): Promise<User | null> {
    return this.executeOperation(async () => {
      return await this.findById(users, id);
    }, 'findUserById');
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<User | null> {
    return this.executeOperation(async () => {
      const results = await this.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      return results[0] || null;
    }, 'findUserByEmail');
  }

  /**
   * Update user by ID
   */
  async updateUser(id: string, updates: UserUpdate): Promise<User | null> {
    return this.executeOperation(async () => {
      return await this.updateById(users, id, updates);
    }, 'updateUser');
  }

  /**
   * Delete user by ID
   */
  async deleteUser(id: string): Promise<boolean> {
    return this.executeOperation(async () => {
      return await this.deleteById(users, id);
    }, 'deleteUser');
  }

  /**
   * Check if user exists by email
   */
  async existsByEmail(email: string): Promise<boolean> {
    return this.executeOperation(async () => {
      const results = await this.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      return results.length > 0;
    }, 'existsByEmail');
  }

  /**
   * Search users with filters and pagination
   */
  async searchUsers(params: UserSearchParams = {}) {
    return this.executeOperation(async () => {
      const whereConditions: unknown[] = [];

      // Add email filter
      if (params.email) {
        whereConditions.push(eq(users.email, params.email));
      }

      // Combine conditions with AND
      const whereClause =
        whereConditions.length > 0
          ? whereConditions.length === 1
            ? whereConditions[0]
            : // eslint-disable-next-line @typescript-eslint/no-explicit-any
              and(...(whereConditions as any[]))
          : undefined;

      return await this.findWithPagination(users, params, whereClause);
    }, 'searchUsers');
  }

  /**
   * Get total user count
   */
  async getTotalUserCount(): Promise<number> {
    return this.executeOperation(async () => {
      const results = await this.db.select({ count: users.id }).from(users);

      return results.length;
    }, 'getTotalUserCount');
  }

  /**
   * Create or update user (upsert operation)
   * Useful for OAuth scenarios where user might already exist
   */
  async upsertUser(userData: NewUser): Promise<User> {
    return this.executeOperation(async () => {
      // Check if user exists by email
      const existingByEmail = userData.email
        ? await this.findUserByEmail(userData.email)
        : null;

      if (existingByEmail) {
        // Update existing user
        const updateData: UserUpdate = {
          email: userData.email,
          subscription: userData.subscription,
        };

        const updated = await this.updateUser(existingByEmail.id, updateData);
        if (!updated) {
          throw new ServiceError(
            'Failed to update existing user',
            'UPDATE_FAILED',
            500
          );
        }
        return updated;
      } else {
        // Create new user
        return await this.createUser(userData);
      }
    }, 'upsertUser');
  }

  /**
   * Batch create users
   * Useful for data import scenarios
   */
  async createUsers(usersData: NewUser[]): Promise<User[]> {
    return this.executeOperation(async () => {
      return await this.transaction(async tx => {
        const createdUsers: User[] = [];

        for (const userData of usersData) {
          const result = await tx.insert(users).values(userData).returning();

          createdUsers.push(result[0]);
        }

        return createdUsers;
      });
    }, 'createUsers');
  }

  /**
   * Get user profile information
   * Returns user data without sensitive information
   */
  async getUserProfile(id: string): Promise<Omit<User, 'passwordHash'> | null> {
    return this.executeOperation(async () => {
      const user = await this.findUserById(id);

      if (!user) {
        return null;
      }

      // Remove sensitive information
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...profile } = user;
      return profile;
    }, 'getUserProfile');
  }

  /**
   * Create a new user with hashed password
   */
  async registerUser(email: string, password: string): Promise<User> {
    return this.executeOperation(async () => {
      // Check if user already exists
      const existingUser = await this.findUserByEmail(email);
      if (existingUser) {
        throw new ServiceError(
          'User already exists with this email',
          'USER_ALREADY_EXISTS',
          409
        );
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user with hashed password
      const userData: NewUser = {
        email,
        passwordHash,
        subscription: 'FREE',
      };

      return await this.createUser(userData);
    }, 'registerUser');
  }

  /**
   * Authenticate user with email and password
   */
  async authenticateUser(
    email: string,
    password: string
  ): Promise<User | null> {
    return this.executeOperation(async () => {
      // Find user by email
      const user = await this.findUserByEmail(email);
      if (!user || !user.passwordHash) {
        return null;
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return null;
      }

      return user;
    }, 'authenticateUser');
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    return this.executeOperation(async () => {
      // Find user and verify current password
      const user = await this.findUserById(userId);
      if (!user || !user.passwordHash) {
        throw new ServiceError('User not found', 'USER_NOT_FOUND', 404);
      }

      // Verify current password
      const isCurrentValid = await bcrypt.compare(
        currentPassword,
        user.passwordHash
      );
      if (!isCurrentValid) {
        throw new ServiceError(
          'Current password is incorrect',
          'INVALID_CURRENT_PASSWORD',
          400
        );
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      // Update password
      const updated = await this.updateUser(userId, {
        passwordHash: newPasswordHash,
      });

      return updated !== null;
    }, 'changePassword');
  }

  /**
   * Reset user password (admin function)
   */
  async resetPassword(userId: string, newPassword: string): Promise<boolean> {
    return this.executeOperation(async () => {
      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 12);

      // Update password
      const updated = await this.updateUser(userId, {
        passwordHash,
      });

      return updated !== null;
    }, 'resetPassword');
  }
}
