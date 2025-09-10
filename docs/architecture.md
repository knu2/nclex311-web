# NCLEX311-Web Fullstack Architecture Document

## 1. Introduction

This document outlines the complete fullstack architecture for NCLEX311-Web, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

### 1.1. Starter Template or Existing Project

N/A - Greenfield project.

### 1.2. Change Log

| Date | Version | Description | Author |
| :--- | :--- | :--- | :--- |
| 2025-09-01 | 1.0 | Initial Draft | Winston (Architect) |

---

## 2. High Level Architecture

### 2.1. Technical Summary

The architecture for NCLEX311-Web is an integrated, serverless-first design centered on the **Next.js** framework. This approach unifies the frontend and backend into a single codebase, simplifying development and aligning with the rapid 4-month launch target. The application will be deployed on **Vercel**, a platform optimized for Next.js, to leverage its global edge network for performance and scalability. Backend logic, including user authentication, payment processing, and data access, will be handled via **Next.js API Routes**, which will interact with a **PostgreSQL** database. This streamlined stack ensures a cohesive development experience and provides a robust foundation to meet the functional and non-functional requirements outlined in the PRD.

### 2.2. Platform and Infrastructure Choice

**Platform:** Vercel
**Key Services:** Vercel Hosting, Vercel Postgres, Vercel Edge Functions
**Deployment Host and Regions:** Vercel's Global Edge Network

### 2.3. Repository Structure

**Structure:** Monorepo
**Monorepo Tool:** npm Workspaces (simple and effective for this scale)
**Package Organization:** An `apps` directory for the main web application and a `packages` directory for shared code (e.g., types, UI components).

### 2.4. High Level Architecture Diagram

```mermaid
graph TD
    subgraph User
        U[Web Browser]
    end

    subgraph Vercel Platform
        subgraph Edge Network
            CDN[Vercel CDN]
        end
        subgraph "Next.js Application (Monorepo)"
            WebApp[Frontend: React/Next.js]
            APIRoutes[Backend: Next.js API Routes]
        end
    end

    subgraph Backend Services
        DB[(PostgreSQL Database)]
        Maya[Maya Business API]
    end

    subgraph One-Time Utility
        Parser[Python PDF Parser]
    end

    U --> CDN --> WebApp
    WebApp --> APIRoutes
    APIRoutes --> DB
    APIRoutes --> Maya
    Parser -- Initial Seeding --> DB
```

### 2.5. Architectural Patterns

- **Integrated Architecture (Next.js):** The frontend and backend are built within the same Next.js application.
  - _Rationale:_ Simplifies development, deployment, and state management, accelerating the development lifecycle as required by the project goals.
- **Serverless:** API routes are deployed as serverless functions.
  - _Rationale:_ Automatic scaling to handle fluctuating user loads (up to 1,000 concurrent users) and cost-efficiency, as we only pay for what we use.
- **Component-Based UI:** The frontend will be built as a collection of reusable React components.
  - _Rationale:_ Enhances maintainability, testability, and development speed.
- **API Routes:** Backend logic is exposed via Next.js API Routes.
  - _Rationale:_ Provides a file-based routing system for building the API, keeping the frontend and backend tightly integrated.

---

## 2.6. Testing & CI/CD Alignment

This project adopts a test-first, automation-friendly setup to ensure quality and speed:

- Testing Frameworks
  - Frontend: Jest + React Testing Library (unit/component)
  - Backend: Jest + Supertest (API routes)
  - E2E: Playwright (cross-browser flows)
- CI/CD Baseline
  - Deployments: Vercel (preview on PRs, staging on main)
  - GitHub Actions: run lint, unit/API tests, and basic E2E smoke on PRs and main
- Environment Strategy
  - Use .env.local for local development; provide .env.example committed to the repo
  - Never commit secrets; configure production/staging env vars via Vercel

---

## 3. Tech Stack

### 3.1. Technology Stack Table

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

---

## 4. Data Models

### 4.1. User

**Purpose:** Represents an individual who has signed up for the application. This model stores authentication credentials and tracks the user's subscription status.

**Key Attributes:**
- `id`: `string` - Unique identifier for the user (e.g., UUID).
- `email`: `string` - The user's email address, used for login. Must be unique.
- `passwordHash`: `string` - The user's securely hashed password.
- `subscription`: `enum` - The user's current subscription tier ('FREE' or 'PREMIUM').
- `createdAt`: `DateTime` - Timestamp of when the user account was created.
- `updatedAt`: `DateTime` - Timestamp of the last update to the user account.

#### TypeScript Interface
```typescript
export enum SubscriptionTier {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
}

export interface User {
  id: string;
  email: string;
  subscription: SubscriptionTier;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}
```

#### Relationships
- Has many **Payments**
- Has many **Bookmarks**
- Has many **Completed Concepts**
- Has many **Comments**

---


### 4.2. Chapter (Revised)

**Purpose:** Represents a top-level grouping of educational content.

**Key Attributes:**
- `id`: `string` - Unique identifier for the chapter.
- `title`: `string` - The official title of the chapter.
- `chapterNumber`: `number` - The sequential number of the chapter (e.g., 1, 2, 3).
- `slug`: `string` - A unique, URL-friendly identifier derived from the title (e.g., "chapter-1-fundamentals").

#### TypeScript Interface
```typescript
export interface Chapter {
  id: string;
  title: string;
  chapterNumber: number;
  slug: string;
}
```

#### Relationships
- Has many **Concepts**

---


### 4.3. Concept (Revised)

**Purpose:** Represents a single, distinct learning topic within a chapter.

**Key Attributes:**
- `id`: `string` - Unique identifier for the concept.
- `title`: `string` - The title of the concept.
- `slug`: `string` - A unique, URL-friendly identifier derived from the title (e.g., "what-is-nursing-ethics").
- `content`: `string` - The main body of the educational text for the concept.
- `conceptNumber`: `number` - A number to order the concept within its parent chapter.
- `chapterId`: `string` - A foreign key linking the concept to its parent `Chapter`.

#### TypeScript Interface
```typescript
export interface Concept {
  id: string;
  title: string;
  slug: string;
  content: string; // Markdown content
  conceptNumber: number;
  chapterId: string;
}
```

#### Relationships
- Belongs to one **Chapter**
- Has many **Questions**
- Is associated with many **Users** through **Bookmarks**
- Is associated with many **Users** through **CompletedConcepts**
- Has many **Comments**

---


### 4.4. Question

**Purpose:** Represents a single quiz question associated with a `Concept`. This model is designed to be flexible to support the various question formats required by the PRD.

**Key Attributes:**
- `id`: `string` - Unique identifier for the question.
- `text`: `string` - The text of the question itself.
- `type`: `enum` - The format of the question (e.g., Multiple Choice, Select All That Apply).
- `rationale`: `string` - The detailed explanation for why the correct answer(s) are correct.
- `conceptId`: `string` - A foreign key linking the question to its parent `Concept`.

#### TypeScript Interface
```typescript
export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE', // Single correct answer
  SELECT_ALL_THAT_APPLY = 'SELECT_ALL_THAT_APPLY', // Multiple correct answers
  FILL_IN_THE_BLANK = 'FILL_IN_THE_BLANK',
  MATRIX_GRID = 'MATRIX_GRID',
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  rationale: string;
  conceptId: string;
  options: Option[]; // Include options directly for convenience
}
```

#### Relationships
- Belongs to one **Concept**
- Has many **Options**

---


### 4.5. Option

**Purpose:** Represents a single answer choice for a given `Question`. For multiple-choice formats, there will be several options. For "Fill-in-the-blank" questions, there might be just one `Option` record representing the correct answer.

**Key Attributes:**
- `id`: `string` - Unique identifier for the option.
- `text`: `string` - The text of the answer choice presented to the user.
- `isCorrect`: `boolean` - A flag indicating whether this is a correct answer.
- `questionId`: `string` - A foreign key linking the option to its parent `Question`.

#### TypeScript Interface
```typescript
export interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
  questionId: string;
}
```

#### Relationships
- Belongs to one **Question**

---


### 4.6. Bookmark

**Purpose:** Creates a many-to-many relationship between a `User` and a `Concept`. This allows users to save specific concepts for easy access from their dashboard, as required by Story 2.2.

**Key Attributes:**
- `id`: `string` - Unique identifier for the bookmark entry.
- `userId`: `string` - Foreign key linking to the `User`.
- `conceptId`: `string` - Foreign key linking to the `Concept`.
- `createdAt`: `DateTime` - Timestamp of when the bookmark was created.

#### TypeScript Interface
```typescript
export interface Bookmark {
  id: string;
  userId: string;
  conceptId: string;
  createdAt: string; // ISO 8601 date string
}
```

#### Relationships
- Belongs to one **User**
- Belongs to one **Concept**

---


### 4.7. CompletedConcept

**Purpose:** Creates a many-to-many relationship between a `User` and a `Concept` to track progress. This allows users to explicitly mark a concept as "complete," as required by Story 2.4.

**Key Attributes:**
- `id`: `string` - Unique identifier for the completion entry.
- `userId`: `string` - Foreign key linking to the `User`.
- `conceptId`: `string` - Foreign key linking to the `Concept`.
- `createdAt`: `DateTime` - Timestamp of when the concept was marked as complete.

#### TypeScript Interface
```typescript
export interface CompletedConcept {
  id: string;
  userId: string;
  conceptId: string;
  createdAt: string; // ISO 8601 date string
}
```

#### Relationships
- Belongs to one **User**
- Belongs to one **Concept**

---


### 4.8. Comment

**Purpose:** Represents a comment posted by a logged-in `User` on a specific `Concept` page. This model is the foundation for the community discussion features outlined in Epic 3.

**Key Attributes:**
- `id`: `string` - Unique identifier for the comment.
- `text`: `string` - The content of the comment.
- `userId`: `string` - Foreign key linking to the `User` who posted the comment.
- `conceptId`: `string` - Foreign key linking to the `Concept` the comment is on.
- `createdAt`: `DateTime` - Timestamp of when the comment was posted.
- `updatedAt`: `DateTime` - Timestamp of the last update to the comment (if editing is allowed in the future).

#### TypeScript Interface
```typescript
// A partial User object to avoid exposing sensitive user data
export interface Commenter {
  id: string;
  name: string; // Or a username
  avatarUrl?: string;
}

export interface Comment {
  id: string;
  text: string;
  conceptId: string;
  user: Commenter; // Embed partial user info for display
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}
```

#### Relationships
- Belongs to one **User**
- Belongs to one **Concept**

---


### 4.9. Payment

**Purpose:** Records the details of a financial transaction when a `User` attempts to purchase a premium subscription. This model is essential for tracking revenue, managing subscription statuses, and integrating with the Maya Business payment gateway.

**Key Attributes:**
- `id`: `string` - Unique internal identifier for the payment record.
- `userId`: `string` - Foreign key linking to the `User` who initiated the payment.
- `amount`: `number` - The monetary value of the transaction.
- `currency`: `string` - The currency of the transaction (e.g., "PHP").
- `status`: `enum` - The current state of the payment (`PENDING`, `SUCCESSFUL`, `FAILED`).
- `providerTransactionId`: `string` - The unique transaction identifier provided by Maya Business.
- `createdAt`: `DateTime` - Timestamp of when the payment was initiated.
- `updatedAt`: `DateTime` - Timestamp of the last update to the payment status.

#### TypeScript Interface
```typescript
export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESSFUL = 'SUCCESSFUL',
  FAILED = 'FAILED',
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  providerTransactionId: string;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}
```

#### Relationships
- Belongs to one **User**

---


## 5. API Specification

### 5.1. REST API Specification (OpenAPI)

The following is a summary of the core API endpoints. A more detailed `openapi.yaml` file will be generated as part of the development process.

```yaml
openapi: 3.0.0
info:
  title: "NCLEX311-Web API"
  version: "1.0.0"
  description: "API for the NCLEX311-Web interactive learning platform."
servers:
  - url: "/api"
    description: "Next.js API Routes"

paths:
  /auth/{...}:
    summary: "Authentication handled by Auth.js (NextAuth)."
    description: "Endpoints like /api/auth/signin, /api/auth/signout, /api/auth/session are automatically provided by the Auth.js library."

  /chapters:
    get:
      summary: "Get all chapters"
      description: "Returns a list of all chapters with their nested concepts, used for building the main navigation."

  /concepts/{conceptId}:
    get:
      summary: "Get a single concept"
      description: "Returns the full details for a single concept, including its content and associated quiz. The API will enforce premium access rules for chapters 5-8."

  /concepts/{conceptId}/comments:
    get:
      summary: "Get comments for a concept"
      description: "Retrieves a paginated list of comments for a specific concept."
    post:
      summary: "Post a new comment"
      description: "Allows a logged-in user to post a comment on a concept. (Requires authentication)"

  /me/dashboard:
    get:
      summary: "Get user dashboard data"
      description: "A single endpoint to fetch all data for the user's dashboard, including lists of bookmarked and completed concepts. (Requires authentication)"

  /me/bookmarks:
    post:
      summary: "Bookmark a concept"
      description: "Adds a concept to the current user's bookmarks. (Requires authentication)"
    delete:
      summary: "Remove a bookmark"
      description: "Removes a concept from the current user's bookmarks. (Requires authentication)"

  /me/completed-concepts:
    post:
      summary: "Mark a concept as complete"
      description: "Marks a concept as complete for the current user. (Requires authentication)"
    delete:
      summary: "Un-mark a concept as complete"
      description: "Removes the 'complete' status from a concept for the current user. (Requires authentication)"

  /payments/checkout-session:
    post:
      summary: "Create a payment checkout session"
      description: "Initiates a payment process with Maya Business and returns a checkout URL for the client to redirect to. (Requires authentication)"

  /webhooks/payment-provider:
    post:
      summary: "Webhook for payment provider"
      description: "A public endpoint for Maya Business to send asynchronous updates on payment status (e.g., SUCCESSFUL, FAILED)."

```

---


## 6. Components

### 6.1. Frontend Components

#### 1. Authentication UI
- **Responsibility:** Manages all user-facing authentication views, including sign-up, login, and session management.
- **Key Interfaces:** `LoginForm`, `SignUpForm`, `AuthProvider` (a React context to provide session data to the app).
- **Dependencies:** `Auth.js` hooks (e.g., `useSession`), API Client.
- **Technology Stack:** React, Next.js, Auth.js.

#### 2. Content & Quiz Viewer
- **Responsibility:** Renders the core learning experience. Displays concept text (from Markdown) and manages the interactive quiz, including rendering different question types and showing feedback.
- **Key Interfaces:** `ConceptView`, `QuizEngine`, `QuestionCard`.
- **Dependencies:** API Client, `Concept` and `Question` data models.
- **Technology Stack:** React, Next.js, a Markdown renderer (e.g., `react-markdown`).

#### 3. Dashboard
- **Responsibility:** Displays the user's personalized space, including lists of bookmarked and completed concepts.
- **Key Interfaces:** `DashboardLayout`, `BookmarkedList`, `CompletedList`.
- **Dependencies:** API Client.
- **Technology Stack:** React, Next.js.

#### 4. Payment & Subscription UI
- **Responsibility:** Handles all UI related to upgrading to a premium plan. Displays calls-to-action and redirects the user to the payment gateway.
- **Key Interfaces:** `UpgradeButton`, `PremiumModal`.
- **Dependencies:** API Client.
- **Technology Stack:** React, Next.js.
### 6.2. Backend Components (Services)

#### 1. Content Service
- **Responsibility:** Acts as the gatekeeper for all educational content. It fetches data from the database and, most importantly, enforces the business rule that only premium users can access concepts beyond chapter 4.
- **Key Interfaces:** `getChapters()`, `getConcept(conceptId, userId)`.
- **Dependencies:** `ConceptRepository`, `ChapterRepository`, `UserRepository`.
- **Technology Stack:** TypeScript, Next.js API Routes.

#### 2. Personalization Service
- **Responsibility:** Manages all user-specific data related to their learning journey, such as bookmarks and progress tracking.
- **Key Interfaces:** `addBookmark(userId, conceptId)`, `markConceptAsComplete(userId, conceptId)`, `getDashboardData(userId)`.
- **Dependencies:** `BookmarkRepository`, `CompletedConceptRepository`.
- **Technology Stack:** TypeScript, Next.js API Routes.

#### 3. Payment Service
- **Responsibility:** Orchestrates the entire payment workflow. It communicates with the Maya Business API to create payment sessions and handles incoming webhooks to update a user's subscription status upon successful payment.
- **Key Interfaces:** `createCheckoutSession(userId)`, `handlePaymentWebhook(payload)`.
- **Dependencies:** `UserRepository`, `PaymentRepository`, Maya Business SDK.
- **Technology Stack:** TypeScript, Next.js API Routes.

#### 4. Data Access Layer (Repositories)
- **Responsibility:** A set of classes that abstract all database interactions. Each repository (e.g., `UserRepository`, `ConceptRepository`) will be responsible for querying a single table.
- **Key Interfaces:** `findById()`, `create()`, `update()`, etc., for each data model.
- **Dependencies:** Database client (e.g., `node-postgres`, Prisma).
- **Technology Stack:** TypeScript.

---

## 7. External APIs

### 7.1. Maya Business API

- **Purpose:** To securely process one-time annual subscription payments from users, enabling the core business model of the application.
- **Documentation:** `https://developers.maya.ph/docs/maya-api-products`
- **Base URL(s):**
    - Sandbox: `https://pg-sandbox.paymaya.com`
    - Production: `https://pg.maya.ph`
- **Authentication:** The backend `Payment Service` will use a **Secret API Key** to authenticate with the Maya Business API. All secret keys will be stored securely as environment variables on the server.
- **Rate Limits:** To be determined from the official Maya Business API documentation. We must ensure the limits are sufficient for our expected user traffic.

**Key Endpoints Used:**
- `POST /checkout/v1/checkouts`: This endpoint will be called by our backend `Payment Service` to create a new, secure checkout session. Maya will return a `redirectUrl` in the response.
- **Webhook Listener:** We will need to provide an endpoint in our application (e.g., `/api/webhooks/payment-provider`) that Maya will call to send us asynchronous updates about the payment status (e.g., `PAYMENT_SUCCESS`, `PAYMENT_FAILED`).

**Integration Notes:**
- The integration is server-side only. The frontend will **never** handle the secret API key.
- The user flow will be:
    1. User clicks "Upgrade" in our application.
    2. Our frontend calls our own backend (`POST /api/payments/checkout-session`).
    3. Our backend `Payment Service` calls the Maya `POST /checkout/v1/checkouts` endpoint.
    4. Our backend receives the `redirectUrl` from Maya and sends it back to our frontend.
    5. Our frontend redirects the user's browser to the Maya-hosted payment page.
    6. After payment, Maya notifies our webhook endpoint, and we update the user's subscription status in our database.

---


## 8. Core Workflows

### 8.1. User Login Flow

This diagram illustrates the sequence of events when a user signs in with their email and password.

```mermaid
sequenceDiagram
    participant User
    participant Browser (Next.js UI)
    participant Auth.js Library
    participant Database

    User->>Browser (Next.js UI): Enters email & password, clicks Login
    Browser (Next.js UI)->>Auth.js Library: POST /api/auth/signin with credentials
    activate Auth.js Library

    Auth.js Library->>Database: Find user by email
    activate Database
    Database-->>Auth.js Library: Return user record (with hashed password)
    deactivate Database

    Auth.js Library->>Auth.js Library: Verify password against hash
    alt Credentials are valid
        Auth.js Library->>Auth.js Library: Create session (e.g., JWT) 
        Auth.js Library-->>Browser (Next.js UI): Set secure session cookie
        Browser (Next.js UI)->>User: Redirect to Dashboard
    else Credentials are invalid
        Auth.js Library-->>Browser (Next.js UI): Return error message
        Browser (Next.js UI)->>User: Display "Invalid credentials" error
    end
    deactivate Auth.js Library
```

### 8.2. Premium Subscription & Payment Flow

This diagram has been updated to reflect the redirect-based payment confirmation flow shown in the Maya Checkout API documentation.

```mermaid
sequenceDiagram
    participant User
    participant Browser (Next.js UI)
    participant Our Backend (API)
    participant Maya Business API
    participant Our Database

    User->>Browser (Next.js UI): Clicks "Upgrade to Premium"
    Browser (Next.js UI)->>Our Backend (API): POST /api/payments/checkout-session
    activate Our Backend (API)

    Our Backend (API)->>Maya Business API: POST /checkout/v1/checkouts <br> (with success, failure, and cancel redirect URLs)
    activate Maya Business API
    Maya Business API-->>Our Backend (API): Return { redirectUrl, checkoutId }
    deactivate Maya Business API

    Our Backend (API)-->>Browser (Next.js UI): Return { redirectUrl }
    deactivate Our Backend (API)

    Browser (Next.js UI)->>User: Redirect to Maya's payment page
    User->>Maya Business API: Authorizes payment on Maya's page

    alt Transaction Outcome
        Maya Business API->>User: Redirects browser to our success URL <br> e.g., /payment/success?id={checkoutId}
    else Transaction Fails or is Cancelled
        Maya Business API->>User: Redirects browser to our failure/cancel URL
    end

    User->>Browser (Next.js UI): Lands on our success page
    Browser (Next.js UI)->>Our Backend (API): POST /api/payments/verify <br> (send checkoutId from URL)
    activate Our Backend (API)

    Our Backend (API)->>Maya Business API: GET /checkout/v1/checkouts/{checkoutId} <br> (to get definitive status)
    activate Maya Business API
    Maya Business API-->>Our Backend (API): Return payment status
    deactivate Maya Business API

    alt Payment is confirmed successful
        Our Backend (API)->>Our Database: UPDATE User SET subscription = 'PREMIUM'
        activate Our Database
        Our Database-->>Our Backend (API): Confirm user updated
        deactivate Our Database
        Our Backend (API)-->>Browser (Next.js UI): Return { success: true }
    else Payment is not confirmed
        Our Backend (API)-->>Browser (Next.js UI): Return { success: false }
    end
    deactivate Our Backend (API)

    Browser (Next.js UI)->>User: Display "Payment Successful" message
```

---


## 9. Database Schema

This SQL script defines the complete schema for the PostgreSQL database.

```sql
-- Create ENUM types for consistency and type safety
CREATE TYPE subscription_tier AS ENUM ('FREE', 'PREMIUM');
CREATE TYPE question_type AS ENUM ('MULTIPLE_CHOICE', 'SELECT_ALL_THAT_APPLY', 'FILL_IN_THE_BLANK', 'MATRIX_GRID');
CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCESSFUL', 'FAILED');

-- Main table for users and their subscription status
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    subscription subscription_tier NOT NULL DEFAULT 'FREE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_email ON users(email);

-- Table for content chapters
CREATE TABLE chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    chapter_number INT NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_chapters_slug ON chapters(slug);

-- Table for learning concepts, linked to chapters
CREATE TABLE concepts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    concept_number INT NOT NULL,
    chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    created_at TIMESTAMTIOZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_concepts_slug ON concepts(slug);
CREATE INDEX idx_concepts_chapter_id ON concepts(chapter_id);

-- Table for quiz questions, linked to concepts
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,
    type question_type NOT NULL,
    rationale TEXT,
    concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_questions_concept_id ON questions(concept_id);

-- Table for answer options, linked to questions
CREATE TABLE options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_options_question_id ON options(question_id);

-- Join table for user bookmarks
CREATE TABLE bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, concept_id)
);
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);

-- Join table for user progress
CREATE TABLE completed_concepts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, concept_id)
);
CREATE INDEX idx_completed_concepts_user_id ON completed_concepts(user_id);

-- Table for user comments on concepts
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_comments_concept_id ON comments(concept_id);

-- Table for payment transactions
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status payment_status NOT NULL DEFAULT 'PENDING',
    provider_transaction_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_payments_user_id ON payments(user_id);

```

---


## 10. Unified Project Structure

```plaintext
nclex311-bmad/
├── apps/
│   └── web/                        # The main Next.js application
│       ├── app/
│       │   ├── (auth)/             # Route group for auth pages (e.g., login, signup)
│       │   │   └── login/
│       │   │       └── page.tsx
│       │   ├── (main)/             # Route group for the main app layout
│       │   │   ├── concepts/
│       │   │   │   └── [slug]/      # Dynamic route for concept pages
│       │   │   │       └── page.tsx
│       │   │   ├── dashboard/
│       │   │   │   └── page.tsx
│       │   │   └── layout.tsx      # Layout shared by main app pages
│       │   ├── api/                # Backend API routes
│       │   │   ├── payments/
│       │   │   │   ├── checkout-session/
│       │   │   │   │   └── route.ts
│       │   │   │   └── verify/
│       │   │   │       └── route.ts
│       │   │   └── webhooks/
│       │   │       └── payment-provider/
│       │   │           └── route.ts
│       │   ├── layout.tsx          # Root layout for the entire application
│       │   └── page.tsx            # Homepage
│       ├── components/             # React components specific to this app
│       │   ├── auth/
│       │   ├── concept/
│       │   └── quiz/
│       ├── lib/                    # Utility functions, hooks, etc.
│       ├── public/                 # Static assets (images, fonts)
│       └── next.config.mjs         # Next.js configuration
├── packages/
│   ├── db/                       # Database schema, client, and repository logic
│   ├── ui/                       # Shared, unstyled UI components (e.g., Button, Card)
│   └── config/                   # Shared configurations (ESLint, TypeScript)
├── scripts/
│   └── pdf-parser/               # The separate Python PDF parsing utility
│       ├── main.py
│       └── requirements.txt
├── .gitignore
├── package.json                  # Root package.json with workspaces config
└── README.md
```

---


## 11. Development Workflow

### 11.1. Local Development Setup

#### Prerequisites
A developer will need the following tools installed on their local machine:
- **Node.js** (v18.x or later)
- **npm** (v9.x or later, comes with Node.js)
- **Git**
- **Python** (v3.9 or later, for the PDF parsing script)

#### Initial Setup
To get the project running for the first time:
```bash
# 1. Clone the repository
git clone <repository_url>
cd nclex311-bmad

# 2. Install all dependencies for the monorepo
npm install

# 3. Set up local environment variables
# (Create a .env file and fill it with the values from .env.example)
cp .env.example .env

# 4. Set up the database schema
# (This command will need to be configured in package.json)
npm run db:migrate
```

#### Development Commands
```bash
# Start the Next.js development server (with hot reloading)
npm run dev

# Run all tests (unit, integration) across the monorepo
npm run test

# Run the linter to check for code quality
npm run lint

# Build the application for production
npm run build

# Start the application in production mode
npm run start
```

### 11.2. Environment Configuration

A `.env` file must be created in the root of the project for local development. It should contain the following variables:

```bash
# .env.example

# DATABASE
# Connection string for the PostgreSQL database
DATABASE_URL="postgresql://user:password@localhost:5432/nclex311"

# AUTHENTICATION (Auth.js)
# A secret key used to sign JWTs and other tokens.
# Generate one here: https://generate-secret.vercel.app/32
NEXTAUTH_SECRET="your-super-secret-auth-key"
# The canonical URL of the application
NEXTAUTH_URL="http://localhost:3000"

# MAYA BUSINESS API
# Keys obtained from the Maya Business developer dashboard
MAYA_PUBLIC_KEY="pk-..."
MAYA_SECRET_KEY="sk-..."

# NEXT.JS
# The public URL of the app, accessible from the client-side
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---


## 12. Deployment Architecture

Our deployment strategy is centered around the **Vercel** platform and its seamless integration with Git. This provides us with a robust, automated CI/CD pipeline out of the box.

### 12.1. Deployment Strategy

Since we are using the integrated Next.js architecture, the frontend and backend are deployed as a single, unified application.

- **Platform:** Vercel
- **Build Command:** `npm run build`
- **Output Directory:** `.next` (This is standard for Next.js and automatically handled by Vercel)
- **Deployment Method:** Git-based. Deployments are automatically triggered by `git push` events to our GitHub repository.

### 12.2. CI/CD Pipeline

Our CI/CD process uses a combination of GitHub Actions (for checks) and Vercel (for deployment).

1.  **Continuous Integration (GitHub Actions):** On every push to a pull request, a GitHub Actions workflow will run to ensure code quality *before* deployment.
2.  **Continuous Deployment (Vercel):**
    *   **Preview:** When a pull request is opened, Vercel automatically deploys the changes to a unique, shareable preview URL. This allows for testing and review in a production-like environment before merging.
    *   **Production:** When a pull request is merged into the `main` branch, Vercel automatically builds and deploys the changes to the production environment, making them live to users.

Here is a conceptual CI workflow file for GitHub Actions:

```yaml
# .github/workflows/ci.yaml
name: Continuous Integration

on: [pull_request]

jobs:
  test-and-lint:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm install

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm run test
```

### 12.3. Environments

We will use three primary environments:

| Environment | URL | Purpose |
| :--- | :--- | :--- |
| **Development** | `http://localhost:3000` | Local development on developer machines. |
| **Preview** | `*-<org>.vercel.app` | Automatically generated for each pull request. Used for testing, QA, and stakeholder review before merging to production. |
| **Production**| `https://www.nclex311.com` (TBD) | The live application accessible to all users. |

---


## 13. Security and Performance

### 13.1. Security Requirements

Security will be implemented in layers across the application, following the principle of "defense in depth."

**Frontend Security:**
- **Content Security Policy (CSP):** A strict CSP will be implemented via `next.config.js` to prevent Cross-Site Scripting (XSS) and other injection attacks by defining trusted sources for scripts, styles, and other assets.
- **XSS Prevention:** We will rely on React's default JSX escaping to prevent XSS. The use of `dangerouslySetInnerHTML` will be strictly forbidden without a thorough security review and data sanitization.
- **Secure Cookies:** All session-related cookies, managed by `Auth.js`, will be configured as `httpOnly`, `secure`, and `SameSite=Lax` to prevent access from client-side scripts and protect against CSRF attacks.

**Backend Security:**
- **Input Validation:** All incoming data to API routes (request bodies, query parameters, headers) will be rigorously validated using a schema validation library like **Zod**. This is our first line of defense against injection attacks and malformed data.
- **Rate Limiting:** Sensitive endpoints, especially authentication (`/api/auth/signin`) and payment (`/api/payments/checkout-session`), will be rate-limited to prevent brute-force attacks and abuse.
- **API Authorization:** Every API endpoint that handles sensitive data or actions will verify the user's session and permissions before processing the request.

**Authentication Security:**
- **Password Hashing:** Passwords will be hashed using a strong, modern algorithm like **bcrypt** or **Argon2** (handled by `Auth.js`).
- **Session Management:** `Auth.js` will be configured to use server-side sessions stored in the database, with the session ID stored in a secure, `httpOnly` cookie. This is more secure than storing JWTs in local storage.

### 13.2. Performance Optimization

Performance is key to user engagement and retention. Our target is a sub-3-second load time as specified in the PRD.

**Frontend Performance:**
- **Rendering Strategy:** We will use a hybrid rendering approach:
    - **Static Site Generation (SSG):** For static marketing or info pages.
    - **Incremental Static Regeneration (ISR):** For concept pages. This allows pages to be statically generated at build time for speed, but automatically re-generated in the background as content is updated.
    - **Client-Side Rendering (CSR):** For the highly dynamic user dashboard.
- **Code Splitting:** Next.js automatically splits JavaScript into smaller chunks on a per-page basis. We will also use dynamic `import()` for large components that are not needed on the initial page load.
- **Image Optimization:** We will use the built-in Next.js `<Image>` component to automatically optimize, resize, and serve images in modern formats like WebP.

**Backend Performance:**
- **Response Time Target:** Aim for an average API response time of **< 200ms**.
- **Database Optimization:** All database queries will be optimized. As defined in the schema, we will use **indexes** on all foreign keys and frequently queried columns. We will also use a connection pool to efficiently manage database connections.
- **Caching:** We will leverage the **Vercel Data Cache** to cache the results of common, non-personalized database queries (e.g., fetching the list of all chapters and concepts for the main navigation).

---


## 14. Testing Strategy

We will adopt a balanced testing strategy, visualized by the testing pyramid, to ensure comprehensive coverage across the entire application. This approach emphasizes writing many fast, isolated unit tests at the base, a good number of integration tests in the middle, and a few high-value, end-to-end tests at the top.

### 14.1. Testing Pyramid

```
      /      \
     / E2E    \      (Playwright)
    /----------\
   / Integration\    (React Testing Library, Supertest)
  /--------------\
 /   Unit Tests   \   (Jest)
/------------------\
```

- **Unit Tests (Base):** The foundation of our strategy. These will test individual functions and components in isolation to verify their logic. They are fast, easy to write, and provide quick feedback.
- **Integration Tests (Middle):** These will test how different parts of our application work together. For example, testing a React component that fetches data from an API, or testing an API route that interacts with the database.
- **End-to-End (E2E) Tests (Top):** These will simulate real user workflows from start to finish in a browser. For example, a single E2E test might script the entire process of a user logging in, navigating to a concept, and posting a comment.

### 14.2. Test Organization

- **Unit & Integration Tests:** Test files will be co-located with the source code they are testing. For example, a test for `components/ui/Button.tsx` will be located at `components/ui/Button.test.tsx`. This makes it easy to find and run tests related to a specific feature.
- **E2E Tests:** These tests will live in a separate `e2e/` directory at the root of the monorepo, as they test the application as a whole.

### 14.3. Test Examples

#### Frontend Component Test (React Testing Library)
```typescript
// tests/components/BookmarkButton.test.tsx
import { render, screen } from '@testing-library/react';
import { BookmarkButton } from '../BookmarkButton';

it('should render a button with the text "Bookmark"', () => {
  render(<BookmarkButton />);
  const buttonElement = screen.getByRole('button', { name: /Bookmark/i });
  expect(buttonElement).toBeInTheDocument();
});
```

#### Backend API Test (Jest + Supertest)
```typescript
// tests/api/chapters.test.ts
import { GET } from '../../app/api/chapters/route';

it('should return a 200 OK status and a list of chapters', async () => {
  // Mock the database call
  const response = await GET();
  const data = await response.json();

  expect(response.status).toBe(200);
  expect(Array.isArray(data.chapters)).toBe(true);
});
```

#### E2E Test (Playwright)
```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('should allow a user to sign in and redirect to the dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // After login, the URL should be the dashboard
  await expect(page).toHaveURL('/dashboard');
  // And the dashboard should contain a welcome message
  await expect(page.locator('h1')).toContainText('Welcome');
});
```

---


## 15. Coding Standards

### 15.1. Critical Fullstack Rules

These are non-negotiable rules that all code must follow.

- **Single Source of Truth for Types:** All shared data types (e.g., `User`, `Concept`) MUST be defined in a central package (`packages/db`) and imported by both the frontend and backend. There must be no duplicate type definitions.
- **Use the API Client Service:** All API calls from the frontend MUST go through the centralized API client service. This service will be responsible for handling authentication tokens and consistent error handling. Do not use `fetch` directly in React components.
- **Use the Repository Pattern:** All database interactions from the backend MUST go through the appropriate repository (e.g., `UserRepository`). API routes should not contain raw database queries. This ensures a clean separation of concerns.
- **Environment Variables:** Access environment variables only through a centralized configuration object. Do not use `process.env.VARIABLE` directly in application code.

### 15.2. Naming Conventions

| Element | Convention | Example |
| :--- | :--- | :--- |
| **Files (Components/Hooks)** | `PascalCase.tsx` or `camelCase.ts` | `ConceptViewer.tsx`, `useAuth.ts` |
| **Components (React)** | `PascalCase` | `const ConceptViewer = () => ...` |
| **Hooks (React)** | `use` prefix, `camelCase` | `function useAuth() { ... }` |
| **API Route Directories** | `kebab-case` | `/api/checkout-session/route.ts` |
| **Database Tables/Columns**| `snake_case` | `user_profiles`, `created_at` |
| **Variables/Functions** | `camelCase` | `const userName = ...` |

---


## 16. Error Handling Strategy

### 16.1. Error Flow

This diagram shows the general flow when an error occurs on the backend during an API call.

```mermaid
sequenceDiagram
    participant User
    participant Frontend UI
    participant API Client
    participant Backend API
    participant Logger

    Frontend UI->>API Client: Calls function (e.g., createComment)
    API Client->>Backend API: Makes API request (e.g., POST /api/comments)
    activate Backend API

    alt Error Occurs
        Backend API->>Backend API: Catches exception (e.g., validation error)
        Backend API->>Logger: Logs detailed error for debugging
        Backend API-->>API Client: Responds with standard error format (e.g., 400 Bad Request)
    end
    deactivate Backend API

    API Client->>API Client: Throws a structured error
    API Client-->>Frontend UI: Propagates error
    Frontend UI->>User: Displays user-friendly message (e.g., "Could not post comment")
```

### 16.2. Standardized API Error Format

All error responses from the API will follow this consistent JSON structure.

```typescript
export interface ApiError {
  error: {
    code: string; // A machine-readable error code (e.g., 'VALIDATION_ERROR', 'NOT_FOUND')
    message: string; // A developer-friendly error message
    details?: Record<string, any>; // Optional structured data, e.g., a list of invalid fields
    timestamp: string; // ISO 8601 timestamp of when the error occurred
  };
}
```

### 16.3. Frontend Error Handling

The central API client will be responsible for catching API errors and re-throwing them in a predictable way for the UI to handle.

```typescript
// lib/apiClient.ts (conceptual)
async function post(endpoint: string, body: any) {
  const response = await fetch(endpoint, { method: 'POST', body: JSON.stringify(body) });

  if (!response.ok) {
    const errorPayload: ApiError = await response.json();
    // Log the error and/or show a toast notification
    console.error(errorPayload.error.message);
    showToast('An unexpected error occurred.'); // Using a toast library
    throw new Error(errorPayload.error.message);
  }

  return response.json();
}
```

### 16.4. Backend Error Handling

We will use a higher-order function (or middleware) to wrap all our API route handlers to ensure errors are caught and formatted consistently.

```typescript
// lib/api/errorHandler.ts (conceptual)
import { NextResponse } from 'next/server';

export function withErrorHandler(handler) {
  return async (req, params) => {
    try {
      return await handler(req, params);
    } catch (error) {
      console.error(error); // Log the full error for debugging

      // Default to a 500 Internal Server Error
      const errorResponse = {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred.',
          timestamp: new Date().toISOString(),
        },
      };
      // TODO: Add specific checks for validation errors (400), auth errors (401/403), etc.
      return NextResponse.json(errorResponse, { status: 500 });
    }
  };
}

// Usage in an API route
// export const POST = withErrorHandler(async (req) => { ... });
```

---


## 17. Monitoring and Observability

We will use a combination of Vercel's built-in tools and a dedicated error tracking service to ensure we have a comprehensive view of the application's health.

### 17.1. Monitoring Stack

- **Frontend Monitoring:** **Vercel Analytics**. This is enabled by default and will give us real-user performance data, including Core Web Vitals and traffic insights, with no performance impact.
- **Backend Monitoring:** **Vercel Function Logs**. We will monitor the logs for our API routes directly in the Vercel dashboard to track execution time, memory usage, and any backend errors.
- **Error Tracking:** **Sentry**. We will integrate the Sentry SDK into our Next.js application. Sentry will provide real-time, aggregated error reporting for both the frontend and backend, with detailed stack traces and context that makes debugging significantly easier than just reading logs.
- **Performance Monitoring:** A combination of **Vercel Analytics** for frontend performance and **Sentry** for transaction tracing to identify slow API routes or database queries.

### 17.2. Key Metrics to Watch

We will actively monitor the following metrics to ensure a healthy and performant application.

**Frontend Metrics:**
- **Core Web Vitals:** We will track LCP, FID, and CLS via Vercel Analytics to ensure a good user experience.
- **JavaScript Error Rate:** The percentage of user sessions that are error-free (tracked in Sentry).
- **API Response Times (from client):** The perceived response time for API calls as experienced by the user's browser (tracked in Sentry).

**Backend Metrics:**
- **API Error Rate:** The percentage of API requests that result in a 5xx server error (tracked in Vercel logs and Sentry).
- **API Response Time (p95):** The 95th percentile response time for all API routes. This tells us the response time for 95% of our users, which is a better indicator of performance than the average.
- **Database Performance:** We will monitor slow query logs and connection usage from our database provider's dashboard.

---


## 18. Checklist Results Report

## Checklist Results Report

**Checklist:** architect-checklist.md
**Date:** 2025-09-01
**Validator:** Winston (Architect)

### Executive Summary

- **Overall Readiness:** High
- **Pass Rate:** 89%
- **Critical Risks:** None. The identified gaps are minor and can be addressed before implementation begins.
- **Key Strengths:** The architecture is comprehensive, well-documented, and tightly aligned with the PRD. The technology choices are modern, pragmatic, and well-suited for the project's goals. The inclusion of detailed diagrams, coding standards, and testing strategies provides a strong foundation for development.

### Section Analysis

| Section | Pass Rate | Status |
| :--- | :--- | :--- |
| 1. Requirements Alignment | 100% | ✅ PASS |
| 2. Architecture Fundamentals | 100% | ✅ PASS |
| 3. Technical Stack & Decisions | 75% | ⚠️ PARTIAL |
| 4. Frontend Design & Implementation | 67% | ⚠️ PARTIAL |
| 5. Resilience & Operational Readiness | 75% | ⚠️ PARTIAL |
| 6. Security & Compliance | 50% | ⚠️ PARTIAL |
| 7. Implementation Guidance | 100% | ✅ PASS |
| 8. Dependency & Integration Management | 100% | ✅ PASS |
| 9. AI Agent Implementation Suitability | 100% | ✅ PASS |
| 10. Accessibility Implementation | 100% | ✅ PASS |

### Detailed Findings & Recommendations

#### 3. Technical Stack & Decisions (⚠️ PARTIAL)

- **[FAIL] 3.4 Data backup and recovery strategies are outlined:** The document defines the data models and database technology but does not specify the strategy for database backups or a disaster recovery plan.
  - **Recommendation:** Add a subsection to Section 9 (Database Schema) or Section 12 (Deployment Architecture) detailing the backup frequency (e.g., daily), retention period, and the process for restoring the database from a backup.

#### 4. Frontend Design & Implementation (⚠️ PARTIAL)

- **[FAIL] 4.3 Component template/specification format is defined:** While high-level components are identified, the document does not provide a template or format for defining individual component specifications (e.g., props, state, events).
  - **Recommendation:** Add a small section under "Components" that defines a standard format for documenting new components as they are built, to ensure consistency.
- **[FAIL] 4.5 Route definitions table is comprehensive:** The architecture relies on Next.js's file-based routing but does not include a consolidated table of all application routes and their purpose.
  - **Recommendation:** Add a table to Section 10 (Unified Project Structure) that lists the key routes (e.g., `/login`, `/dashboard`, `/concepts/[slug]`) and a brief description of each page.

#### 5. Resilience & Operational Readiness (⚠️ PARTIAL)

- **[FAIL] 5.1 Retry policies are defined where appropriate / Circuit breakers or fallbacks are specified for critical services:** The error handling strategy is well-defined, but it does not mention resilience patterns like automatic retries for transient network errors when calling the Maya API, or circuit breakers to prevent cascading failures.
  - **Recommendation:** In Section 16 (Error Handling), add a note about implementing a retry mechanism in the API client for idempotent requests to external services like Maya.

#### 6. Security & Compliance (⚠️ PARTIAL)

- **[FAIL] 6.2 Data encryption approach (at rest and in transit) is specified / Data retention and purging policies are outlined:** The document implies encryption in transit via HTTPS but does not explicitly state it. It also omits whether data at rest (in the PostgreSQL database) will be encrypted. No policies for data retention or purging are mentioned.
  - **Recommendation:** In Section 13.1 (Security Requirements), explicitly state that all traffic must be over HTTPS. Add a sentence confirming that the database will be encrypted at rest (a standard feature on most cloud database providers).
- **[FAIL] 6.4 Infrastructure Security:** The document relies on Vercel for infrastructure but does not detail any specific security configurations (e.g., firewall rules, DDoS protection).
  - **Recommendation:** Add a brief subsection to 13.1 noting that Vercel's default security features (DDoS mitigation, firewall) will be leveraged, and any additional security configurations will be managed in the Vercel dashboard.

