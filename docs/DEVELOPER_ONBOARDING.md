# Developer Onboarding Checklist

## Prerequisites Setup

### Required Tools
- [ ] **Node.js >= 18.0.0** - [Download from nodejs.org](https://nodejs.org/)
- [ ] **npm >= 9.0.0** - Usually comes with Node.js
- [ ] **Git** - [Install guide](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [ ] **Code Editor** - VS Code recommended with extensions:
  - [ ] ESLint extension
  - [ ] Prettier extension
  - [ ] TypeScript extension
  - [ ] Tailwind CSS IntelliSense

### Database Options
Choose one:
- [ ] **Option 1 (Recommended):** Create [Supabase account](https://supabase.com)
- [ ] **Option 2:** Install PostgreSQL 16.x locally

## Project Setup

### 1. Repository Setup
- [ ] Clone repository: `git clone <repository-url>`
- [ ] Navigate to project: `cd nclex311-bmad`
- [ ] Verify Node.js version: `node --version` (should be >= 18.0.0)

### 2. Install Dependencies
- [ ] Run: `npm install`
- [ ] Verify installation: `npm run type-check`
- [ ] Check for any error messages

### 3. Environment Configuration

#### For Supabase (Recommended)
- [ ] Create new Supabase project at [supabase.com](https://supabase.com)
- [ ] Copy `.env.example` to `.env.local`
- [ ] Update `.env.local` with your Supabase credentials:
  ```bash
  NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
  ```

#### For Local PostgreSQL
- [ ] Install PostgreSQL 16.x
- [ ] Create database: `createdb nclex311`
- [ ] Copy `.env.example` to `.env.local`
- [ ] Update `.env.local` with local database URL:
  ```bash
  DATABASE_URL=postgresql://username:password@localhost:5432/nclex311
  ```

### 4. Database Setup
- [ ] Run migrations: `npm run migrate --workspace=apps/web`
- [ ] Seed development data: `npm run seed --workspace=apps/web`
- [ ] Or run bootstrap (migrate + seed): `npm run bootstrap --workspace=apps/web`

### 5. Start Development Server
- [ ] Start server: `npm run dev`
- [ ] Open [http://localhost:3000](http://localhost:3000) in browser
- [ ] Verify no console errors

### 6. Verify Setup
- [ ] Test database connection: `curl http://localhost:3000/api/health`
  - Should return: `{"status":"ok","timestamp":"...","database":"connected"}`
- [ ] Run test suite: `npm run test`
- [ ] Run type checking: `npm run type-check`
- [ ] Run linting: `npm run lint`

## Development Workflow

### Daily Development Process
1. **Start of Day**
   - [ ] Pull latest changes: `git pull`
   - [ ] Install any new dependencies: `npm install`
   - [ ] Start development server: `npm run dev`

2. **While Coding**
   - [ ] Use TypeScript for type safety
   - [ ] Write tests for new functionality
   - [ ] Follow existing code patterns and styles
   - [ ] Run tests frequently: `npm run test:watch --workspace=apps/web`

3. **Before Committing**
   - [ ] Format code: `npm run format --workspace=apps/web`
   - [ ] Fix linting issues: `npm run lint:fix --workspace=apps/web`
   - [ ] Run all tests: `npm run test`
   - [ ] Check types: `npm run type-check`
   - [ ] Git hooks will run automatically on commit

### Code Quality Checks

#### Automated (runs on git commit)
- **ESLint** - Code quality and style enforcement
- **Prettier** - Code formatting
- **TypeScript** - Type checking

#### Manual (run before push)
- [ ] `npm run test` - Full test suite
- [ ] `npm run test:e2e --workspace=apps/web` - End-to-end tests
- [ ] `npm run build` - Production build test

### Testing Strategy

#### Unit Tests (Jest + React Testing Library)
- Test individual components and functions
- Located in `apps/web/__tests__/`
- Run: `npm run test --workspace=apps/web`

#### Integration Tests (Jest + Supertest)
- Test API routes and database interactions
- Located in `apps/web/__tests__/api/`
- Run: `npm run test --workspace=apps/web`

#### E2E Tests (Playwright)
- Test complete user workflows
- Located in `apps/web/e2e/`
- Run: `npm run test:e2e --workspace=apps/web`

## Debugging and Troubleshooting

### Common Issues

#### Database Connection Errors
1. Check `.env.local` file exists and has correct values
2. For Supabase: Verify URL and keys from project dashboard
3. For local: Ensure PostgreSQL is running
4. Test connection: `curl http://localhost:3000/api/health`

#### TypeScript Errors
1. Clear cache: `rm -rf node_modules package-lock.json && npm install`
2. Check TypeScript version compatibility
3. Run: `npm run type-check`

#### Test Failures
1. Clear Jest cache: `npx jest --clearCache`
2. Ensure database is seeded: `npm run seed --workspace=apps/web`
3. Run individual test: `npm run test -- --testNamePattern="test name"`

#### Git Hook Failures
1. Fix linting errors: `npm run lint:fix --workspace=apps/web`
2. Format code: `npm run format --workspace=apps/web`
3. Stage changes and commit again

### Performance Monitoring
- Use React DevTools for component performance
- Check Network tab for API response times
- Monitor Vercel Analytics in production
- Use `/api/health` endpoint for database connectivity

## Documentation and Resources

### Project Documentation
- [ ] Read `docs/architecture/` for system design
- [ ] Review `docs/prd/` for product requirements
- [ ] Check `docs/stories/` for feature specifications

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Jest Testing Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/)

## Support

### Getting Help
- Check this documentation first
- Search existing issues in the repository
- Ask team members for assistance
- Create detailed issue reports with:
  - Steps to reproduce
  - Expected vs actual behavior
  - Environment details
  - Error messages/screenshots

### Contributing
- Follow the established coding standards
- Write comprehensive tests
- Update documentation for new features
- Create detailed pull request descriptions
- Request code reviews from team members

---

## Completion Checklist

Once you've completed all items above, you should have:
- [ ] Working development environment
- [ ] Successfully running application at http://localhost:3000
- [ ] All tests passing
- [ ] Database connectivity verified
- [ ] Git hooks working (test with a small commit)
- [ ] Understanding of project structure and workflow

**Welcome to the team!** 🎉