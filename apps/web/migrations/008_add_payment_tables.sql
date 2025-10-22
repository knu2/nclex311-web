-- Migration: 008_add_payment_tables.sql
-- Description: Add payment tables (orders, webhook_logs) and subscription fields to users table
-- Date: 2025-10-22
-- Dependencies: 001_initial_schema.sql (users table)
-- Story: 2.1 - Premium Subscription Workflow
-- Rollback: See rollback instructions at bottom

BEGIN;

-- ============================================================================
-- PART 1: Create Orders Table
-- ============================================================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- In centavos (e.g., 20000 = ₱200.00, 192000 = ₱1,920.00)
  currency VARCHAR(3) DEFAULT 'PHP' NOT NULL,
  status VARCHAR(50) NOT NULL, -- pending, paid, expired, failed, refunded
  plan_type VARCHAR(50) NOT NULL, -- 'monthly_premium' or 'annual_premium'
  is_recurring BOOLEAN DEFAULT FALSE NOT NULL, -- true for monthly subscriptions
  xendit_invoice_id VARCHAR(255),
  xendit_invoice_url VARCHAR(500),
  payment_method VARCHAR(100),
  paid_amount INTEGER,
  paid_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  failure_code VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add comment for documentation
COMMENT ON TABLE orders IS 'Payment orders for premium subscriptions via Xendit';
COMMENT ON COLUMN orders.amount IS 'Amount in centavos (20000 = ₱200, 192000 = ₱1,920)';
COMMENT ON COLUMN orders.plan_type IS 'Subscription plan: monthly_premium or annual_premium';
COMMENT ON COLUMN orders.is_recurring IS 'Auto-renewal flag: true for monthly, false for annual';

-- ============================================================================
-- PART 2: Create Webhook Logs Table (Idempotency)
-- ============================================================================
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add comment for documentation
COMMENT ON TABLE webhook_logs IS 'Xendit webhook logs for idempotency and audit trail';
COMMENT ON COLUMN webhook_logs.webhook_id IS 'Unique webhook ID from Xendit for idempotency checking';

-- ============================================================================
-- PART 3: Add Subscription Fields to Users Table
-- ============================================================================
ALTER TABLE users 
  ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'free' NOT NULL,
  ADD COLUMN subscription_plan VARCHAR(50), -- 'monthly_premium' or 'annual_premium'
  ADD COLUMN subscription_expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN subscription_started_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN auto_renew BOOLEAN DEFAULT FALSE NOT NULL; -- true for monthly, false for annual/cancelled

-- Add comments for documentation
COMMENT ON COLUMN users.subscription_status IS 'Current subscription status: free, premium, expired, cancelled';
COMMENT ON COLUMN users.subscription_plan IS 'Active plan type: monthly_premium or annual_premium';
COMMENT ON COLUMN users.auto_renew IS 'Auto-renewal flag: true for monthly with active renewal, false otherwise';

-- ============================================================================
-- PART 4: Create Indexes for Performance
-- ============================================================================

-- Orders table indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_order_id ON orders(order_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_xendit_invoice_id ON orders(xendit_invoice_id);
CREATE INDEX idx_orders_plan_type ON orders(plan_type);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Webhook logs indexes
CREATE INDEX idx_webhook_logs_webhook_id ON webhook_logs(webhook_id);
CREATE INDEX idx_webhook_logs_processed ON webhook_logs(processed);
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at);

-- Users subscription indexes
CREATE INDEX idx_users_subscription_status ON users(subscription_status);
CREATE INDEX idx_users_subscription_plan ON users(subscription_plan);
CREATE INDEX idx_users_subscription_expires_at ON users(subscription_expires_at);

-- ============================================================================
-- PART 5: Verify Schema
-- ============================================================================

-- Verify orders table
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- Verify webhook_logs table
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'webhook_logs'
ORDER BY ordinal_position;

-- Verify users table subscription columns
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name LIKE '%subscription%' OR column_name = 'auto_renew'
ORDER BY ordinal_position;

COMMIT;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================
-- To rollback this migration, execute the following:
--
-- BEGIN;
-- 
-- -- Drop indexes
-- DROP INDEX IF EXISTS idx_orders_user_id;
-- DROP INDEX IF EXISTS idx_orders_order_id;
-- DROP INDEX IF EXISTS idx_orders_status;
-- DROP INDEX IF EXISTS idx_orders_xendit_invoice_id;
-- DROP INDEX IF EXISTS idx_orders_plan_type;
-- DROP INDEX IF EXISTS idx_orders_created_at;
-- DROP INDEX IF EXISTS idx_webhook_logs_webhook_id;
-- DROP INDEX IF EXISTS idx_webhook_logs_processed;
-- DROP INDEX IF EXISTS idx_webhook_logs_created_at;
-- DROP INDEX IF EXISTS idx_users_subscription_status;
-- DROP INDEX IF EXISTS idx_users_subscription_plan;
-- DROP INDEX IF EXISTS idx_users_subscription_expires_at;
-- 
-- -- Remove subscription columns from users
-- ALTER TABLE users 
--   DROP COLUMN IF EXISTS subscription_status,
--   DROP COLUMN IF EXISTS subscription_plan,
--   DROP COLUMN IF EXISTS subscription_expires_at,
--   DROP COLUMN IF EXISTS subscription_started_at,
--   DROP COLUMN IF EXISTS auto_renew;
-- 
-- -- Drop tables
-- DROP TABLE IF EXISTS webhook_logs;
-- DROP TABLE IF EXISTS orders;
-- 
-- COMMIT;
