import { pgTable, uuid, varchar, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// Define subscription tier enum to match actual database
// Note: Database has only 'FREE' and 'PREMIUM', not 'BASIC'
export const subscriptionEnum = pgEnum('subscription_tier', [
  'FREE',
  'PREMIUM',
]);

/**
 * Users table schema for NCLEX311 application
 * Aligned with actual database schema from 001_initial_schema.sql
 *
 * Actual database structure:
 * - id (UUID, primary key)
 * - email (VARCHAR(255), unique, not null)
 * - password_hash (VARCHAR(255), not null)
 * - subscription (subscription_tier enum, default 'FREE')
 * - created_at (TIMESTAMPTZ, default NOW())
 * - updated_at (TIMESTAMPTZ, default NOW())
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  subscription: subscriptionEnum('subscription').default('FREE').notNull(),
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
  'id' | 'email' | 'subscription' | 'createdAt'
>;
