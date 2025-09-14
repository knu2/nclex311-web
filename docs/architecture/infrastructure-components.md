# Infrastructure Components

## Overview

This document outlines the infrastructure components that have been implemented as part of the foundation setup (Stories 1.0 and 1.1). These components provide the operational backbone for monitoring, database management, and continuous integration.

## Health Monitoring System

### Health Check API Endpoint

**Location:** `/api/health`  
**Purpose:** Provides real-time system health status with database connectivity validation

**Implementation Details:**
- Built using Next.js API Routes (App Router)
- Tests Supabase database connectivity
- Validates schema accessibility
- Returns structured JSON health status

**Response Format:**
```json
{
  "status": "healthy|unhealthy",
  "checks": {
    "database": "connected|disconnected",
    "info": {
      "connected": true,
      "database_name": "supabase",
      "version": "PostgreSQL (via Supabase)",
      "schema_status": {
        "tables_accessible": true,
        "users_table_count": 0,
        "chapters_table_count": 0
      }
    }
  },
  "timestamp": "ISO 8601 string",
  "version": "1.0.0"
}
```

**Monitoring Integration:**
- Accessible to external monitoring tools
- Used by CI/CD pipeline for deployment verification
- Provides database table counts for schema validation

## Database Infrastructure

### Supabase Integration

**Provider:** Supabase (managed PostgreSQL)  
**Connection Method:** Supabase JavaScript Client  
**Version:** PostgreSQL 16.x via Supabase

**Key Components:**
- **Client Library:** `@supabase/supabase-js` v2.57.x
- **Connection Pooling:** Built into Supabase infrastructure
- **Realtime Capabilities:** Available for future features
- **Dashboard Access:** Supabase Dashboard for admin operations

**Environment Configuration:**
```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

### Migration Management System

**Strategy:** Hybrid Manual/Automated Approach

**Components:**
1. **Migration Scripts:** Located in `apps/web/migrations/`
2. **Validation Scripts:** `npm run migrate` command
3. **Manual Execution:** Via Supabase Dashboard SQL Editor

**Migration Validation:**
```bash
# Validate all expected tables exist and are accessible
npm run migrate

# Legacy migration script (development only)
npm run migrate:legacy
```

**Safety Features:**
- No automatic migrations in production
- Manual review required for all schema changes
- Validation scripts verify table accessibility
- Connection testing before migration execution

## CI/CD Infrastructure

### GitHub Actions Pipeline

**Configuration:** `.github/workflows/ci.yml`  
**Triggers:** Push to main/develop branches, Pull Requests

**Pipeline Stages:**

1. **Lint and Test**
   - TypeScript type checking
   - ESLint code quality checks
   - Jest unit and integration tests
   - Playwright E2E test execution

2. **Database Services**
   - PostgreSQL 16 test database
   - Health checks with retry logic
   - Connection validation

3. **Deploy Staging** (main branch only)
   - Automatic Vercel deployment
   - Environment variable injection
   - Post-deployment health checks

**Service Dependencies:**
```yaml
services:
  postgres:
    image: postgres:16
    env:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: nclex311_test
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
```

### Testing Infrastructure

**Unit Testing:**
- **Framework:** Jest 30.x
- **React Testing:** React Testing Library 16.x
- **Mocking:** Supabase client mocking with `jest.doMock()`
- **Coverage:** Built-in Jest coverage reporting

**Integration Testing:**
- **API Testing:** Supertest 7.x for HTTP endpoint testing
- **Database Testing:** Mock Supabase client for isolation
- **Error Path Testing:** Comprehensive error scenario coverage

**E2E Testing:**
- **Framework:** Playwright 1.55.x
- **Browser Support:** Chromium, Firefox, Safari
- **Configuration:** Custom playwright.config.ts
- **Commands:** `npm run test:e2e`, `npm run test:e2e:ui`

## Monitoring and Observability

### Application Monitoring

**Health Endpoint:** `/api/health`
- Database connectivity status
- Schema validation
- Table accessibility verification
- Response time tracking

**Vercel Integration:**
- Function logs and metrics
- Performance monitoring
- Error tracking
- Deployment status

### Development Tools

**Local Development:**
```bash
# Start development server
npm run dev

# Run all tests
npm test

# Database migration validation
npm run migrate

# Type checking
npm run type-check
```

**Production Monitoring:**
- Health endpoint monitoring
- Vercel Analytics integration
- Database performance metrics via Supabase Dashboard
- CI/CD pipeline status tracking

## Security Considerations

### Environment Security

**Secrets Management:**
- Environment variables via Vercel dashboard
- No secrets in repository
- Supabase keys properly scoped (anon key for client)

**Database Security:**
- Row-level security (RLS) available via Supabase
- Connection pooling and rate limiting
- Encrypted connections (TLS)

### API Security

**Health Endpoint:**
- Public access for monitoring
- No sensitive data exposure
- Rate limiting considerations for production

**Database Access:**
- Supabase client with proper authentication
- Connection string security
- Query validation and error handling

## Maintenance and Operations

### Routine Tasks

**Database:**
- Schema migrations via Supabase Dashboard
- Regular backups (handled by Supabase)
- Performance monitoring

**Application:**
- Health endpoint monitoring
- Log review and analysis
- CI/CD pipeline maintenance

### Troubleshooting

**Common Issues:**
1. **Database Connection Failures**
   - Check Supabase service status
   - Validate environment variables
   - Review network connectivity

2. **CI/CD Pipeline Failures**
   - Review GitHub Actions logs
   - Check test database availability
   - Verify environment variable configuration

3. **Health Check Failures**
   - Database connectivity issues
   - Schema validation problems
   - Environment configuration errors

**Diagnostic Tools:**
- Health endpoint (`/api/health`)
- Supabase Dashboard logs
- Vercel function logs
- GitHub Actions build logs