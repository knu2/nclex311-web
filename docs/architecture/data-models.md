# Data Models

## User

**Purpose:** Represents an individual who has signed up for the application. This model stores authentication credentials and tracks the user's subscription status.

**Key Attributes:**
- `id`: `string` - Unique identifier for the user (e.g., UUID).
- `email`: `string` - The user's email address, used for login. Must be unique.
- `passwordHash`: `string` - The user's securely hashed password.
- `subscription`: `enum` - The user's current subscription tier ('FREE' or 'PREMIUM').
- `createdAt`: `DateTime` - Timestamp of when the user account was created.
- `updatedAt`: `DateTime` - Timestamp of the last update to the user account.

### TypeScript Interface
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

### Relationships
- Has many **Payments**
- Has many **Bookmarks**
- Has many **Completed Concepts**
- Has many **Comments**

---

## Chapter (Revised)

**Purpose:** Represents a top-level grouping of educational content.

**Key Attributes:**
- `id`: `string` - Unique identifier for the chapter.
- `title`: `string` - The official title of the chapter.
- `chapterNumber`: `number` - The sequential number of the chapter (e.g., 1, 2, 3).
- `slug`: `string` - A unique, URL-friendly identifier derived from the title (e.g., "chapter-1-fundamentals").

### TypeScript Interface
```typescript
export interface Chapter {
  id: string;
  title: string;
  chapterNumber: number;
  slug: string;
}
```

### Relationships
- Has many **Concepts**

---

## Concept (Revised)

**Purpose:** Represents a single, distinct learning topic within a chapter.

**Key Attributes:**
- `id`: `string` - Unique identifier for the concept.
- `title`: `string` - The title of the concept.
- `slug`: `string` - A globally unique, URL-friendly identifier with intelligent collision resolution. Uses contextual differentiation and sequential numbering to handle duplicate concept titles during import.
- `content`: `string` - The main body of the educational text for the concept.
- `conceptNumber`: `number` - A number to order the concept within its parent chapter.
- `chapterId`: `string` - A foreign key linking the concept to its parent `Chapter`.

**Slug Generation Strategy:**
- **Base Generation**: Clean slug from title (e.g., "triage", "heart-failure")
- **Contextual Differentiation**: Extract context from content when collisions occur (e.g., "triage-emergency", "heart-failure-acute")
- **Sequential Fallback**: Append numbers for true duplicates (e.g., "triage-2", "heart-failure-2")
- **Global Uniqueness**: Enforced across all concepts regardless of chapter

**Common Collision Examples:**
- "Triage" → `triage`, `triage-emergency`, `triage-2`
- "Heart Failure" → `heart-failure`, `heart-failure-acute`, `heart-failure-2`
- "Guillain-Barre Syndrome" → `guillain-barre-syndrome`, `guillain-barre-syndrome-2`

### TypeScript Interface
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

### Relationships
- Belongs to one **Chapter**
- Has many **Questions**
- Has many **Images** (optional)
- Is associated with many **Users** through **Bookmarks**
- Is associated with many **Users** through **CompletedConcepts**
- Has many **Comments**

---

## Question

**Purpose:** Represents a single quiz question associated with a `Concept`. This model is designed to be flexible to support the various question formats required by the PRD.

**Key Attributes:**
- `id`: `string` - Unique identifier for the question.
- `text`: `string` - The text of the question itself.
- `type`: `enum` - The format of the question (e.g., Multiple Choice, Select All That Apply).
- `rationale`: `string` - The detailed explanation for why the correct answer(s) are correct.
- `conceptId`: `string` - A foreign key linking the question to its parent `Concept`.

### TypeScript Interface
```typescript
export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE', // Single correct answer
  SELECT_ALL_THAT_APPLY = 'SELECT_ALL_THAT_APPLY', // Multiple correct answers
  FILL_IN_THE_BLANK = 'FILL_IN_THE_BLANK',
  MATRIX_GRID = 'MATRIX_GRID',
  PRIORITIZATION = 'PRIORITIZATION', // Drag-and-drop sequencing/ordering questions
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

### Relationships
- Belongs to one **Concept**
- Has many **Options**
- Has many **Images** (optional)

---

## Option

**Purpose:** Represents a single answer choice for a given `Question`. For multiple-choice formats, there will be several options. For "Fill-in-the-blank" questions, there might be just one `Option` record representing the correct answer.

**Key Attributes:**
- `id`: `string` - Unique identifier for the option.
- `text`: `string` - The text of the answer choice presented to the user.
- `isCorrect`: `boolean` - A flag indicating whether this is a correct answer.
- `questionId`: `string` - A foreign key linking the option to its parent `Question`.

### TypeScript Interface
```typescript
export interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
  questionId: string;
}
```

### Relationships
- Belongs to one **Question**

---

## Image

**Purpose:** Represents a medical image (diagram, chart, ECG, etc.) that is associated with educational content. Images are stored in Vercel Blob Storage and linked to concepts or questions for enhanced learning.

**Key Attributes:**
- `id`: `string` - Unique identifier for the image.
- `filename`: `string` - Original filename of the image.
- `blobUrl`: `string` - URL to the image stored in Vercel Blob Storage.
- `alt`: `string` - Alternative text description for accessibility and content identification.
- `width`: `number` - Image width in pixels.
- `height`: `number` - Image height in pixels.
- `fileSize`: `number` - File size in bytes.
- `extractionConfidence`: `string` - Confidence level from extraction process ('high', 'medium', 'low').
- `medicalContent`: `string` - Description of the medical content shown (e.g., "ECG showing atrial fibrillation").
- `conceptId`: `string` (optional) - Foreign key linking to associated Concept.
- `questionId`: `string` (optional) - Foreign key linking to associated Question.
- `createdAt`: `DateTime` - Timestamp of when the image was imported.

### TypeScript Interface
```typescript
export interface Image {
  id: string;
  filename: string;
  blobUrl: string;
  alt: string;
  width: number;
  height: number;
  fileSize: number;
  extractionConfidence: 'high' | 'medium' | 'low';
  medicalContent: string;
  conceptId?: string;
  questionId?: string;
  createdAt: string; // ISO 8601 date string
}
```

### Relationships
- May belong to one **Concept** (optional)
- May belong to one **Question** (optional)

---

## Bookmark

**Purpose:** Creates a many-to-many relationship between a `User` and a `Concept`. This allows users to save specific concepts for easy access from their dashboard, as required by Story 2.2.

**Key Attributes:**
- `id`: `string` - Unique identifier for the bookmark entry.
- `userId`: `string` - Foreign key linking to the `User`.
- `conceptId`: `string` - Foreign key linking to the `Concept`.
- `createdAt`: `DateTime` - Timestamp of when the bookmark was created.

### TypeScript Interface
```typescript
export interface Bookmark {
  id: string;
  userId: string;
  conceptId: string;
  createdAt: string; // ISO 8601 date string
}
```

### Relationships
- Belongs to one **User**
- Belongs to one **Concept**

---

## CompletedConcept

**Purpose:** Creates a many-to-many relationship between a `User` and a `Concept` to track progress. This allows users to explicitly mark a concept as "complete," as required by Story 2.4.

**Key Attributes:**
- `id`: `string` - Unique identifier for the completion entry.
- `userId`: `string` - Foreign key linking to the `User`.
- `conceptId`: `string` - Foreign key linking to the `Concept`.
- `createdAt`: `DateTime` - Timestamp of when the concept was marked as complete.

### TypeScript Interface
```typescript
export interface CompletedConcept {
  id: string;
  userId: string;
  conceptId: string;
  createdAt: string; // ISO 8601 date string
}
```

### Relationships
- Belongs to one **User**
- Belongs to one **Concept**

---

## Comment

**Purpose:** Represents a comment posted by a logged-in `User` on a specific `Concept` page. This model is the foundation for the community discussion features outlined in Epic 3.

**Key Attributes:**
- `id`: `string` - Unique identifier for the comment.
- `text`: `string` - The content of the comment.
- `userId`: `string` - Foreign key linking to the `User` who posted the comment.
- `conceptId`: `string` - Foreign key linking to the `Concept` the comment is on.
- `createdAt`: `DateTime` - Timestamp of when the comment was posted.
- `updatedAt`: `DateTime` - Timestamp of the last update to the comment (if editing is allowed in the future).

### TypeScript Interface
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

### Relationships
- Belongs to one **User**
- Belongs to one **Concept**

---

## Payment

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

### TypeScript Interface
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

### Relationships
- Belongs to one **User**
