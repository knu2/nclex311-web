# Epic 1: Foundation & Freemium Experience

**Goal:** This foundational epic will establish the project's technical backbone, including the Next.js application, database schema, testing frameworks, and a basic CI/CD pipeline. It will deliver the initial, tangible user value: the ability to sign up and study the first four chapters for free. The one-time content import from the source PDF will also be completed within this epic.

## Story 1.0: Repository Setup & Project Scaffolding

*   **As a** developer,
*   **I want** to initialize the Git repository, set up the Next.js monorepo structure, and establish baseline project documentation,
*   **so that** I have a clean, organized foundation for all subsequent development work.

**Acceptance Criteria:**
1.  A new Git repository is initialized with proper .gitignore for Next.js projects.
2.  Next.js application is scaffolded with TypeScript configuration.
3.  Monorepo workspace structure is established (apps/, packages/ directories as specified in architecture).
4.  Baseline README.md is created with project overview and initial setup instructions.
5.  Coding standards documentation is referenced and accessible to developers.
6.  Initial package.json workspace configuration is properly set up.

## Story 1.1: Project & Infrastructure Setup

*   **As a** developer,
*   **I want** to set up database connectivity, configure CI/CD pipeline, install testing frameworks, and establish deployment automation,
*   **so that** I have a stable and automated foundation for building, testing, and deploying the application.

**Acceptance Criteria:**
1.  PostgreSQL database connection is established and configured with environment variables.
2.  Basic CI/CD pipeline is configured using Vercel deployment + GitHub Actions for testing/linting.
3.  Testing frameworks are installed and configured (Jest + React Testing Library for unit tests, Playwright for E2E).
4.  A basic health-check API route is implemented and accessible.
5.  Environment variable management is set up (.env.example, .env.local template).
6.  Pushing to the `main` branch automatically triggers deployment to staging environment.
7.  Database schema baseline is created and migration strategy is established.

## Story 1.1.5: Development Environment & Local Setup

*   **As a** developer,
*   **I want** to have comprehensive documentation and tooling for local development setup,
*   **so that** any developer can quickly get the application running locally and start contributing effectively.

**Acceptance Criteria:**
1.  Comprehensive local setup documentation is created with step-by-step instructions.
2.  Dependency installation process is documented and tested (npm install, database setup).
3.  Environment variables template (.env.example) is provided with all required variables.
4.  Local database bootstrap/seeding process is documented and scripted.
5.  Development server startup instructions are clear and include troubleshooting section.
6.  Code formatting and linting tools are configured and documented.
7.  Git hooks are set up for pre-commit linting and formatting.

## Story 1.2 (Revised): Database Import from Pre-Extracted JSON and Images

*   **As a** content manager,
*   **I want** to use a TypeScript import script to process pre-extracted JSON files and associated medical images into the database,
*   **so that** all NCLEX 311 content, including complex questions and medical images, is available in the application.

**Acceptance Criteria:**
1.  A TypeScript script (or Next.js API route) is created that can read structured JSON files containing extracted concepts, questions, and image references.
2.  The script correctly processes and imports all question types (Multiple Choice, Select All That Apply, Fill-in-the-blank, Matrix/Grid) from the JSON format.
3.  The script uploads image files to Vercel Blob Storage and stores the blob URLs in the database with proper metadata.
4.  The script successfully populates the PostgreSQL database with all content from the JSON files, including proper relationships between concepts, questions, options, and images.
5.  Image metadata (filename, dimensions, extraction confidence, medical content descriptions) is preserved and stored in the database.
6.  A spot-check of imported data confirms that concepts, questions, options, and images are correctly linked and accessible.
7.  The database schema is updated to support image entities and their relationships to concepts and questions.

## Story 1.3: User Authentication

*   **As a** new user,
*   **I want** to sign up for a new account and log in using my email and password,
*   **so that** the system can track my personal progress.

**Acceptance Criteria:**
1.  A user can create an account using a valid email and a password.
2.  Passwords are not stored in plain text.
3.  A logged-in user can log out.
4.  The system prevents registration with an already-used email address.

## Story 1.4: Content Browsing & Freemium Access

*   **As a** guest or free user,
*   **I want** to browse the list of all chapters and concepts, and access the full content for the first four chapters,
*   **so that** I can evaluate the platform's value before considering a subscription.

**Acceptance Criteria:**
1.  All users can see the titles of all chapters and concepts.
2.  Any user can view the full content and quiz for any concept within chapters 1-4.
3.  Attempting to access a concept from chapters 5-8 prompts a non-premium user to upgrade.
4.  The UI clearly distinguishes between free and premium content.

## Story 1.5 (Revised): Interactive Quizzing with Multiple Question Formats

*   **As a** free user,
*   **I want** to take quizzes that include various question formats (like Multiple Choice, Select All That Apply, etc.) and receive immediate feedback,
*   **so that** I can practice with the same types of questions I will see on the actual NCLEX exam.

**Acceptance Criteria:**
1.  The quizzing interface can correctly render and handle the following question types: Multiple Choice (single answer), Select All That Apply (SATA), Fill-in-the-blank, and Matrix/Grid.
2.  After submitting an answer for any question type, the UI immediately indicates if the choice(s) were correct or incorrect.
3.  After answering, the detailed rationale for the correct answer(s) is displayed.
4.  The system correctly evaluates the submission for each question type (e.g., for SATA, all correct options must be selected and no incorrect ones).
