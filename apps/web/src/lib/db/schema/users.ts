import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
  boolean,
} from 'drizzle-orm/pg-core';

// Define subscription tier enum to match actual database
// Note: Database has only 'FREE' and 'PREMIUM', not 'BASIC'
export const subscriptionEnum = pgEnum('subscription_tier', [
  'FREE',
  'PREMIUM',
]);

/**
 * Users table schema for NCLEX311 application
 * Aligned with actual database schema from 001_initial_schema.sql
 * Updated in Migration 008 to add subscription management fields
 *
 * Actual database structure:
 * - id (UUID, primary key)
 * - email (VARCHAR(255), unique, not null)
 * - password_hash (VARCHAR(255), not null)
 * - subscription (subscription_tier enum, default 'FREE')
 * - subscription_status (VARCHAR(50), default 'free') [added in 008]
 * - subscription_plan (VARCHAR(50)) [added in 008]
 * - subscription_expires_at (TIMESTAMPTZ) [added in 008]
 * - subscription_started_at (TIMESTAMPTZ) [added in 008]
 * - auto_renew (BOOLEAN, default false) [added in 008]
 * - created_at (TIMESTAMPTZ, default NOW())
 * - updated_at (TIMESTAMPTZ, default NOW())
 *
 * @see Migration 008_add_payment_tables.sql
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  subscription: subscriptionEnum('subscription').default('FREE').notNull(),
  // Subscription management fields (added in Migration 008)
  subscriptionStatus: varchar('subscription_status', { length: 50 })
    .default('free')
    .notNull(),
  subscriptionPlan: varchar('subscription_plan', { length: 50 }),
  subscriptionExpiresAt: timestamp('subscription_expires_at', {
    withTimezone: true,
  }),
  subscriptionStartedAt: timestamp('subscription_started_at', {
    withTimezone: true,
  }),
  autoRenew: boolean('auto_renew').default(false).notNull(),
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Export inferred types for use throughout the application
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserUpdate = Partial<Omit<User, 'id' | 'createdAt'>>;

// Additional convenience types
export type PublicUser = Omit<User, 'passwordHash'>;
export type UserProfile = Pick<
  User,
  | 'id'
  | 'email'
  | 'subscription'
  | 'subscriptionStatus'
  | 'subscriptionPlan'
  | 'createdAt'
>;

// Subscription-specific types
export type SubscriptionStatus = 'free' | 'premium' | 'expired' | 'cancelled';
export type SubscriptionPlanType = 'monthly_premium' | 'annual_premium' | null;

/**
 * User subscription information
 */
export type UserSubscription = {
  status: SubscriptionStatus;
  plan: SubscriptionPlanType;
  expiresAt: Date | null;
  startedAt: Date | null;
  autoRenew: boolean;
};
