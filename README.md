# NCLEX 311 Web Application

A Next.js-based web application designed to help nursing students prepare for the NCLEX-PN examination.

## Project Structure

This is a monorepo using npm workspaces with the following structure:

```
/
├── apps/
│   └── web/                 # Main Next.js application
├── packages/
│   └── types/              # Shared TypeScript types
├── docs/                   # Project documentation
└── package.json            # Root workspace configuration
```

## Tech Stack

- **Frontend Framework:** Next.js 15.5.x with App Router
- **Language:** TypeScript ~5.x
- **Database:** PostgreSQL 16.x via Supabase
- **Database Client:** Supabase JS Client v2.57.x
- **Styling:** Tailwind CSS v4.x
- **Testing:** Jest 30.x + React Testing Library 16.x + Playwright 1.55.x
- **Monorepo:** npm Workspaces
- **Package Manager:** npm
- **Deployment:** Vercel
- **CI/CD:** GitHub Actions + Vercel

## Local Development Setup

### Prerequisites

**Required:**
- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

**Database Options:**
- **Option 1 (Recommended):** Supabase account for managed PostgreSQL
- **Option 2:** Local PostgreSQL 16.x installation

### Step-by-Step Setup Instructions

#### 1. Clone and Navigate
```bash
git clone <repository-url>
cd nclex311-bmad
```

#### 2. Install Dependencies
```bash
# Install all workspace dependencies
npm install

# Verify installation
npm run type-check
```

#### 3. Environment Configuration

**For Supabase (Recommended):**
```bash
# Copy template
cp .env.example .env.local

# Edit .env.local with your Supabase credentials:
# Get these values from your Supabase project dashboard:
# NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
# SUPABASE_JWT_SECRET=your-jwt-secret-here
# 
# For Vercel deployment, also configure these Postgres variables:
# POSTGRES_URL=postgres://postgres.your-project-ref:password@pooler.supabase.com:6543/postgres
# POSTGRES_PRISMA_URL=postgres://postgres.your-project-ref:password@pooler.supabase.com:6543/postgres?pgbouncer=true
# POSTGRES_URL_NON_POOLING=postgres://postgres.your-project-ref:password@pooler.supabase.com:5432/postgres
```

**For Local PostgreSQL:**
```bash
# Copy template
cp .env.example .env.local

# Edit .env.local with your local database:
# DATABASE_URL=postgresql://username:password@localhost:5432/nclex311
```

#### 4. Database Setup

**For Supabase:**
- Create a new project at [supabase.com](https://supabase.com)
- Copy your project URL and anon key to `.env.local`
- Migrations will be managed via Supabase Dashboard
- **Apply Premium Subscription Migration**: Run migration script `apps/web/migrations/008_add_payment_tables.sql` via Supabase SQL Editor

**For Local PostgreSQL:**
```bash
# Create database
createdb nclex311

# Run migrations and validation
npm run migrate --workspace=apps/web
```

#### 5. Verify Database Connection
```bash
# Test database connectivity
curl http://localhost:3000/api/health
# Should return: {"status":"ok","timestamp":"...","database":"connected"}
```

#### 6. Payment Gateway Setup (Optional - Required for Premium Subscriptions)

To test the premium subscription workflow, configure Xendit sandbox credentials:

**Xendit Sandbox Setup:**
1. Create a free Xendit account at [dashboard.xendit.co](https://dashboard.xendit.co/register)
2. Navigate to **Settings → Developers → API Keys**
3. Copy your **Test Secret Key** (starts with `xnd_development_`)
4. Navigate to **Settings → Developers → Callbacks**
5. Generate a **Webhook Verification Token**
6. Add to `.env.local`:
   ```bash
   XENDIT_SECRET_KEY=xnd_development_YOUR_KEY_HERE
   XENDIT_WEBHOOK_TOKEN=YOUR_WEBHOOK_TOKEN_HERE
   ```

**Email Service Setup (SendGrid):**
1. Create a SendGrid account at [sendgrid.com](https://sendgrid.com)
2. Generate an API key with **Mail Send** permissions
3. Verify a sender email address
4. Add to `.env.local`:
   ```bash
   SENDGRID_API_KEY=SG.YOUR_API_KEY_HERE
   EMAIL_FROM=noreply@yourdomain.com
   EMAIL_FROM_NAME=NCLEX311
   ```

**Note:** Payment features will be disabled if Xendit credentials are not configured. Email confirmations will fail gracefully without breaking the payment flow.

#### 7. Start Development Server
```bash
# Start the development server
npm run dev

# The application will be available at:
# http://localhost:3000
```

#### 8. Verify Setup
- Navigate to [http://localhost:3000](http://localhost:3000)
- Check browser console for any errors
- Verify database connection via health endpoint
- Run initial test suite: `npm run test`

**Test Premium Subscription Flow (if Xendit configured):**
1. Create a test user account
2. Navigate to premium content (Chapters 5-8)
3. Click "Upgrade to Premium"
4. Select a plan (Monthly or Annual)
5. Use Xendit test card: `4000000000000002` (Success)
6. Complete checkout and verify subscription activation

### Testing Framework Setup

This project includes comprehensive testing infrastructure:

#### Unit Testing (Jest + React Testing Library)
```bash
# Run all unit tests
npm run test

# Run tests in watch mode (recommended for development)
npm run test:watch --workspace=apps/web

# Run tests with coverage report
npm run test:coverage --workspace=apps/web
```

#### Integration Testing (Jest + Supertest)
```bash
# Run API integration tests
npm run test --workspace=apps/web

# Tests are located in apps/web/__tests__/api/
```

#### End-to-End Testing (Playwright)
```bash
# Run E2E tests
npm run test:e2e --workspace=apps/web

# Run E2E tests with interactive UI
npm run test:e2e:ui --workspace=apps/web

# Tests are located in apps/web/e2e/
```

### Troubleshooting Common Issues

#### Database Connection Issues

**Problem**: `curl http://localhost:3000/api/health` returns database connection error

**Solutions**:
1. **Supabase**: Verify URL and keys in `.env.local`
2. **Local PostgreSQL**: 
   ```bash
   # Check if PostgreSQL is running
   brew services list | grep postgresql
   
   # Start PostgreSQL if needed
   brew services start postgresql@16
   
   # Test direct connection
   psql -d nclex311 -c "SELECT version();"
   ```

#### Node Version Issues

**Problem**: Module compatibility errors or build failures

**Solution**:
```bash
# Check Node version
node --version
# Should be >= 18.0.0

# If using nvm:
nvm install 20
nvm use 20
```

#### TypeScript Errors

**Problem**: Type checking failures

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Run type checking
npm run type-check
```

#### Port Already in Use

**Problem**: "Port 3000 is already in use"

**Solutions**:
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

#### Test Failures

**Problem**: Tests failing unexpectedly

**Solution**:
```bash
# Clear Jest cache
npx jest --clearCache

# Ensure database is properly seeded for tests
npm run migrate --workspace=apps/web

# Run tests individually to isolate issues
npm run test -- --testNamePattern="specific test name"
```

#### Environment Variables Not Loading

**Problem**: Environment variables are undefined in the application

**Solutions**:
1. Ensure `.env.local` exists (not `.env.example`)
2. Restart development server after changing env vars
3. Check that variables are properly prefixed:
   - Client-side: `NEXT_PUBLIC_*`
   - Server-side: No prefix required

#### Payment Gateway Issues

**Problem**: Xendit invoice creation fails or webhooks not received

**Solutions**:
1. **Invalid API Key**:
   ```bash
   # Verify your Xendit secret key starts with correct prefix
   # Development: xnd_development_
   # Production: xnd_production_
   echo $XENDIT_SECRET_KEY
   ```

2. **Webhook Not Received** (local development):
   - Use ngrok to expose localhost:
     ```bash
     ngrok http 3000
     # Copy the HTTPS URL and configure in Xendit Dashboard
     # Settings → Developers → Callbacks → Webhook URL
     # Set to: https://YOUR-NGROK-URL.ngrok.io/api/webhooks/xendit
     ```

3. **Payment Confirmation Email Not Sent**:
   - Verify SendGrid API key is valid
   - Check that `EMAIL_FROM` is a verified sender in SendGrid
   - Check application logs for email service errors
   - Note: Email failures won't break the payment flow

## Available Commands

### Root Directory Commands

- `npm run dev` - Start development server
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run test` - Run unit tests across all workspaces

### Testing Commands

- `npm run test --workspace=apps/web` - Run unit tests
- `npm run test:watch --workspace=apps/web` - Run tests in watch mode
- `npm run test:coverage --workspace=apps/web` - Run tests with coverage
- `npm run test:e2e --workspace=apps/web` - Run E2E tests
- `npm run test:e2e:ui --workspace=apps/web` - Run E2E tests with UI

### Database Commands

- `npm run migrate --workspace=apps/web` - Run database migrations

## Development

### Workspace Dependencies

This project uses npm workspaces to manage multiple packages. Shared types and utilities are located in the `packages/` directory and can be imported as:

```typescript
import type { User, Environment } from "@nclex311/types";
```

### Coding Standards

Please refer to the project documentation in the `docs/` directory for coding standards and best practices.

## Development Workflow

### New Developer Setup

For comprehensive onboarding instructions, see [Developer Onboarding Guide](docs/DEVELOPER_ONBOARDING.md).

### Daily Development Process

1. **Start Development**
   ```bash
   git pull
   npm install  # if dependencies changed
   npm run dev
   ```

2. **Code Quality**
   ```bash
   # Format code
   npm run format --workspace=apps/web
   
   # Fix linting issues
   npm run lint:fix --workspace=apps/web
   
   # Run tests
   npm run test
   ```

3. **Git Workflow**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   # Pre-commit hooks will run automatically
   git push
   ```

### Code Style Guidelines

- **ESLint**: Enforces code quality and consistency
- **Prettier**: Handles code formatting automatically
- **TypeScript**: Strict type checking enabled
- **Git Hooks**: Automatic linting and formatting on commit

### Testing Standards

- Write tests for all new functionality
- Maintain high test coverage
- Use React Testing Library for component tests
- Use Playwright for E2E tests
- Run tests before committing: `npm run test`

### Pull Request Process

1. Create feature branch from `main`
2. Implement changes with comprehensive tests
3. Ensure all quality checks pass:
   - `npm run test`
   - `npm run type-check`
   - `npm run lint`
   - `npm run build`
4. Create PR with detailed description
5. Request code review
6. Address feedback and merge

## Project Documentation

- **Setup Guide**: [docs/DEVELOPER_ONBOARDING.md](docs/DEVELOPER_ONBOARDING.md)
- **Architecture**: `docs/architecture/`
- **Product Requirements**: `docs/prd/`
- **Development Stories**: `docs/stories/`

## License

This project is private and proprietary.
