# Project Structure

## Overview

This document describes the actual implemented monorepo structure for NCLEX311-Web. The project uses npm workspaces to manage multiple packages and follows Next.js best practices with additional infrastructure for testing, migrations, and CI/CD.

## Root Directory Structure

```plaintext
nclex311-bmad/
├── apps/                           # Applications workspace
│   └── web/                        # Main Next.js web application
├── packages/                       # Shared packages workspace
│   └── types/                      # Shared TypeScript type definitions
├── docs/                           # Project documentation
│   ├── architecture/               # Architecture documentation (sharded)
│   ├── prd/                        # Product Requirements (sharded)
│   ├── qa/                         # Quality assurance documentation
│   └── stories/                    # Development user stories
├── scratchpad/                     # Temporary files and references
├── .github/                        # GitHub workflows and templates
│   └── workflows/                  # CI/CD pipeline definitions
├── .bmad-core/                     # BMad agent system configuration
├── .clinerules/                    # CLI rules and agent definitions
├── package.json                    # Root workspace configuration
├── package-lock.json               # Dependency lockfile
├── .env.example                    # Environment variables template
└── vercel.json                     # Vercel deployment configuration
```

## Apps Workspace

### Main Web Application (`apps/web/`)

The primary Next.js application containing all frontend and backend code.

```plaintext
apps/web/
├── src/                            # Source code
│   ├── app/                        # Next.js App Router
│   │   ├── api/                    # Backend API routes
│   │   │   └── health/             # Health check endpoint
│   │   │       └── route.ts
│   │   ├── globals.css             # Global styles
│   │   ├── layout.tsx              # Root layout component
│   │   └── page.tsx                # Home page component
│   └── lib/                        # Utility libraries
│       └── database.ts             # Database connection utilities
├── __tests__/                      # Jest unit and integration tests
│   ├── api/                        # API route tests
│   │   └── health.test.ts
│   ├── database.unit.test.ts       # Database unit tests
│   └── database.integration.test.ts # Database integration tests
├── e2e/                            # Playwright E2E tests
│   └── home.spec.ts                # Homepage E2E tests
├── migrations/                     # Database migration scripts
│   └── 001_initial_schema.sql      # Initial database schema
├── scripts/                        # Utility scripts
│   ├── validate-migration.js       # Migration validation script
│   ├── migrate.js                  # Legacy migration script
│   └── migrate-supabase.js         # Supabase-specific migration
├── public/                         # Static assets
│   ├── next.svg                    # Next.js logo
│   ├── vercel.svg                  # Vercel logo
│   └── [other SVG files]           # Additional static assets
├── package.json                    # Web app dependencies and scripts
├── next.config.ts                  # Next.js configuration
├── tsconfig.json                   # TypeScript configuration
├── jest.config.js                  # Jest testing configuration
├── jest.setup.js                   # Jest setup and globals
├── playwright.config.ts            # Playwright E2E test configuration
├── eslint.config.mjs               # ESLint configuration
├── postcss.config.mjs              # PostCSS configuration (Tailwind)
└── README.md                       # Web application documentation
```

### Application Scripts

The web application provides several npm scripts for development and testing:

```json
{
  "scripts": {
    "dev": "next dev",                      // Development server
    "build": "next build",                  // Production build
    "start": "next start",                  // Start production server
    "type-check": "tsc --noEmit",          // TypeScript type checking
    "lint": "eslint",                       // Code linting
    "test": "jest",                         // Run unit tests
    "test:watch": "jest --watch",           // Run tests in watch mode
    "test:coverage": "jest --coverage",     // Run tests with coverage
    "test:e2e": "playwright test",          // Run E2E tests
    "test:e2e:ui": "playwright test --ui",  // Run E2E tests with UI
    "migrate": "node scripts/validate-migration.js",        // Validate migrations
    "migrate:validate": "node scripts/validate-migration.js", // Alias for migrate
    "migrate:legacy": "node scripts/migrate.js"             // Legacy migration
  }
}
```

## Packages Workspace

### Shared Types (`packages/types/`)

Contains TypeScript type definitions shared across the monorepo.

```plaintext
packages/types/
├── index.ts                        # Main type exports
└── package.json                    # Package configuration
```

**Current Types:**
- Basic shared types for demonstration
- Database model interfaces (planned)
- API response/request types (planned)

## Documentation Structure

### Architecture Documentation (`docs/architecture/`)

Sharded architecture documentation for maintainability:

```plaintext
docs/architecture/
├── index.md                        # Architecture overview
├── introduction.md                 # Project introduction
├── high-level-architecture.md      # System architecture overview
├── tech-stack.md                   # Technology stack decisions
├── database-schema.md              # Database design and schema
├── data-models.md                  # Data model specifications
├── api-specification.md            # API design and endpoints
├── infrastructure-components.md    # Infrastructure and DevOps
└── project-structure.md           # This document
```

### Product Requirements (`docs/prd/`)

Sharded PRD documentation:

```plaintext
docs/prd/
├── index.md                        # PRD overview
├── goals-and-background-context.md # Project goals and context
├── requirements.md                 # Functional requirements
├── technical-assumptions.md        # Technical constraints
├── user-interface-design-goals.md  # UI/UX requirements
├── epic-list.md                   # Epic overview
├── epic-1-foundation-freemium-experience.md
├── epic-2-premium-subscription-personalization.md
├── epic-3-community-engagement.md
└── next-steps.md                  # Implementation roadmap
```

### Development Stories (`docs/stories/`)

User story documentation with implementation details:

```plaintext
docs/stories/
├── 1.0.repository-setup-project-scaffolding.md    # Foundation setup
└── 1.1.project-infrastructure-setup.md            # Infrastructure setup
```

### Quality Assurance (`docs/qa/`)

QA documentation and gates:

```plaintext
docs/qa/
└── gates/
    └── 1.0-repository-setup-project-scaffolding.yml   # QA gate definition
```

## Configuration Files

### Root Workspace Configuration

**`package.json`** - Root workspace configuration:
```json
{
  "name": "nclex311-web",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "npm run dev --workspace=apps/web",
    "build": "npm run build --workspace=apps/web",
    "start": "npm run start --workspace=apps/web",
    "type-check": "npm run type-check --workspace=apps/web",
    "lint": "npm run lint --workspace=apps/web",
    "test": "npm run test --workspaces --if-present"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

### Environment Configuration

**`.env.example`** - Environment variable template:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Application Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Authentication (future)
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Payment Integration (future)
MAYA_PUBLIC_KEY="pk-..."
MAYA_SECRET_KEY="sk-..."
```

### Vercel Deployment

**`vercel.json`** - Vercel deployment configuration:
```json
{
  "buildCommand": "npm run build --workspace=apps/web",
  "devCommand": "npm run dev --workspace=apps/web",
  "installCommand": "npm install",
  "outputDirectory": "apps/web/.next"
}
```

## CI/CD Configuration

### GitHub Actions (`-.github/workflows/`)

**`ci.yml`** - Continuous integration pipeline:
- Lint and type checking
- Unit and integration testing
- E2E test execution
- Automated staging deployment

**Key Features:**
- PostgreSQL test database service
- Playwright browser installation
- Multi-branch triggering (main, develop)
- Vercel deployment integration

## BMad Agent System

### Core Configuration (`-.bmad-core/`)

BMad development agent system for AI-assisted development:
- Agent definitions and capabilities
- Development workflow templates
- Task and checklist templates

### CLI Rules (`-.clinerules/`)

Agent-specific rules and configurations:
- Individual agent persona definitions
- Role-based command sets
- Development process guidelines

## Development Workflow

### Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 3. Start development server
npm run dev

# 4. Run tests
npm test

# 5. Validate database migrations
npm run migrate --workspace=apps/web
```

### Database Management

- **Schema Changes:** Manual via Supabase Dashboard
- **Migration Validation:** `npm run migrate`
- **Local Testing:** Mock Supabase client in tests
- **Production:** Supabase Dashboard SQL Editor

### Testing Strategy

- **Unit Tests:** Jest with React Testing Library
- **Integration Tests:** API route testing with Supertest
- **E2E Tests:** Playwright cross-browser testing
- **Database Tests:** Mocked Supabase client

## Future Expansions

### Planned Packages

- `packages/ui/` - Shared UI components
- `packages/utils/` - Utility functions
- `packages/config/` - Shared configurations

### Planned Applications

- `apps/admin/` - Administrative dashboard (potential)
- `apps/mobile/` - React Native mobile app (potential)

### Infrastructure Additions

- Monitoring and observability tools
- Advanced CI/CD pipeline features
- Performance testing framework
- Security scanning integration

## Maintenance

### Regular Tasks

- Dependency updates via `npm audit`
- Documentation updates
- CI/CD pipeline maintenance
- Database migration validation
- Health endpoint monitoring

### Code Organization Principles

- Colocation of tests with source code
- Clear separation of concerns
- Shared code in packages workspace
- Configuration centralization
- Documentation as code