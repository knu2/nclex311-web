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

### Vercel Deployment

1. **Push to GitHub:**

```bash
git push origin main
```

2. **Import to Vercel:**

- Go to [Vercel Dashboard](https://vercel.com/dashboard)
- Click "Add New Project"
- Import your GitHub repository
- Select `apps/web` as root directory

3. **Configure Environment Variables:**

Add all environment variables from `.env.local` to Vercel:

- Settings → Environment Variables
- Add each variable for Production, Preview, Development
- **Use production keys for production environment**

4. **Update Xendit Webhook:**

- Update webhook URL to: `https://your-app.vercel.app/api/webhooks/xendit`
- Test webhook delivery from Xendit dashboard

5. **Verify Deployment:**

```bash
# Test health endpoint
curl https://your-app.vercel.app/api/health

# Test payment flow with test card
# Monitor logs in Vercel dashboard
```

### Database Migrations

**⚠️ IMPORTANT:** Migrations are applied manually via Supabase Dashboard for production safety.

1. Open Supabase Dashboard → SQL Editor
2. Copy migration SQL from `migrations/` folder
3. Review changes carefully
4. Execute in production database
5. Run validation script: `npm run migrate`

### Security Checklist

- [ ] All environment variables configured in Vercel
- [ ] Production API keys used (not test keys)
- [ ] Webhook signature verification enabled
- [ ] HTTPS enforced on all endpoints
- [ ] No secrets committed to repository
- [ ] Database backup configured
- [ ] Vercel logs monitored for errors

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
