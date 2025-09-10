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
- **Styling:** Tailwind CSS
- **Monorepo:** npm Workspaces
- **Package Manager:** npm

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

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

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Commands

From the root directory:

- `npm run dev` - Start development server
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run test` - Run tests (when implemented)

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
