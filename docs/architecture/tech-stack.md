# Tech Stack

## Technology Stack Table

This table represents the single source of truth for the project's technology stack. All development must adhere to these choices and versions.

| Category | Technology | Version | Purpose | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Language** | TypeScript | ~5.x | Type safety, developer experience | Industry standard for modern web development; catches errors early. |
| **Frontend Framework**| Next.js | 15.5.x | Full-stack React framework | Latest stable version with React 19 support. Enables rapid development with unified FE/BE. |
| **UI Styling** | Tailwind CSS | v4.x | Utility-first CSS framework | For rapid and custom styling of components and layouts. |
| **UI Component Library**| MUI (Material-UI) | ~5.x | React component library | To accelerate development with a comprehensive set of pre-built, accessible components. |
| **State Management** | React Built-in (useState/useContext) | N/A | Client-side state management | Built-in React hooks sufficient for current scope. Zustand planned for complex global state. |
| **Markdown Rendering** | react-markdown | ~9.x | Content display with markdown support | Safe, performant rendering of markdown-formatted content (concepts, questions, rationales) with React component support. |
| **Markdown Sanitization** | rehype-sanitize | ~6.x | XSS protection for rendered content | Sanitizes HTML output from markdown rendering to prevent XSS attacks and ensure secure user-facing content display. |
| **Backend Language** | TypeScript | ~5.x | Type safety for API routes | Consistent language across the stack simplifies development. |
| **Backend Framework**| Next.js API Routes | 15.5.x | Serverless backend logic | Specified in PRD. Tightly integrated with the frontend, ideal for this architecture. |
| **API Style** | REST | N/A | Client-server communication | A well-understood, standard approach that fits naturally with Next.js API Routes. |
| **Database** | PostgreSQL (via Supabase) | 16.x | Primary data storage | Supabase provides managed PostgreSQL hosting with connection pooling and monitoring. |
| **ORM Layer** | Drizzle ORM | 0.44.5 | Type-safe database operations | Primary database access layer. Schema-driven ORM providing enhanced type safety, connection pooling, and maintainable service layer abstraction. Integrated in Story 1.4.1. |
| **Schema Management** | Drizzle Kit | 0.31.5 | Database schema & migrations | Schema generation, migration management, and database introspection for Drizzle ORM. |
| **Database Connection** | postgres (pg) | ~8.x | PostgreSQL driver | Native PostgreSQL driver used by Drizzle ORM for database connectivity. |
| **Cache** | Vercel Data Cache | N/A | Caching data-fetching responses | Integrated into Vercel's infrastructure to reduce database load and improve performance. |
| **File Storage** | Vercel Blob | latest | Storing user-generated files (if needed) | A simple and scalable solution for file storage, fully integrated with the Vercel ecosystem. |
| **Authentication** | Auth.js (NextAuth) | 5.0.0-beta.29 | User authentication and session management | The de-facto standard for Next.js. Implemented with credentials provider and JWT session strategy. |
| **Frontend Testing** | Jest + React Testing Library | 30.x + 16.x | Unit & Component testing | Industry standard for testing React applications, focusing on user-facing behavior. |
| **Backend Testing** | Jest + Supertest | 30.x + 7.x | API route integration testing | Jest for the test runner and Supertest for making HTTP requests to the API endpoints. |
| **E2E Testing** | Playwright | 1.55.x | End-to-end user workflow testing | Modern, powerful tool for reliable E2E testing across all major browsers. |
| **Build/Deploy Tool**| Vercel CLI / Git | latest | Building and deploying the application | Vercel's Git-based workflow provides seamless, automated CI/CD. |
| **CI/CD** | Vercel + GitHub Actions | N/A | Continuous Integration & Deployment | GitHub Actions for testing/linting, Vercel for automated deployments on push. |
| **Monitoring** | Vercel Analytics & Health Checks | N/A | Observability and performance tracking | Vercel Analytics + custom /api/health endpoint for database connectivity monitoring. |
| **Migration Management** | Custom npm Scripts + Supabase Dashboard | N/A | Database schema management | Migration validation scripts with manual deployment via Supabase Dashboard for safety. |
