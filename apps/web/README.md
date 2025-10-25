# NCLEX311 Web Application

Nursing exam preparation platform with premium subscription features.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5.x (strict mode)
- **Database:** PostgreSQL 16 via Supabase
- **ORM:** Drizzle ORM v0.44.5
- **Authentication:** NextAuth v5 (Auth.js)
- **Payments:** Xendit Payment Gateway
- **Email:** SendGrid API
- **UI:** Material-UI (MUI) v6
- **Testing:** Jest 30.x + Playwright 1.55.x

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (via Supabase)
- Xendit account (for payments)
- SendGrid account (for emails)

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your credentials
```

### Environment Configuration

Create `.env.local` with the following variables:

#### Database (Supabase)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### Authentication (NextAuth v5)

```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_generated_secret
# Generate with: openssl rand -base64 32
```

#### Payment Integration (Xendit)

```bash
# Xendit API Keys
XENDIT_SECRET_KEY=xnd_test_xxxxx  # Use test key for development
XENDIT_WEBHOOK_TOKEN=your_webhook_verification_token

# Application URL for payment redirects
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Getting Xendit Credentials:**

1. Sign up at [Xendit Dashboard](https://dashboard.xendit.co)
2. Navigate to Settings → Developers → API Keys
3. Copy your **Secret Key** (starts with `xnd_`)
4. Navigate to Settings → Developers → Webhooks
5. Add webhook URL: `https://your-domain.com/api/webhooks/xendit`
6. Copy the **Webhook Verification Token**
7. Enable "Invoice Paid", "Invoice Expired", "Invoice Failed" events

**Testing with ngrok (Development):**

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Start ngrok tunnel
ngrok http 3000

# Use ngrok URL in Xendit webhook settings:
# https://your-subdomain.ngrok-free.app/api/webhooks/xendit
```

#### Email Service (SendGrid)

```bash
# SendGrid API Key
SENDGRID_API_KEY=SG.xxxxx

# Email sender configuration
EMAIL_FROM=noreply@nclex311.com
EMAIL_FROM_NAME=NCLEX311
```

**Getting SendGrid API Key:**

1. Sign up at [SendGrid](https://sendgrid.com)
2. Navigate to Settings → API Keys
3. Create new API key with "Mail Send" permissions
4. Verify sender email address in SendGrid dashboard

### Database Setup

```bash
# Apply migrations via Supabase Dashboard
# 1. Open Supabase Dashboard → SQL Editor
# 2. Execute migration files in order:
#    - migrations/008_add_payment_tables.sql

# Validate migration
npm run migrate
```

### Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run E2E tests
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint

# Code formatting
npm run format
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Payment Integration

### Subscription Plans

- **Monthly Premium:** ₱200/month (auto-renewing)
- **Annual Premium:** ₱1,920/year (one-time, 20% savings)

### Payment Flow

1. User clicks "Upgrade to Premium"
2. API creates order → calls Xendit → returns checkout URL
3. User redirects to Xendit hosted checkout
4. User completes payment (cards, GCash, Maya)
5. Xendit sends webhook → activates subscription
6. User returns → sees premium access

### Testing Payments

**Xendit Test Cards:**

- **Success:** `4000000000000002`
- **Failed:** `4000000000000010`
- **CVV:** any 3 digits
- **Expiry:** any future date

**Test Flow:**

1. Create test account
2. Click "Upgrade to Premium"
3. Select Monthly or Annual plan
4. Use test card at checkout
5. Verify webhook received (check terminal logs)
6. Verify subscription activated in database

### Monitoring

Payment events are logged with structured JSON for monitoring:

```json
{
  "timestamp": "2025-10-25T07:00:00Z",
  "level": "info",
  "service": "nclex311-web",
  "message": "Payment initiated",
  "event": "payment.initiated",
  "userId": "user_123",
  "orderId": "order_456",
  "planType": "monthly_premium",
  "amount": 20000,
  "amountPHP": 200
}
```

**Key Events:**

- `payment.initiated` - Order created
- `payment.completed` - Payment successful
- `payment.failed` - Payment failed
- `invoice.created` - Xendit invoice generated
- `webhook.received` - Webhook received from Xendit
- `webhook.processed` - Webhook processed successfully
- `subscription.activated` - Premium access granted
- `subscription.cancelled` - Auto-renewal cancelled

## Deployment

### Production Prerequisites

Before deploying to production, ensure you have:

1. ✅ **Xendit Production Account** - Account must be approved (2-4 week lead time)
2. ✅ **Production API Keys** - Separate from test/sandbox keys
3. ✅ **Bank Account Linked** - For payment settlements (T+3 to T+5)
4. ✅ **SendGrid Verified Domain** - Production sender email verified
5. ✅ **Database Migrations Applied** - Production database ready

---

### Vercel Deployment

#### 1. Push to GitHub

```bash
git push origin main
```

#### 2. Import to Vercel

- Go to [Vercel Dashboard](https://vercel.com/dashboard)
- Click "Add New Project"
- Import your GitHub repository
- Select `apps/web` as root directory
- Framework Preset: **Next.js** (auto-detected)
- Root Directory: `apps/web`

#### 3. Configure Environment Variables in Vercel

Go to **Settings → Environment Variables** and add the following:

**Database & Auth:**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your_production_secret  # Generate new with: openssl rand -base64 32
```

**Xendit Production Keys:**

```bash
XENDIT_SECRET_KEY=xnd_production_xxxxx  # ⚠️ NOT test key!
XENDIT_WEBHOOK_TOKEN=your_webhook_token  # From Xendit dashboard
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**SendGrid Production Keys:**

```bash
SENDGRID_API_KEY=SG.xxxxx  # Production API key
EMAIL_FROM=noreply@yourdomain.com  # Must be verified in SendGrid
EMAIL_FROM_NAME=NCLEX311
```

**Important:** Set environment scope to **Production** for production keys.

---

#### 4. Configure Xendit for Production

**Step 4.1: Get Production API Keys**

1. Log in to [Xendit Dashboard](https://dashboard.xendit.co)
2. **Switch to Live mode** (toggle in top-right corner)
3. Navigate to **Settings → Developers → API Keys**
4. Copy your **Live Secret Key** (starts with `xnd_production_`)
5. Add to Vercel environment variables as `XENDIT_SECRET_KEY`

**Step 4.2: Configure Webhook**

1. In Xendit Dashboard (Live mode)
2. Navigate to **Settings → Developers → Webhooks**
3. Click **+ Add Webhook**
4. Configure webhook:
   - **Webhook URL:** `https://your-app.vercel.app/api/webhooks/xendit`
   - **Webhook Type:** Invoice
   - **Events to send:**
     - ✅ Invoice Paid
     - ✅ Invoice Expired
     - ✅ Invoice Failed
5. Copy the **Webhook Verification Token**
6. Add to Vercel as `XENDIT_WEBHOOK_TOKEN`
7. Save webhook configuration

**Step 4.3: Test Webhook Delivery**

```bash
# After deployment, test webhook from Xendit Dashboard:
# 1. Go to Settings → Developers → Webhooks
# 2. Find your webhook
# 3. Click "Send Test" button
# 4. Verify 200 OK response in webhook logs
# 5. Check Vercel logs for "webhook.received" event
```

**Step 4.4: Configure Payment Methods**

1. In Xendit Dashboard (Live mode)
2. Navigate to **Settings → Payment Methods**
3. Enable required methods:
   - ✅ Cards (Visa, Mastercard, JCB, Amex)
   - ✅ GCash
   - ✅ Maya (PayMaya)
4. Complete KYB (Know Your Business) verification if required
5. Link bank account for settlements

---

#### 5. Configure SendGrid for Production

**Step 5.1: Verify Domain (Recommended)**

1. Log in to [SendGrid Dashboard](https://app.sendgrid.com)
2. Navigate to **Settings → Sender Authentication**
3. Click **Authenticate Your Domain**
4. Follow DNS verification steps for your domain
5. Wait for verification (24-48 hours)

**Step 5.2: Verify Sender Email (Alternative)**

If you don't have domain access:

1. Navigate to **Settings → Sender Authentication**
2. Click **Verify Single Sender**
3. Add `noreply@yourdomain.com`
4. Check inbox and verify email

**Step 5.3: Create Production API Key**

1. Navigate to **Settings → API Keys**
2. Click **Create API Key**
3. Name: "NCLEX311 Production"
4. Permissions: **Full Access** (or minimum: Mail Send)
5. Copy API key (shown only once!)
6. Add to Vercel as `SENDGRID_API_KEY`

**Step 5.4: Test Email Sending**

```bash
# After deployment, trigger a test email:
# 1. Create test account on production
# 2. Complete a test payment (use small amount)
# 3. Verify confirmation email received
# 4. Check SendGrid Activity Feed for delivery status
```

---

#### 6. Database Migrations

#### 6. Database Migrations

**⚠️ IMPORTANT:** Migrations are applied manually via Supabase Dashboard for production safety.

1. Open Supabase Dashboard → SQL Editor
2. Copy migration SQL from `migrations/008_add_payment_tables.sql`
3. Review changes carefully (orders, webhook_logs, users subscription fields)
4. Execute in production database
5. Verify tables created:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('orders', 'webhook_logs');
   ```

---

### Production Verification

After deployment, verify all systems are operational:

#### 7.1 Verify Application Health

```bash
# Test application is accessible
curl https://your-app.vercel.app

# Check all routes load
curl https://your-app.vercel.app/chapters
curl https://your-app.vercel.app/dashboard
```

#### 7.2 Verify Payment Flow (End-to-End)

**Test with Small Amount:**

1. Create a new test account on production
2. Navigate to premium content (Chapters 5-8)
3. Click "Upgrade to Premium"
4. Select Monthly plan (₱200)
5. Complete payment with real card (small amount for testing)
6. Verify:
   - ✅ Redirect to Xendit checkout
   - ✅ Payment completes successfully
   - ✅ Webhook received (check Vercel logs)
   - ✅ Premium access activated immediately
   - ✅ Confirmation email received
   - ✅ Can access Chapters 5-8

#### 7.3 Monitor Logs

**Vercel Dashboard:**

1. Go to Vercel Dashboard → your project → Logs
2. Filter by "error" to check for issues
3. Search for structured log events:
   - `payment.initiated`
   - `webhook.received`
   - `webhook.processed`
   - `subscription.activated`

**Xendit Dashboard:**

1. Go to Xendit Dashboard → Webhooks
2. Check webhook delivery logs
3. Verify 200 OK responses
4. Check for any failed deliveries

**SendGrid Dashboard:**

1. Go to SendGrid Dashboard → Activity Feed
2. Verify emails are being delivered
3. Check for any bounces or blocks

---

### Production Security Checklist

Before going live with real customers:

**Environment & Keys:**

- [ ] All environment variables configured in Vercel
- [ ] Production API keys used (NOT test/sandbox keys)
- [ ] `NEXTAUTH_SECRET` is production-grade (32+ characters)
- [ ] No secrets committed to repository (.env files in .gitignore)

**Xendit Configuration:**

- [ ] Live mode enabled (not test mode)
- [ ] Webhook URL uses HTTPS
- [ ] Webhook signature verification working (test with "Send Test")
- [ ] All payment methods enabled (Cards, GCash, Maya)
- [ ] Bank account linked for settlements
- [ ] KYB verification complete (if required)

**SendGrid Configuration:**

- [ ] Domain or sender email verified
- [ ] Production API key configured
- [ ] Email sending tested and working
- [ ] Confirmation emails delivering successfully

**Database:**

- [ ] Production database migration applied (008_add_payment_tables.sql)
- [ ] Database backup configured
- [ ] Connection pooling enabled

**Security:**

- [ ] HTTPS enforced on all endpoints
- [ ] Webhook signature verification enabled
- [ ] No PCI data stored (cards, CVV, PINs)
- [ ] Rate limiting configured (if applicable)

**Monitoring:**

- [ ] Vercel logs monitored for errors
- [ ] Payment success rate tracking enabled (structured logs)
- [ ] Webhook delivery monitoring active
- [ ] Email delivery monitoring active

---

### Troubleshooting Production Issues

#### Issue: Webhook not receiving events

**Symptoms:** Payments complete but subscription not activated

**Solutions:**

1. Check Xendit webhook logs for delivery attempts
2. Verify webhook URL in Xendit matches deployed URL exactly
3. Check Vercel logs for incoming webhook requests
4. Verify `XENDIT_WEBHOOK_TOKEN` matches Xendit dashboard
5. Test webhook with "Send Test" button in Xendit
6. Check for 401/500 errors in webhook logs

#### Issue: Emails not sending

**Symptoms:** Payment successful but no confirmation email

**Solutions:**

1. Check SendGrid Activity Feed for delivery attempts
2. Verify `EMAIL_FROM` address is verified in SendGrid
3. Check `SENDGRID_API_KEY` is valid and has Mail Send permissions
4. Look for email errors in Vercel logs (non-blocking, won't stop payment)
5. Check spam folder for test emails

#### Issue: Payment failing with "Invalid amount"

**Symptoms:** Xendit checkout shows wrong amount

**Solutions:**

1. Verify amounts in code: Monthly ₱200 (20000 centavos), Annual ₱1920 (192000 centavos)
2. Check Xendit API expects PHP amounts, not centavos (conversion in xendit.ts)
3. Review Xendit invoice creation logs for amount sent

#### Issue: Webhook signature verification failing

**Symptoms:** Webhooks returning 401 Unauthorized

**Solutions:**

1. Verify `XENDIT_WEBHOOK_TOKEN` in Vercel matches Xendit dashboard exactly
2. Check for extra spaces or newlines in environment variable
3. Ensure token hasn't been regenerated in Xendit dashboard
4. Test with curl:
   ```bash
   # Generate valid signature and test locally
   # See webhookVerification.ts for signature algorithm
   ```

#### Issue: Premium access not reflecting after payment

**Symptoms:** User paid but still sees "Upgrade" prompt

**Solutions:**

1. Check database: `SELECT subscription_status FROM users WHERE id = 'user_id'`
2. Verify webhook processed: Check `webhook_logs` table
3. Verify order status: `SELECT status FROM orders WHERE order_id = 'order_id'`
4. User may need to refresh page or logout/login (session should auto-update)
5. Check NextAuth session callback includes subscription data (auth-utils.ts)

---

### Production Support Contacts

- **Xendit Support:** [https://help.xendit.co](https://help.xendit.co) | support@xendit.co
- **SendGrid Support:** [https://support.sendgrid.com](https://support.sendgrid.com)
- **Vercel Support:** [https://vercel.com/support](https://vercel.com/support)

## Architecture

See [docs/architecture](../../docs/architecture/) for detailed documentation:

- [Tech Stack](../../docs/architecture/tech-stack.md)
- [Coding Standards](../../docs/architecture/coding-standards.md)
- [Xendit Payment Integration](../../docs/architecture/xendit-payment-integration.md)
- [Database Schema](../../docs/architecture/database-schema.md)

## Support

- **Issues:** [GitHub Issues](https://github.com/your-repo/issues)
- **Docs:** [Project Documentation](../../docs/)
- **Xendit Support:** [https://help.xendit.co](https://help.xendit.co)
- **SendGrid Support:** [https://support.sendgrid.com](https://support.sendgrid.com)
