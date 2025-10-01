# NCLEX311-Web Product Requirements Document (PRD)

## Goals and Background Context

### Goals

*   Launch a fully functional, mobile-first, interactive web application for NCLEX 311 within 4 months.
*   Acquire 5,000 registered free-tier users within the first 6 months after launch.
*   Achieve a 5% conversion rate from free users to premium subscribers within the first year.
*   Establish the platform as the top-rated digital NCLEX review tool in the Philippines.
*   Provide an engaging, personalized, and convenient learning experience.
*   Offer interactive questions with instant feedback and detailed rationales.
*   Allow users to track progress and bookmark concepts.
*   Foster a community through commenting and sharing success stories.

### Background Context

The current NCLEX 311 content exists as a static printed book, which lacks interactivity, accessibility, and personalization. This project aims to transform the "NCLEX 311 QuickFix® Edition" book into a modern, mobile-first, interactive web application. The platform will solve the limitations of the print format by offering a dynamic and engaging learning tool for nursing students and professionals preparing for the NCLEX-RN exam, primarily targeting aspiring nurses in the Philippines and overseas.

The platform will be built on a freemium model, providing free access to a portion of the content to showcase its value and offering full access via an annual subscription. This will create a more efficient, engaging, and supportive study process, ultimately boosting user confidence and preparedness for the NCLEX-RN examination.

### Change Log

| Date       | Version | Description   | Author    |
| :--------- | :------ | :------------ | :-------- |
| 2025-09-01 | 1.0     | Initial draft | John (PM) |

---

## Requirements

### Functional

1.  **FR1:** The system shall allow users to sign up and log in using an email and password.
2.  **FR2:** The system shall provide free access to the first four chapters of the NCLEX 311 content.
3.  **FR3:** The system shall restrict access to chapters 5-8 to users with a premium subscription.
4.  **FR4:** The system shall integrate with Maya Business to process one-time annual subscription payments.
5.  **FR5:** The system shall provide a responsive content viewer for all 323 concepts and their associated multiple-choice questions.
6.  **FR6:** The system shall provide instant feedback and rationales for quiz questions.
7.  **FR7:** The system shall allow users to bookmark concepts for later review.
8.  **FR8:** The system shall provide a progress dashboard showing chapter-by-chapter completion tracking, and a bookmarks view for saved concepts with personal notes.
9.  **FR9:** The system shall include a Content Management System (CMS) for managing concepts, questions, and rationales.
10. **FR10:** The CMS shall include a utility to import pre-extracted JSON content and associated medical images into the database, with images stored in Vercel Blob Storage.
11. **FR11:** The system shall allow users to post comments on concepts.
12. **FR12:** The system shall provide a sidebar navigation interface showing the current chapter's concept list with completion indicators and quick-access buttons.
13. **FR13:** The system shall allow users to create and save personal notes (up to 2000 characters) for any concept.
14. **FR14:** The system shall provide a discussion/community interface where users can post questions and discussions, with support for instructor posts and student replies.
15. **FR15:** The system shall provide an all chapters grid view with search/filter functionality and progress visualization.

### Non-Functional

1.  **NFR1:** The application must be a fully responsive web app, providing a seamless experience on all modern desktop and mobile browsers (Chrome, Safari, Firefox, Edge).
2.  **NFR2:** Pages should be optimized for a load time of under 3 seconds on a standard mobile internet connection.
3.  **NFR3:** The infrastructure must support at least 1,000 concurrent users at launch.
4.  **NFR4:** The application must implement standard web security best practices, including HTTPS, secure password storage, and protection against common vulnerabilities (e.g., OWASP Top 10).
5.  **NFR5:** The backend shall expose a well-documented REST or GraphQL API.

---

## User Interface Design Goals

### Overall UX Vision

The UX vision is to create a modern, mobile-first, and highly intuitive web application that transforms the static NCLEX 311 content into a dynamic and engaging learning experience. The platform should feel encouraging and supportive, empowering users to study effectively anytime, anywhere.

### Key Interaction Paradigms

*   **Interactive Quizzing:** A simple, clear interface for answering multiple-choice questions with immediate visual feedback (correct/incorrect) and one-click access to detailed rationales.
*   **Concept Navigation:** Easy browsing and searching of all 323 concepts, with clear indicators for free vs. premium content.
*   **Progressive Disclosure:** Content and options are revealed contextually to avoid overwhelming the user. For example, rationales are shown only after a question is answered.
*   **One-Click Bookmarking:** A simple, persistent toggle to save or unsave a concept for later review from the dashboard.

### Core Screens and Views

*   **Login/Sign-Up Screen:** A clean and simple form for user authentication (implemented with MUI components).
*   **Sidebar Navigation:** Persistent navigation panel showing current chapter's concepts with completion indicators (desktop: always visible; mobile: drawer).
*   **Concept/Quiz Viewer:** Single-scroll interface with "READ THIS" content section, visual arrow transition, and "ANSWER THIS" quiz section with inline feedback.
*   **All Chapters View:** Grid-based overview of all 8 chapters with progress visualization and free/premium indicators.
*   **Progress Dashboard:** Detailed chapter-by-chapter progress tracking with animated progress bars and completed concepts lists.
*   **Bookmarks View:** Grid of bookmarked concepts with personal notes display and quick-action buttons.
*   **Notes Modal:** Full-screen overlay for personal note-taking with character limit and tips section.
*   **Discussion Modal:** Community discussion interface with instructor posts, student replies, and engagement features.
*   **Subscription/Upgrade Page:** Clear and secure page for premium upgrade, integrated with Maya Business.
*   **User Profile/Settings Page:** Basic page for managing account details.

### Accessibility: WCAG AA

To ensure the application is usable by the widest possible audience, we will target WCAG 2.1 AA compliance. This was assumed as a best practice for a modern educational platform.

### Branding

The application should incorporate the branding of the established Ray A. Gapuz review system to leverage its authority and trust. Specific brand guidelines (logos, color palette, typography) need to be provided.

### Target Device and Platforms: Web Responsive

The application will be a fully responsive web app, ensuring a seamless and optimized experience across all modern desktop and mobile browsers (Chrome, Safari, Firefox, Edge).

---

## Technical Assumptions

### Repository Structure: Monorepo

A monorepo is recommended to house the unified Next.js application and the separate PDF parsing utility, simplifying project management.

### Service Architecture: Integrated (Next.js)

Since the complex PDF parsing will be handled by a separate one-time script, the application's backend requirements (auth, payments, data APIs) are streamlined. Therefore, we will use an **integrated architecture where the Next.js framework handles both the frontend and the backend API routes**. This simplifies development, deployment, and maintenance.

### Testing Requirements: Unit + Integration

The testing strategy will focus on a combination of unit tests for individual components (React components, API routes) and integration tests for key user workflows.

### Additional Technical Assumptions and Requests

*   **Application Framework:** **Next.js** will be used for both the frontend and backend, providing a unified React-based development experience.
*   **PDF Parsing Utility:** A **separate, one-time utility will be built in Python** to perform the initial database seeding from the source PDF. This is a temporary tool, not part of the deployed application.
*   **Database:** **PostgreSQL** remains the recommended database.
*   **API:** The backend API will be implemented using **Next.js API Routes**.
*   **Deployment:** The Next.js application will be deployed on a cloud platform optimized for it, such as **Vercel**, or a major provider like **AWS** or **Google Cloud**.
*   **Payment Gateway:** The system will exclusively use the **Maya Business API**.

---

## Epic List

1.  **Epic 1: Foundation & Freemium Experience**
    *   **Goal:** Establish the core application infrastructure, import all content, and allow users to sign up and study the four free chapters.
    *   **Status:** Backend complete; UI layer superseded by Epic 1.5.

2.  **Epic 1.5: UX Enhancement - Modern Learning Interface**
    *   **Goal:** Implement the approved modern UI design with sidebar navigation, inline quiz interactions, and enhanced engagement features (notes, discussion, progress tracking, bookmarks).
    *   **Note:** Incorporates requirements from original Stories 1.6.1 (markdown rendering), 1.7 (interactive quizzing), and absorbs Epic 3 Stories 3.1-3.2 (commenting).

3.  **Epic 2: Premium Subscription & Personalization**
    *   **Goal:** Implement the payment gateway for premium subscriptions.
    *   **Note:** Story 2.3 (Basic Dashboard) removed; functionality provided by Epic 1.5. Stories 2.2 (Bookmarking) and 2.4 (Mark Complete) enhanced by Epic 1.5 views.

4.  **Epic 3: Community Engagement**
    *   **Goal:** Content moderation for community discussions.
    *   **Note:** Stories 3.1-3.2 (View/Post Comments) absorbed into Epic 1.5.6 (Discussion Modal). Only Story 3.3 (Moderation) remains.

---

## Epic 1: Foundation & Freemium Experience

**Goal:** This foundational epic will establish the project's technical backbone, including the Next.js application, database schema, testing frameworks, and a basic CI/CD pipeline. It will deliver the initial, tangible user value: the ability to sign up and study the first four chapters for free. The one-time content import from the source PDF will also be completed within this epic.

### Story 1.0: Repository Setup & Project Scaffolding

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

### Story 1.1: Project & Infrastructure Setup

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

### Story 1.2: Development Environment & Local Setup

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

### Story 1.3 (Revised): One-Time Content Import for Multiple Question Formats

*   **As a** content manager,
*   **I want** to use a one-time script to parse the NCLEX 311 PDF and populate the database, correctly identifying different question formats,
*   **so that** all content, including complex questions, is accurately represented in the application.

**Acceptance Criteria:**
1.  A Python script is created that can read the source PDF.
2.  The script correctly identifies and extracts all concepts and their associated questions, including the **type** of question (e.g., Multiple Choice, Select All That Apply, Fill-in-the-blank, Matrix/Grid).
3.  The script successfully inserts all extracted content into a PostgreSQL database schema that supports these various question and answer structures.
4.  A spot-check of at least one of each question type in the database confirms data integrity and correct type identification.

### Story 1.4: User Authentication

*   **As a** new user,
*   **I want** to sign up for a new account and log in using my email and password,
*   **so that** the system can track my personal progress.

**Acceptance Criteria:**
1.  A user can create an account using a valid email and a password.
2.  Passwords are not stored in plain text.
3.  A logged-in user can log out.
4.  The system prevents registration with an already-used email address.

### Story 1.5: Refactor Authentication UI

*   **As a** user,
*   **I want** the sign-up and login experience to match the established visual design and component library,
*   **so that** the application feels cohesive and professional.

**Acceptance Criteria:**
1.  The Login and Registration forms are refactored to use components from the project's designated component library (MUI).
2.  All colors, fonts, and spacing on the authentication pages must conform to the `Branding & Style Guide` in `docs/front-end-spec.md`.
3.  The layout of the forms must be fully responsive and adhere to the `Responsiveness Strategy` in `docs/front-end-spec.md`.
4.  All interactive elements must meet the `Accessibility Requirements` (WCAG 2.1 AA) defined in `docs/front-end-spec.md`.
5.  Existing authentication functionality remains unchanged and is verified by existing E2E tests.

### Story 1.6: Content Browsing & Freemium Access

*   **As a** guest or free user,
*   **I want** to browse the list of all chapters and concepts, and access the full content for the first four chapters,
*   **so that** I can evaluate the platform's value before considering a subscription.

**Acceptance Criteria:**
1.  All users can see the titles of all chapters and concepts.
2.  Any user can view the full content and quiz for any concept within chapters 1-4.
3.  Attempting to access a concept from chapters 5-8 prompts a non-premium user to upgrade.
4.  The UI clearly distinguishes between free and premium content.

### Story 1.7 (Revised): Interactive Quizzing with Multiple Question Formats

*   **As a** free user,
*   **I want** to take quizzes that include various question formats (like Multiple Choice, Select All That Apply, etc.) and receive immediate feedback,
*   **so that** I can practice with the same types of questions I will see on the actual NCLEX exam.

**Acceptance Criteria:**
1.  The quizzing interface can correctly render and handle the following question types: Multiple Choice (single answer), Select All That Apply (SATA), Fill-in-the-blank, and Matrix/Grid.
2.  After submitting an answer for any question type, the UI immediately indicates if the choice(s) were correct or incorrect.
3.  After answering, the detailed rationale for the correct answer(s) is displayed.
4.  The system correctly evaluates the submission for each question type (e.g., for SATA, all correct options must be selected and no incorrect ones).

---

## Epic 2: Premium Subscription & Personalization

**Goal:** This epic will implement the secure payment workflow for premium subscriptions, our core business objective. It will also enhance user value by providing personalization features, allowing users to bookmark concepts for quick review and track which concepts they have completed.

### Story 2.1: Premium Subscription Workflow

*   **As a** free user,
*   **I want** to upgrade my account to premium by completing a one-time annual subscription payment via Maya Business,
*   **so that** I can gain access to all 323 concepts.

**Acceptance Criteria:**
1.  A clear "Upgrade" call-to-action is present for free users when they encounter premium content.
2.  Clicking "Upgrade" directs the user to a secure payment page integrated with the Maya Business payment gateway.
3.  After a successful payment, the user's account status is immediately updated to "premium".
4.  A premium user can instantly access all content, including chapters 5-8.
5.  If a payment fails, the user is clearly notified, and their account remains on the free tier.

### Story 2.2: Concept Bookmarking

*   **As a** logged-in user,
*   **I want** to bookmark any concept,
*   **so that** I can easily find and revisit it later.

**Acceptance Criteria:**
1.  A bookmark icon or button is present on each concept page.
2.  Clicking the bookmark icon saves the concept to a user-specific list.
3.  The bookmarked state for any concept is persistent for the user across sessions.
4.  The UI clearly indicates whether a concept is currently bookmarked.

### Story 2.3: Basic User Dashboard

*   **As a** logged-in user,
*   **I want** to view a personal dashboard,
*   **so that** I can see all the concepts I have bookmarked and those I have marked as complete.

**Acceptance Criteria:**
1.  A "Dashboard" link is available to all logged-in users.
2.  The dashboard displays a list of all concepts the user has bookmarked, with links to each concept.
3.  The dashboard also displays a list of all concepts the user has marked as "complete".

### Story 2.4: Mark as Complete

*   **As a** logged-in user,
*   **I want** to manually mark a concept as "complete",
*   **so that** I can keep track of my study progress.

**Acceptance Criteria:**
1.  A "Mark as Complete" button or checkbox is present on each concept page.
2.  When a concept is marked as complete, it appears in the "Completed Concepts" list on the user's dashboard.
3.  The user can un-mark a concept as complete.
4.  The main content list should visually indicate which concepts have been marked as complete.

---

## Epic 3: Community Engagement

**Goal:** This epic will foster a supportive learning environment by enabling users to view and post comments on individual concepts. This encourages peer-to-peer learning and discussion, adding a valuable social dimension to the study experience.

### Story 3.1: View Comments on a Concept

*   **As a** logged-in user,
*   **I want** to view comments left by other users on a concept page,
*   **so that** I can benefit from their questions, insights, and discussions.

**Acceptance Criteria:**
1.  Below the quiz and rationale on a concept page, a comment section is displayed.
2.  The comment section lists comments chronologically, showing the commenter's name and the date.
3.  The system loads an initial set of comments and can lazy-load more as the user scrolls.
4.  If there are no comments, a message invites the user to be the first to comment.

### Story 3.2: Post a Comment

*   **As a** logged-in user,
*   **I want** to write and post a comment on a concept page,
*   **so that** I can ask questions or share my own tips with the community.

**Acceptance Criteria:**
1.  A text box is available for logged-in users to write a new comment.
2.  Clicking a "Post" button submits the comment.
3.  The newly posted comment immediately appears in the comment list without a page reload.
4.  The comment is persistently stored and associated with the user and the concept.
5.  Basic spam prevention measures (e.g., rate limiting) are implemented.

### Story 3.3: Basic Comment Moderation

*   **As a** content manager,
*   **I want** to view and delete any comment from within the Content Management System (CMS),
*   **so that** I can remove inappropriate or spam comments to maintain a healthy community.

**Acceptance Criteria:**
1.  The CMS has a new section for comment moderation.
2.  The content manager can view all comments, with the ability to sort or filter them.
3.  The content manager can delete any comment with a single click.
4.  Deleting a comment immediately and permanently removes it from the application.

---

## Next Steps

### UX Expert Prompt

> Hello Sally (*UX Expert*). Please review this Product Requirements Document, paying close attention to the 'User Interface Design Goals' section. Your task is to use your `*create-front-end-spec` command to produce a detailed specification for the application's user interface and experience.

### Architect Prompt

> Hello Winston (*Architect*). Please review this Product Requirements Document, paying close attention to the 'Requirements' and 'Technical Assumptions' sections. Your task is to use your `*create-full-stack-architecture` command to produce the detailed system architecture document for the project.