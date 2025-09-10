# Tech Stack

## Technology Stack Table

This table represents the single source of truth for the project's technology stack. All development must adhere to these choices and versions.

| Category | Technology | Version | Purpose | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Language** | TypeScript | ~5.x | Type safety, developer experience | Industry standard for modern web development; catches errors early. |
| **Frontend Framework**| Next.js | ~14.x | Full-stack React framework | Specified in PRD. Enables rapid development with unified FE/BE. |
| **UI Component Library**| Radix UI + Tailwind CSS | latest | Building accessible, custom components | Radix provides unstyled, accessible primitives; Tailwind allows for rapid, custom styling to match brand guidelines. |
| **State Management** | Zustand | ~4.x | Global client-side state management | Simple, lightweight, and unopinionated. Avoids boilerplate for managing state like user session or bookmarks. |
| **Backend Language** | TypeScript | ~5.x | Type safety for API routes | Consistent language across the stack simplifies development. |
| **Backend Framework**| Next.js API Routes | ~14.x | Serverless backend logic | Specified in PRD. Tightly integrated with the frontend, ideal for this architecture. |
| **API Style** | REST | N/A | Client-server communication | A well-understood, standard approach that fits naturally with Next.js API Routes. |
| **Database** | PostgreSQL | 16.x | Primary data storage | Specified in PRD. A robust, reliable, and scalable relational database. |
| **Cache** | Vercel Data Cache | N/A | Caching data-fetching responses | Integrated into Vercel's infrastructure to reduce database load and improve performance. |
| **File Storage** | Vercel Blob | latest | Storing user-generated files (if needed) | A simple and scalable solution for file storage, fully integrated with the Vercel ecosystem. |
| **Authentication** | Auth.js (NextAuth) | ~5.x | User authentication and session management | The de-facto standard for Next.js. Simplifies secure auth implementation. |
| **Frontend Testing** | Jest + React Testing Library | latest | Unit & Component testing | Industry standard for testing React applications, focusing on user-facing behavior. |
| **Backend Testing** | Jest + Supertest | latest | API route integration testing | Jest for the test runner and Supertest for making HTTP requests to the API endpoints. |
| **E2E Testing** | Playwright | latest | End-to-end user workflow testing | A modern, powerful tool for reliable E2E testing across all major browsers. |
| **Build/Deploy Tool**| Vercel CLI / Git | latest | Building and deploying the application | Vercel's Git-based workflow provides seamless, automated CI/CD. |
| **CI/CD** | Vercel + GitHub Actions | N/A | Continuous Integration & Deployment | Vercel for deployments; GitHub Actions for running tests and linting on every push. |
| **Monitoring** | Vercel Analytics & Log Drains | N/A | Observability and performance tracking | Provides Core Web Vitals, traffic insights, and access to serverless function logs. |
| **Logging** | Vercel Log Drains | N/A | Centralized log management | Allows forwarding logs to a dedicated service (e.g., Logtail, Datadog) for analysis. |
