import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Orders table schema for Xendit payment integration
 * Tracks premium subscription orders and payment status
 *
 * @see Story 2.1 - Premium Subscription Workflow
 * @see Migration 008_add_payment_tables.sql
 */
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: varchar('order_id', { length: 255 }).notNull().unique(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(), // In centavos (20000 = ₱200, 192000 = ₱1,920)
  currency: varchar('currency', { length: 3 }).default('PHP').notNull(),
  status: varchar('status', { length: 50 }).notNull(), // pending, paid, expired, failed, refunded
  planType: varchar('plan_type', { length: 50 }).notNull(), // monthly_premium, annual_premium
  isRecurring: boolean('is_recurring').default(false).notNull(), // true for monthly
  xenditInvoiceId: varchar('xendit_invoice_id', { length: 255 }),
  xenditInvoiceUrl: varchar('xendit_invoice_url', { length: 500 }),
  paymentMethod: varchar('payment_method', { length: 100 }),
  paidAmount: integer('paid_amount'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  failureCode: varchar('failure_code', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Webhook Logs table for idempotency tracking
 * Stores Xendit webhook payloads to prevent duplicate processing
 *
 * @see Story 2.1 - Premium Subscription Workflow
 * @see Migration 008_add_payment_tables.sql
 */
export const webhookLogs = pgTable('webhook_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  webhookId: varchar('webhook_id', { length: 255 }).notNull().unique(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  payload: jsonb('payload').notNull(),
  processed: boolean('processed').default(false).notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ============================================================================
// Type Exports for Orders
// ============================================================================

/** Order record from database (SELECT) */
export type Order = typeof orders.$inferSelect;

/** New order data for insertion (INSERT) */
export type NewOrder = typeof orders.$inferInsert;

/** Order update data (UPDATE) - excludes id and createdAt */
export type OrderUpdate = Partial<Omit<Order, 'id' | 'createdAt'>>;

// Convenience types for specific order statuses
export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'expired'
  | 'failed'
  | 'refunded';
export type PlanType = 'monthly_premium' | 'annual_premium';

/**
 * Order with user information (JOIN result)
 */
export type OrderWithUser = Order & {
  user: {
    id: string;
    email: string;
  };
};

// ============================================================================
// Type Exports for Webhook Logs
// ============================================================================

/** Webhook log record from database (SELECT) */
export type WebhookLog = typeof webhookLogs.$inferSelect;

/** New webhook log data for insertion (INSERT) */
export type NewWebhookLog = typeof webhookLogs.$inferInsert;

/** Webhook log update data (UPDATE) */
export type WebhookLogUpdate = Partial<Omit<WebhookLog, 'id' | 'createdAt'>>;

// ============================================================================
// Constants
// ============================================================================

/**
 * Subscription plan pricing in centavos (Philippine Pesos)
 * 100 centavos = ₱1.00
 */
export const PLAN_PRICING = {
  monthly_premium: 20000, // ₱200.00/month
  annual_premium: 192000, // ₱1,920.00/year (20% savings)
} as const;

/**
 * Subscription duration in days
 */
export const PLAN_DURATION = {
  monthly_premium: 30, // 30 days
  annual_premium: 365, // 365 days
} as const;

/**
 * Xendit invoice expiration time (24 hours from creation)
 */
export const INVOICE_EXPIRATION_HOURS = 24;
