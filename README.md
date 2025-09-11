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

- **Frontend Framework:** Next.js 15.x
- **Language:** TypeScript 5.x
- **Database:** PostgreSQL 16.x
- **Styling:** Tailwind CSS
- **Testing:** Jest + React Testing Library + Playwright
- **Monorepo:** npm Workspaces
- **Package Manager:** npm
- **Deployment:** Vercel
- **CI/CD:** GitHub Actions

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL 16.x (for local development)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd nclex311-bmad
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your local database credentials
```

4. Set up the database:
```bash
# Create a PostgreSQL database named 'nclex311'
# Then run migrations:
npm run migrate --workspace=apps/web
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Commands

From the root directory:

- `npm run dev` - Start development server
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run test` - Run unit tests

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

### Project Documentation

- Architecture documentation: `docs/architecture/`
- Product requirements: `docs/prd/`
- Development stories: `docs/stories/`

## License

This project is private and proprietary.
