/**
 * User service for NCLEX311 application
 * Handles user-related database operations using Drizzle ORM
 */

import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { BaseService, PaginationParams, ServiceError } from './BaseService';
import {
  users,
  User,
  NewUser,
  UserUpdate,
  type SubscriptionStatus,
  type SubscriptionPlanType,
  type UserSubscription,
} from '../schema';

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

  // ============================================================================
  // Subscription Management Methods (Story 2.1)
  // ============================================================================

  /**
   * Update user subscription status
   *
   * @param userId - User ID
   * @param subscriptionData - Subscription data to update
   * @returns Updated user
   *
   * @example
   * ```typescript
   * const user = await userService.updateSubscription(userId, {
   *   status: 'premium',
   *   plan: 'monthly_premium',
   *   expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
   *   startedAt: new Date(),
   *   autoRenew: true,
   * });
   * ```
   */
  async updateSubscription(
    userId: string,
    subscriptionData: {
      status: SubscriptionStatus;
      plan: SubscriptionPlanType;
      expiresAt: Date | null;
      startedAt: Date | null;
      autoRenew: boolean;
    }
  ): Promise<User> {
    return this.executeOperation(async () => {
      const updates: UserUpdate = {
        subscriptionStatus: subscriptionData.status,
        subscriptionPlan: subscriptionData.plan,
        subscriptionExpiresAt: subscriptionData.expiresAt,
        subscriptionStartedAt: subscriptionData.startedAt,
        autoRenew: subscriptionData.autoRenew,
        updatedAt: new Date(),
      };

      const updated = await this.updateUser(userId, updates);

      if (!updated) {
        throw new ServiceError(
          'Failed to update subscription',
          'SUBSCRIPTION_UPDATE_FAILED',
          500,
          { userId }
        );
      }

      return updated;
    }, 'updateSubscription');
  }

  /**
   * Activate premium subscription
   *
   * @param userId - User ID
   * @param plan - Subscription plan type
   * @param expiresAt - Subscription expiration date
   * @param autoRenew - Auto-renewal flag
   * @returns Updated user
   */
  async activatePremiumSubscription(
    userId: string,
    plan: SubscriptionPlanType,
    expiresAt: Date,
    autoRenew: boolean = false
  ): Promise<User> {
    return this.updateSubscription(userId, {
      status: 'premium',
      plan,
      expiresAt,
      startedAt: new Date(),
      autoRenew,
    });
  }

  /**
   * Cancel subscription auto-renewal
   *
   * @param userId - User ID
   * @returns Updated user
   *
   * @example
   * ```typescript
   * const user = await userService.cancelAutoRenewal(userId);
   * // User retains access until subscription_expires_at
   * ```
   */
  async cancelAutoRenewal(userId: string): Promise<User> {
    return this.executeOperation(async () => {
      const user = await this.findUserById(userId);

      if (!user) {
        throw new ServiceError('User not found', 'USER_NOT_FOUND', 404, {
          userId,
        });
      }

      if (user.subscriptionPlan !== 'monthly_premium') {
        throw new ServiceError(
          'Only monthly subscriptions support cancellation',
          'INVALID_SUBSCRIPTION_TYPE',
          400,
          { userId, plan: user.subscriptionPlan }
        );
      }

      const updated = await this.updateUser(userId, {
        autoRenew: false,
        updatedAt: new Date(),
      });

      if (!updated) {
        throw new ServiceError(
          'Failed to cancel auto-renewal',
          'CANCEL_FAILED',
          500,
          { userId }
        );
      }

      return updated;
    }, 'cancelAutoRenewal');
  }

  /**
   * Expire user subscription
   *
   * @param userId - User ID
   * @returns Updated user
   */
  async expireSubscription(userId: string): Promise<User> {
    return this.updateSubscription(userId, {
      status: 'expired',
      plan: null,
      expiresAt: null,
      startedAt: null,
      autoRenew: false,
    });
  }

  /**
   * Get user subscription information
   *
   * @param userId - User ID
   * @returns User subscription details
   *
   * @example
   * ```typescript
   * const subscription = await userService.getSubscription(userId);
   * if (subscription.status === 'premium' && subscription.plan === 'monthly_premium') {
   *   console.log(`Premium until: ${subscription.expiresAt}`);
   *   console.log(`Auto-renew: ${subscription.autoRenew}`);
   * }
   * ```
   */
  async getSubscription(userId: string): Promise<UserSubscription | null> {
    return this.executeOperation(async () => {
      const user = await this.findUserById(userId);

      if (!user) {
        return null;
      }

      return {
        status: user.subscriptionStatus as SubscriptionStatus,
        plan: user.subscriptionPlan as SubscriptionPlanType,
        expiresAt: user.subscriptionExpiresAt,
        startedAt: user.subscriptionStartedAt,
        autoRenew: user.autoRenew,
      };
    }, 'getSubscription');
  }

  /**
   * Check if user has active premium subscription
   *
   * @param userId - User ID
   * @returns true if user has active premium access
   */
  async hasPremiumAccess(userId: string): Promise<boolean> {
    return this.executeOperation(async () => {
      const user = await this.findUserById(userId);

      if (!user) {
        return false;
      }

      // Check if subscription is premium and not expired
      if (user.subscriptionStatus !== 'premium') {
        return false;
      }

      // Check expiration date if set
      if (user.subscriptionExpiresAt) {
        const now = new Date();
        return user.subscriptionExpiresAt > now;
      }

      return true;
    }, 'hasPremiumAccess');
  }
}
