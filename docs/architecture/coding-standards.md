# Coding Standards

## Overview

This document establishes the coding standards and best practices for the NCLEX311 Web application. These standards are derived from the actual development environment setup, tooling configurations, and patterns established during Stories 1.1.5 and 1.2, ensuring consistency, maintainability, and developer productivity across the codebase.

**Enforcement:** All standards are enforced through automated tooling including ESLint, Prettier, TypeScript compiler, Husky git hooks, and CI/CD pipeline checks.

## Table of Contents

1. [TypeScript Standards](#typescript-standards)
2. [Code Formatting](#code-formatting)
3. [Project Structure](#project-structure)
4. [Testing Standards](#testing-standards)
5. [Database Standards](#database-standards)
6. [Git Workflow](#git-workflow)
7. [Documentation Standards](#documentation-standards)
8. [Performance Standards](#performance-standards)
9. [Security Standards](#security-standards)
10. [Import and Export Standards](#import-and-export-standards)
11. [Error Handling Standards](#error-handling-standards)
12. [Enforcement and Tooling](#enforcement-and-tooling)

## TypeScript Standards

### Configuration

**Compiler Target:** ES2017 with strict mode enabled
**Configuration File:** `apps/web/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "strict": true,
    "noEmit": true,
    "moduleResolution": "bundler"
  }
}
```

### Type Safety Requirements

#### Strict Mode Compliance

- **REQUIRED:** All TypeScript files must compile with `strict: true`
- **REQUIRED:** No `any` types except in test files (where allowed with warning)
- **REQUIRED:** Explicit return types for all functions and methods
- **REQUIRED:** Proper null checking with type guards

```typescript
// ✅ Good: Explicit types and null checking
async function fetchUserData(userId: string): Promise<UserData | null> {
  if (!userId) {
    return null;
  }
  
  const response = await fetch(`/api/users/${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user data');
  }
  
  return response.json() as UserData;
}

// ❌ Bad: Implicit any and no error handling
async function fetchUserData(userId) {
  const response = await fetch(`/api/users/${userId}`);
  return response.json();
}
```

#### Interface and Type Definitions

- **REQUIRED:** Use interfaces for object shapes, types for unions/primitives
- **REQUIRED:** Export shared types from `packages/types`
- **REQUIRED:** Database interfaces must match actual schema

```typescript
// ✅ Good: Clear interface definitions
interface UserData {
  id: string;
  email: string;
  createdAt: Date;
  isActive: boolean;
}

type UserStatus = 'active' | 'inactive' | 'pending';
type DatabaseOperation = 'insert' | 'update' | 'delete' | 'select';

// ✅ Good: Database types matching schema
interface ConceptRecord {
  id: string; // UUID
  title: string;
  slug: string; // Globally unique
  content: string; // Markdown
  concept_number: number;
  chapter_id: string; // Foreign key
}
```

#### Generic Types and Utilities

- **REQUIRED:** Use utility types for transformations
- **REQUIRED:** Generic constraints for reusable components

```typescript
// ✅ Good: Proper utility type usage
type CreateConceptData = Omit<ConceptRecord, 'id' | 'created_at'>;
type UpdateConceptData = Partial<Pick<ConceptRecord, 'title' | 'content'>>;

// ✅ Good: Generic constraints
interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
}

function createApiResponse<T extends Record<string, unknown>>(
  data: T,
  status: ApiResponse<T>['status'] = 'success'
): ApiResponse<T> {
  return { data, status };
}
```

## Code Formatting

### Prettier Configuration

**Configuration File:** `apps/web/.prettierrc`

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### Formatting Requirements

#### JavaScript/TypeScript

- **2 spaces** for indentation (no tabs)
- **Single quotes** for strings
- **Semicolons** required
- **Trailing commas** for ES5 compatibility
- **Line length** maximum 80 characters
- **LF** line endings (Unix-style)

#### CSS and Tailwind

- **Tailwind class sorting** via prettier-plugin-tailwindcss
- **Utility-first approach** for styling
- **Component classes** for reusable styles

```tsx
// ✅ Good: Properly formatted with Tailwind sorting
const Button: React.FC<ButtonProps> = ({ children, variant = 'primary' }) => {
  return (
    <button
      className={`
        px-4 py-2 font-medium text-sm
        rounded-md border transition-colors
        ${variant === 'primary' 
          ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' 
          : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
        }
      `}
    >
      {children}
    </button>
  );
};
```

## Project Structure

### File Organization

**Monorepo Structure:** npm workspaces with clear separation of concerns

```plaintext
nclex311-bmad/
├── apps/web/                   # Main Next.js application
│   ├── src/app/               # Next.js App Router pages
│   ├── src/lib/               # Utility libraries
│   ├── __tests__/             # Jest tests
│   ├── e2e/                   # Playwright E2E tests
│   ├── migrations/            # Database migrations
│   └── scripts/               # Build and utility scripts
├── packages/types/            # Shared TypeScript definitions
└── docs/                      # Project documentation
```

### File Naming Conventions

#### Components and Pages

- **PascalCase** for React components: `UserProfile.tsx`, `QuestionCard.tsx`
- **kebab-case** for pages and routes: `user-profile.tsx`, `question-details.tsx`
- **camelCase** for utility functions: `formatDate.ts`, `validateEmail.ts`

```typescript
// ✅ Good: Component file structure
// apps/web/src/components/QuestionCard.tsx
export interface QuestionCardProps {
  question: Question;
  onAnswer: (answer: string[]) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question, onAnswer }) => {
  // Component implementation
};

export default QuestionCard;
```

#### Database and API Files

- **kebab-case** for API routes: `health.ts`, `user-profile.ts`
- **camelCase** for database utilities: `database.ts`, `migrationUtils.ts`
- **SCREAMING_SNAKE_CASE** for constants: `DATABASE_TABLES`, `API_ENDPOINTS`

```typescript
// ✅ Good: Database utility structure
// apps/web/src/lib/database.ts
export interface Database {
  public: {
    chapters: Chapter[];
    concepts: Concept[];
    questions: Question[];
  };
}

export const DATABASE_TABLES = {
  CHAPTERS: 'chapters',
  CONCEPTS: 'concepts',
  QUESTIONS: 'questions',
} as const;
```

### Import Organization

**Order:** External packages, internal packages, relative imports, types

```typescript
// ✅ Good: Import organization
// External packages
import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Internal packages
import { UserData } from '@nclex311/types';

// Relative imports
import { database } from '@/lib/database';
import { validateInput } from '../utils/validation';

// Type imports (separate)
import type { Database } from '@/lib/database';
import type { ApiResponse } from '@/types/api';
```

## Testing Standards

### Test Framework Configuration

**Unit Tests:** Jest 30.x + React Testing Library 16.x
**Integration Tests:** Jest + Supertest 7.x
**E2E Tests:** Playwright 1.55.x

### Test File Structure

```plaintext
apps/web/
├── __tests__/                 # Unit and integration tests
│   ├── api/                   # API route tests
│   │   └── health.test.ts
│   ├── components/            # Component tests
│   │   └── QuestionCard.test.tsx
│   ├── utils/                 # Utility function tests
│   │   └── validation.test.ts
│   └── database.integration.test.ts
└── e2e/                       # Playwright E2E tests
    └── user-journey.spec.ts
```

### Testing Patterns

#### Unit Tests

- **REQUIRED:** Test user-facing behavior, not implementation details
- **REQUIRED:** Use React Testing Library for component testing
- **REQUIRED:** Mock external dependencies appropriately

```typescript
// ✅ Good: Behavior-focused testing
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionCard } from '@/components/QuestionCard';
import { mockQuestion } from '@/test-utils/mocks';

describe('QuestionCard', () => {
  it('calls onAnswer when user selects an option', async () => {
    const mockOnAnswer = jest.fn();
    
    render(
      <QuestionCard 
        question={mockQuestion} 
        onAnswer={mockOnAnswer} 
      />
    );
    
    const option = screen.getByRole('radio', { name: /correct answer/i });
    fireEvent.click(option);
    
    expect(mockOnAnswer).toHaveBeenCalledWith(['option-1']);
  });
});
```

#### Integration Tests

- **REQUIRED:** Test API endpoints with Supertest
- **REQUIRED:** Mock Supabase client for database isolation
- **REQUIRED:** Test error scenarios and edge cases

```typescript
// ✅ Good: API integration testing
import request from 'supertest';
import { createMocks } from 'node-mocks-http';
import { GET } from '@/app/api/health/route';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => Promise.resolve({
        data: [],
        error: null
      }))
    }))
  }))
}));

describe('/api/health', () => {
  it('returns healthy status with database connection', async () => {
    const { req } = createMocks({ method: 'GET' });
    const response = await GET(req);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.checks.database).toBe('connected');
  });
});
```

#### E2E Tests

- **REQUIRED:** Test complete user workflows
- **REQUIRED:** Use page object model for maintainability
- **REQUIRED:** Cross-browser testing (Chromium, Firefox, Safari)

```typescript
// ✅ Good: E2E workflow testing
import { test, expect } from '@playwright/test';

test.describe('User Practice Session', () => {
  test('user can complete a practice question', async ({ page }) => {
    await page.goto('/practice');
    
    // Wait for question to load
    await expect(page.locator('[data-testid="question-text"]')).toBeVisible();
    
    // Select an answer
    await page.locator('[data-testid="option-0"]').click();
    
    // Submit answer
    await page.locator('[data-testid="submit-answer"]').click();
    
    // Verify feedback appears
    await expect(page.locator('[data-testid="answer-feedback"]')).toBeVisible();
  });
});
```

#### Script and Utility Testing

- **REQUIRED:** Unit tests for all utility scripts and classes
- **REQUIRED:** Mock external dependencies (Supabase, Vercel Blob, file system)
- **REQUIRED:** Test error handling and edge cases
- **REQUIRED:** Validate CLI argument parsing and help text

```typescript
// ✅ Good: Script utility testing
import { SmartSlugGenerator } from '../src/lib/smart-slug-generator';
import { jest } from '@jest/globals';

// Mock Supabase client
jest.doMock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        like: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    }))
  }))
}));

describe('SmartSlugGenerator', () => {
  let slugGenerator: SmartSlugGenerator;
  let mockSupabase: any;

  beforeEach(async () => {
    // Dynamic import after mock is established
    const { createClient } = await import('@supabase/supabase-js');
    mockSupabase = createClient('mock-url', 'mock-key');
    slugGenerator = new SmartSlugGenerator(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateUniqueConceptSlug', () => {
    it('should generate clean slug when no conflicts exist', async () => {
      const result = await slugGenerator.generateUniqueConceptSlug({
        title: 'Cardiac Assessment',
        chapterTitle: 'Cardiovascular Care',
        bookPage: 45,
        keyPoints: 'Assessment of cardiac function',
        category: 'assessment'
      });

      expect(result.slug).toBe('cardiac-assessment');
      expect(result.strategy).toBe('clean');
      expect(result.collisionCount).toBe(0);
    });

    it('should use contextual strategy when conflicts exist', async () => {
      // Mock existing conflicts
      mockSupabase.from().select().like().order.mockResolvedValue({
        data: [{ slug: 'cardiac-assessment' }],
        error: null
      });

      const result = await slugGenerator.generateUniqueConceptSlug({
        title: 'Cardiac Assessment',
        chapterTitle: 'Pediatric Care',
        bookPage: 78,
        keyPoints: 'Pediatric cardiac assessment techniques',
        category: 'assessment'
      });

      expect(result.slug).toBe('cardiac-assessment-pediatric');
      expect(result.strategy).toBe('contextual');
      expect(result.context).toBe('pediatric');
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabase.from().select().like().order.mockResolvedValue({
        data: null,
        error: { message: 'Connection failed' }
      });

      const result = await slugGenerator.generateUniqueConceptSlug({
        title: 'Cardiac Assessment',
        chapterTitle: 'Emergency Care',
        bookPage: 112,
        keyPoints: 'Emergency cardiac protocols',
        category: 'emergency'
      });

      // Should still generate a valid slug despite error
      expect(result.slug).toMatch(/cardiac-assessment-\d+/);
      expect(result.strategy).toBe('sequential');
      expect(result.collisionCount).toBe(-1); // Indicates error occurred
    });
  });
});
```

#### CLI Testing Patterns

- **REQUIRED:** Test command-line argument parsing
- **REQUIRED:** Validate help text and usage information
- **REQUIRED:** Mock process.exit and console.log for testing
- **REQUIRED:** Test both success and error scenarios

```typescript
// ✅ Good: CLI testing approach
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('Import Content Script CLI', () => {
  it('should display help when --help flag is provided', async () => {
    const { stdout } = await execAsync('npx tsx scripts/import-content.ts --help');
    
    expect(stdout).toContain('Import NCLEX311 content from extracted JSON files');
    expect(stdout).toContain('--data-dir <path>');
    expect(stdout).toContain('--dry-run');
    expect(stdout).toContain('Examples:');
  });

  it('should validate required arguments', async () => {
    try {
      await execAsync('npx tsx scripts/import-content.ts');
      fail('Should have thrown error for missing required args');
    } catch (error: any) {
      expect(error.stderr).toContain('required option');
      expect(error.code).toBe(1);
    }
  });

  it('should run in dry-run mode successfully', async () => {
    // Mock data directory with test files
    const testDataDir = './test-fixtures/sample-data';
    const { stdout } = await execAsync(
      `npx tsx scripts/import-content.ts --data-dir=${testDataDir} --dry-run`
    );
    
    expect(stdout).toContain('🧪 Dry Run: Yes');
    expect(stdout).toContain('📄 Found');
    expect(stdout).toContain('JSON file(s) to process');
  });
});
```

#### Mock Strategies for External Services

- **REQUIRED:** Mock Supabase client for database isolation
- **REQUIRED:** Mock Vercel Blob for file upload testing
- **REQUIRED:** Mock file system operations for script testing
- **REQUIRED:** Use jest.doMock for dynamic import mocking

```typescript
// ✅ Good: External service mocking
import { jest } from '@jest/globals';

// Mock Vercel Blob Storage
jest.doMock('@vercel/blob', () => ({
  put: jest.fn().mockResolvedValue({
    url: 'https://mock-blob-url.vercel.app/image.jpg',
    pathname: 'images/image.jpg',
    contentType: 'image/jpeg'
  }),
  del: jest.fn().mockResolvedValue(undefined),
  head: jest.fn().mockResolvedValue({
    size: 1024,
    uploadedAt: new Date(),
    contentType: 'image/jpeg'
  })
}));

// Mock file system operations
jest.doMock('fs/promises', () => ({
  readFile: jest.fn().mockResolvedValue(Buffer.from('mock file content')),
  readdir: jest.fn().mockResolvedValue(['file1.json', 'file2.json']),
  stat: jest.fn().mockResolvedValue({ isFile: () => true, size: 1024 })
}));

// Mock Sharp for image processing
jest.doMock('sharp', () => {
  return jest.fn(() => ({
    metadata: jest.fn().mockResolvedValue({
      width: 800,
      height: 600,
      format: 'jpeg'
    }),
    clone: jest.fn().mockReturnThis(),
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed image'))
  }));
});

describe('Content Import Integration', () => {
  it('should handle image upload and processing', async () => {
    const { BlobStorageManager } = await import('../src/lib/blob-storage');
    const blobManager = new BlobStorageManager();
    
    const result = await blobManager.uploadImage(
      Buffer.from('test image'),
      'test-image.jpg',
      'medical-images'
    );
    
    expect(result.blobUrl).toBe('https://mock-blob-url.vercel.app/image.jpg');
    expect(result.metadata).toEqual({
      width: 800,
      height: 600,
      format: 'jpeg',
      fileSize: expect.any(Number),
      hash: expect.any(String)
    });
  });
});
```

## Database Standards

### Schema Design

**Database:** PostgreSQL 16.x via Supabase
**Client:** Supabase JS Client v2.57.x
**Migration Strategy:** Hybrid manual/automated with validation scripts

#### Migration Management System

- **REQUIRED:** Manual deployment via Supabase Dashboard SQL Editor for production safety
- **REQUIRED:** Validation scripts for local development verification  
- **REQUIRED:** NO automatic migrations during Vercel deployments
- **REQUIRED:** Sequential migration numbering (001_, 002_, 003_)
- **REQUIRED:** Migration documentation with rollback instructions

```sql
-- ✅ Good: Migration file structure
-- File: apps/web/migrations/003_add_prioritization_question_type.sql
-- Description: Add PRIORITIZATION to question_type enum
-- Date: 2024-09-23
-- Dependencies: 001_initial_schema.sql, 002_add_images_table.sql
-- Rollback: ALTER TYPE question_type RENAME VALUE 'PRIORITIZATION' TO 'PRIORITIZATION_OLD';

BEGIN;

-- Add PRIORITIZATION to existing question_type enum
ALTER TYPE question_type ADD VALUE 'PRIORITIZATION';

-- Verify the change
SELECT unnest(enum_range(NULL::question_type)) AS question_types;

COMMIT;
```

#### Migration Validation Scripts

- **REQUIRED:** npm run migrate command for schema verification
- **REQUIRED:** Table existence and structure validation
- **REQUIRED:** ENUM type validation for database constraints
- **REQUIRED:** Migration status tracking and reporting

```javascript
// ✅ Good: Migration validation script (apps/web/scripts/validate-migration.js)
const { createClient } = require('@supabase/supabase-js');

const EXPECTED_TABLES = [
  'chapters', 'concepts', 'questions', 'options', 'images',
  'users', 'bookmarks', 'completed_concepts', 'comments', 'payments'
];

const EXPECTED_ENUMS = {
  question_type: ['MULTIPLE_CHOICE', 'SELECT_ALL_THAT_APPLY', 'FILL_IN_THE_BLANK', 'MATRIX_GRID', 'PRIORITIZATION'],
  extraction_confidence: ['HIGH', 'MEDIUM', 'LOW']
};

async function validateMigration() {
  console.log('🔍 Validating database migration status...');
  
  try {
    // Validate table existence and accessibility
    for (const table of EXPECTED_TABLES) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
        
      if (error) {
        console.error(`❌ Table '${table}' not accessible: ${error.message}`);
        process.exit(1);
      }
      
      console.log(`✅ Table '${table}': ${count || 0} records`);
    }
    
    console.log('\n🎉 All expected tables are accessible!');
    
  } catch (error) {
    console.error('❌ Migration validation failed:', error.message);
    process.exit(1);
  }
}
```

### Data Model Conventions

#### Table Design

- **REQUIRED:** UUID primary keys for all tables
- **REQUIRED:** `created_at` and `updated_at` timestamps
- **REQUIRED:** Proper foreign key constraints with CASCADE deletion
- **REQUIRED:** Indexed columns for frequent queries

```sql
-- ✅ Good: Proper table structure
CREATE TABLE concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL, -- Globally unique
  content TEXT NOT NULL, -- Markdown format
  concept_number INTEGER NOT NULL,
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_concepts_chapter_id ON concepts(chapter_id);
CREATE INDEX idx_concepts_slug ON concepts(slug);
```

#### Data Integrity

- **REQUIRED:** Enum types for constrained values
- **REQUIRED:** Check constraints for data validation
- **REQUIRED:** Unique constraints for business logic

```sql
-- ✅ Good: Proper constraints and enums
CREATE TYPE question_type AS ENUM (
  'MULTIPLE_CHOICE',
  'SELECT_ALL_THAT_APPLY',
  'FILL_IN_THE_BLANK',
  'MATRIX_GRID',
  'PRIORITIZATION'
);

CREATE TYPE extraction_confidence AS ENUM (
  'HIGH',
  'MEDIUM',
  'LOW'
);

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  type question_type NOT NULL,
  rationale TEXT,
  concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT questions_text_length CHECK (length(text) > 0),
  CONSTRAINT questions_rationale_length CHECK (length(rationale) > 0)
);
```

### Database Client Usage

#### Database Client Usage

- **REQUIRED:** Use typed Supabase client with Database interface
- **REQUIRED:** Proper error handling for all database operations
- **REQUIRED:** Connection validation and retry logic
- **REQUIRED:** Centralized database client in `src/lib/database.ts`
- **REQUIRED:** Explicit table schema definitions for type safety

```typescript
// ✅ Good: Typed database client with full schema
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Database {
  public: {
    Tables: {
      chapters: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string | null;
          order_index: number;
          created_at: string;
          updated_at: string;
          metadata: Record<string, unknown> | null;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description?: string | null;
          order_index: number;
          metadata?: Record<string, unknown> | null;
        };
        Update: {
          title?: string;
          slug?: string;
          description?: string | null;
          order_index?: number;
          metadata?: Record<string, unknown> | null;
        };
      };
      concepts: {
        Row: {
          id: string;
          chapter_id: string;
          title: string;
          slug: string;
          description: string | null;
          order_index: number;
          created_at: string;
          updated_at: string;
          metadata: Record<string, unknown> | null;
        };
        Insert: {
          id?: string;
          chapter_id: string;
          title: string;
          slug: string;
          description?: string | null;
          order_index: number;
          metadata?: Record<string, unknown> | null;
        };
        Update: {
          chapter_id?: string;
          title?: string;
          slug?: string;
          description?: string | null;
          order_index?: number;
          metadata?: Record<string, unknown> | null;
        };
      };
      questions: {
        Row: {
          id: string;
          concept_id: string;
          question_text: string;
          question_type: string;
          correct_answer: string | null;
          explanation: string | null;
          difficulty_level: string | null;
          order_index: number;
          created_at: string;
          updated_at: string;
          metadata: Record<string, unknown> | null;
        };
        Insert: {
          id?: string;
          concept_id: string;
          question_text: string;
          question_type: string;
          correct_answer?: string | null;
          explanation?: string | null;
          difficulty_level?: string | null;
          order_index: number;
          metadata?: Record<string, unknown> | null;
        };
        Update: {
          concept_id?: string;
          question_text?: string;
          question_type?: string;
          correct_answer?: string | null;
          explanation?: string | null;
          difficulty_level?: string | null;
          order_index?: number;
          metadata?: Record<string, unknown> | null;
        };
      };
      options: {
        Row: {
          id: string;
          question_id: string;
          text: string;
          is_correct: boolean;
          order_index: number;
          created_at: string;
          updated_at: string;
          metadata: Record<string, unknown> | null;
        };
        Insert: {
          id?: string;
          question_id: string;
          text: string;
          is_correct: boolean;
          order_index: number;
          metadata?: Record<string, unknown> | null;
        };
        Update: {
          question_id?: string;
          text?: string;
          is_correct?: boolean;
          order_index?: number;
          metadata?: Record<string, unknown> | null;
        };
      };
      images: {
        Row: {
          id: string;
          filename: string;
          blob_url: string;
          alt_text: string;
          width: number;
          height: number;
          file_size: number;
          extraction_confidence: string;
          medical_content: string;
          concept_id: string | null;
          question_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          filename: string;
          blob_url: string;
          alt_text: string;
          width: number;
          height: number;
          file_size: number;
          extraction_confidence: string;
          medical_content: string;
          concept_id?: string | null;
          question_id?: string | null;
        };
        Update: {
          filename?: string;
          blob_url?: string;
          alt_text?: string;
          width?: number;
          height?: number;
          file_size?: number;
          extraction_confidence?: string;
          medical_content?: string;
          concept_id?: string | null;
          question_id?: string | null;
        };
      };
    };
  };
}

// Centralized client creation with environment validation
function createSupabaseClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient<Database>(supabaseUrl, supabaseKey);
}

export const supabase = createSupabaseClient();

// ✅ Good: Proper error handling
export async function getConcept(slug: string): Promise<Concept | null> {
  try {
    const { data, error } = await supabase
      .from('concepts')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  } catch (err) {
    console.error('Failed to fetch concept:', err);
    throw err;
  }
}
```

#### Query Optimization

- **REQUIRED:** Use select() to specify needed columns
- **REQUIRED:** Proper indexing for frequently queried columns
- **REQUIRED:** Limit results with pagination for large datasets

```typescript
// ✅ Good: Optimized queries
export async function getConceptsWithQuestions(chapterId: string) {
  const { data, error } = await supabase
    .from('concepts')
    .select(`
      id,
      title,
      slug,
      questions (
        id,
        text,
        type
      )
    `)
    .eq('chapter_id', chapterId)
    .order('concept_number');

  if (error) throw error;
  return data;
}

// ✅ Good: Paginated results
export async function getConceptsPaginated(
  page: number = 1,
  limit: number = 20
) {
  const offset = (page - 1) * limit;
  
  const { data, error, count } = await supabase
    .from('concepts')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  
  return {
    data,
    pagination: {
      page,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit)
    }
  };
}
```

## Git Workflow

### Branch Strategy

**Main Branch:** `main` - Production-ready code
**Development Branch:** Feature branches from main
**Content Branch:** `extracted-content` - Separated data files

### Commit Standards

#### Commit Messages

**Format:** `type(scope): description`
**Types:** feat, fix, docs, style, refactor, test, chore

```bash
# ✅ Good: Clear commit messages
feat(questions): add PRIORITIZATION question type support
fix(database): resolve slug collision handling in import script
docs(architecture): update coding standards for TypeScript 5.x
test(api): add integration tests for health endpoint
refactor(utils): extract slug generation to separate utility
```

#### Pre-commit Hooks with Husky v9

**Configuration:** Husky v9 + lint-staged for automated code quality
**Checks:** ESLint, Prettier, TypeScript compilation, format validation
**Installation:** Husky v9 uses `.husky/` directory structure

```bash
# ✅ Good: Husky v9 installation and setup
npm install --save-dev husky lint-staged
npm pkg set scripts.prepare="husky"
npm run prepare

# Create pre-commit hook
echo 'npx lint-staged' > .husky/pre-commit
chmod +x .husky/pre-commit
```

**Root package.json Configuration:**
```json
{
  "scripts": {
    "prepare": "husky"
  },
  "lint-staged": {
    "apps/web/**/*.{js,jsx,ts,tsx}": [
      "npm run lint:fix --workspace=apps/web",
      "npm run format --workspace=apps/web",
      "npm run type-check --workspace=apps/web"
    ],
    "apps/web/**/*.{json,css,md}": [
      "npm run format --workspace=apps/web"
    ],
    "**/*.md": [
      "prettier --write"
    ]
  },
  "devDependencies": {
    "husky": "^9.x",
    "lint-staged": "^15.x"
  }
}
```

**Pre-commit Hook Configuration (.husky/pre-commit):**
```bash
#!/usr/bin/env sh

# ✅ Good: Comprehensive pre-commit validation
echo "🔍 Running pre-commit checks..."

# Run lint-staged for staged files
npx lint-staged

# Additional checks
echo "🔍 Running additional validations..."

# Ensure no sensitive files are committed
if git diff --cached --name-only | grep -E "\.(env|key|pem|p12)$"; then
  echo "❌ Error: Attempting to commit sensitive files"
  exit 1
fi

# Ensure no TODO/FIXME in production code (except tests)
if git diff --cached --name-only | grep -v test | xargs grep -l "TODO\|FIXME" 2>/dev/null; then
  echo "⚠️ Warning: TODO/FIXME found in production code"
  echo "Consider addressing these before committing"
fi

echo "✅ Pre-commit checks passed!"
```

#### Development Workflow Integration

- **REQUIRED:** All commits must pass pre-commit checks
- **REQUIRED:** TypeScript compilation must succeed
- **REQUIRED:** ESLint rules must be satisfied
- **REQUIRED:** Code must be formatted with Prettier

```typescript
// ✅ Good: apps/web/package.json script integration
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "type-check": "tsc --noEmit",
    "pre-commit-test": "npm run type-check && npm run lint && npm run format:check"
  }
}
```

#### Bypass and Override Procedures

- **EMERGENCY ONLY:** Use `--no-verify` flag to bypass hooks
- **REQUIRED:** Document bypass reasons in commit message
- **REQUIRED:** Address bypassed checks in follow-up commits

```bash
# ❌ Use sparingly: Emergency bypass
git commit --no-verify -m "EMERGENCY: Critical hotfix - bypass pre-commit

Reason: Production outage requires immediate deployment
TODO: Address linting issues in next commit
Tracking: Issue #123"

# ✅ Follow-up commit addressing bypassed checks
git commit -m "fix: Address linting and formatting issues from emergency commit

Resolves bypassed pre-commit checks from previous emergency commit
Closes #123"
```

### Pull Request Standards

#### Requirements

- **REQUIRED:** All CI/CD checks passing (lint, test, build)
- **REQUIRED:** Code coverage maintained or improved
- **REQUIRED:** Documentation updated for new features
- **REQUIRED:** Breaking changes documented in PR description

#### Review Checklist

1. **Code Quality:** TypeScript strict mode compliance
2. **Testing:** Unit/integration tests for new functionality
3. **Performance:** Database queries optimized
4. **Security:** No hardcoded secrets or credentials
5. **Documentation:** Architecture docs updated as needed

## Documentation Standards

### Code Documentation

#### Comments

- **REQUIRED:** JSDoc for all public functions and classes
- **REQUIRED:** Complex logic explanation with inline comments
- **REQUIRED:** TODO comments with issue tracking references

```typescript
/**
 * Generates a globally unique slug for a concept title.
 * Uses a three-tier approach: clean → contextual → sequential.
 * 
 * @param title - The concept title to convert to a slug
 * @param content - The concept content for contextual analysis
 * @param chapterId - The chapter ID for context resolution
 * @returns Promise resolving to a unique slug string
 * 
 * @example
 * const slug = await generateUniqueSlug('Triage', content, chapterId);
 * // Returns: 'triage' or 'triage-urgent' or 'triage-2'
 */
export async function generateUniqueSlug(
  title: string,
  content: string,
  chapterId: string
): Promise<string> {
  // Clean slug generation - basic title transformation
  const baseSlug = title.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  // Check for existing conflicts
  const existingSlugs = await getExistingSlugs();
  
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug; // No collision, use clean slug
  }

  // TODO: Implement contextual differentiation (Issue #123)
  // Analyze content for medical specialties, body systems, etc.
  
  // Fallback to sequential numbering
  let counter = 2;
  while (existingSlugs.includes(`${baseSlug}-${counter}`)) {
    counter++;
  }
  
  return `${baseSlug}-${counter}`;
}
```

#### Architecture Documentation

- **REQUIRED:** Update `docs/architecture/` for significant changes
- **REQUIRED:** Data model changes documented in `database-schema.md`
- **REQUIRED:** API changes documented in `api-specification.md`

### README Standards

#### Project README

- **Setup instructions** with exact commands
- **Environment configuration** with required variables
- **Development workflow** including testing
- **Troubleshooting section** for common issues

```markdown
# NCLEX311 Web Application

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 3. Start development server
npm run dev

# 4. Run tests
npm test
```

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run all tests
- `npm run lint` - Check code quality
- `npm run format` - Format code
```

## Performance Standards

### Frontend Performance

#### React Best Practices

- **REQUIRED:** Use React.memo for expensive components
- **REQUIRED:** Optimize re-renders with useMemo and useCallback
- **REQUIRED:** Lazy load routes and components

```tsx
// ✅ Good: Optimized component with memoization
import React, { memo, useMemo, useCallback } from 'react';

interface QuestionListProps {
  questions: Question[];
  onSelect: (questionId: string) => void;
}

export const QuestionList = memo<QuestionListProps>(({ questions, onSelect }) => {
  const sortedQuestions = useMemo(() => 
    questions.sort((a, b) => a.order - b.order),
    [questions]
  );

  const handleSelect = useCallback((questionId: string) => {
    onSelect(questionId);
  }, [onSelect]);

  return (
    <div>
      {sortedQuestions.map(question => (
        <QuestionCard 
          key={question.id}
          question={question}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
});

QuestionList.displayName = 'QuestionList';
```

#### Bundle Optimization

- **REQUIRED:** Dynamic imports for large components
- **REQUIRED:** Code splitting at route level
- **REQUIRED:** Tree shaking for unused code elimination

```typescript
// ✅ Good: Dynamic imports for code splitting
import dynamic from 'next/dynamic';

const PracticeSession = dynamic(() => import('@/components/PracticeSession'), {
  loading: () => <div>Loading practice session...</div>,
  ssr: false, // Client-side only if needed
});

const AdminDashboard = dynamic(() => import('@/components/AdminDashboard'), {
  loading: () => <div>Loading dashboard...</div>,
});
```

### Database Performance

#### Query Optimization

- **REQUIRED:** Use database indexes for frequent queries
- **REQUIRED:** Limit result sets with pagination
- **REQUIRED:** Monitor query performance with Supabase Dashboard

```typescript
// ✅ Good: Optimized database queries
export async function getChapterWithConcepts(slug: string) {
  // Single optimized query with joins
  const { data, error } = await supabase
    .from('chapters')
    .select(`
      id,
      title,
      chapter_number,
      concepts (
        id,
        title,
        slug,
        concept_number
      )
    `)
    .eq('slug', slug)
    .order('concept_number', { referencedTable: 'concepts' })
    .single();

  if (error) throw error;
  return data;
}
```

## Security Standards

### Environment Security

#### Secret Management

- **REQUIRED:** No secrets in source code or commits
- **REQUIRED:** Use environment variables for all configuration
- **REQUIRED:** Validate environment variables at startup

```typescript
// ✅ Good: Environment validation
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

export function validateEnvironment(): void {
  const missingVars = requiredEnvVars.filter(
    varName => !process.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }
}

// Call during app initialization
validateEnvironment();
```

#### Input Validation

- **REQUIRED:** Validate all user inputs on both client and server
- **REQUIRED:** Sanitize data before database operations
- **REQUIRED:** Use TypeScript for compile-time type checking

```typescript
// ✅ Good: Input validation and sanitization
import { z } from 'zod';

const CreateConceptSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  conceptNumber: z.number().int().positive(),
  chapterId: z.string().uuid(),
});

export async function createConcept(input: unknown) {
  // Validate input shape
  const validatedInput = CreateConceptSchema.parse(input);
  
  // Sanitize content (remove dangerous HTML)
  const sanitizedContent = sanitizeMarkdown(validatedInput.content);
  
  // Create slug with collision handling
  const slug = await generateUniqueSlug(
    validatedInput.title,
    sanitizedContent,
    validatedInput.chapterId
  );

  return await supabase
    .from('concepts')
    .insert({
      ...validatedInput,
      content: sanitizedContent,
      slug,
    })
    .single();
}
```

## Import and Export Standards

### Module Structure

#### Export Patterns

- **REQUIRED:** Named exports for utilities and components
- **REQUIRED:** Default exports for pages and main components
- **REQUIRED:** Type exports separate from value exports

```typescript
// ✅ Good: Clear export patterns
// utils/validation.ts
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string): boolean {
  return password.length >= 8;
}

// types.ts
export interface User {
  id: string;
  email: string;
}

export type UserStatus = 'active' | 'inactive';

// components/UserProfile.tsx
export interface UserProfileProps {
  user: User;
  onUpdate: (user: User) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdate }) => {
  // Component implementation
};

export default UserProfile; // Default export for main component
```

#### Import Organization

- **REQUIRED:** External packages first, then internal, then relative
- **REQUIRED:** Type imports at the end, separate group
- **REQUIRED:** Alphabetical ordering within groups

```typescript
// ✅ Good: Organized imports
// External packages
import React, { useState, useCallback } from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Internal packages  
import { UserData } from '@nclex311/types';

// Relative imports (alphabetical)
import { database } from '@/lib/database';
import { validateInput } from '@/utils/validation';
import { Button } from '../components/Button';
import { Header } from '../components/Header';

// Type imports (separate group)
import type { Database } from '@/lib/database';
import type { ApiResponse } from '@/types/api';
import type { User } from '@/types/user';
```

## Error Handling Standards

### Error Types and Patterns

#### API Error Handling

- **REQUIRED:** Structured error responses with consistent format
- **REQUIRED:** Proper HTTP status codes
- **REQUIRED:** Error logging for debugging

```typescript
// ✅ Good: Structured error handling
export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export async function handleApiError(
  error: unknown,
  context: string
): Promise<NextResponse> {
  console.error(`API Error in ${context}:`, error);

  if (error instanceof DatabaseError) {
    return NextResponse.json(
      {
        error: 'Database Error',
        message: error.message,
        details: error.details,
        timestamp: new Date().toISOString(),
      } satisfies ApiError,
      { status: 500 }
    );
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: 'Validation Error',
        message: 'Invalid input data',
        details: error.errors,
        timestamp: new Date().toISOString(),
      } satisfies ApiError,
      { status: 400 }
    );
  }

  // Generic error fallback
  return NextResponse.json(
    {
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
    } satisfies ApiError,
    { status: 500 }
  );
}
```

#### Client-Side Error Handling

- **REQUIRED:** Error boundaries for React components
- **REQUIRED:** Loading states and error states
- **REQUIRED:** User-friendly error messages

```tsx
// ✅ Good: Error boundary implementation
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-200 rounded-md bg-red-50">
          <h2 className="text-lg font-semibold text-red-800">
            Something went wrong
          </h2>
          <p className="text-red-600">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Script Development Standards

### TypeScript Script Architecture

#### Script Organization

- **REQUIRED:** Place all scripts in `apps/web/scripts/` directory
- **REQUIRED:** Use `.ts` extension with tsx execution via `npx tsx`
- **REQUIRED:** Include proper shebang and environment setup
- **REQUIRED:** CLI interface using Commander.js for complex scripts

```typescript
// ✅ Good: Proper script structure
#!/usr/bin/env npx tsx

/**
 * Content Import Script for NCLEX311
 * Imports pre-extracted JSON files into the database
 * 
 * Usage:
 *   npx tsx scripts/import-content.ts --data-dir=data --dry-run
 *   npx tsx scripts/import-content.ts --help
 */

// Load environment variables first
import { config } from 'dotenv';
config({ path: '.env.local' });

import { program } from 'commander';
import { createClient } from '@supabase/supabase-js';

// Script implementation...
program
  .name('import-content')
  .description('Import NCLEX content from JSON files')
  .option('--data-dir <path>', 'Data directory path')
  .option('--dry-run', 'Preview changes without executing')
  .option('--verbose', 'Enable verbose logging')
  .action(async (options) => {
    // Script logic here
  });

program.parse();
```

#### CLI Standards

- **REQUIRED:** Use Commander.js for argument parsing and help text
- **REQUIRED:** Implement `--dry-run` option for safe testing
- **REQUIRED:** Provide `--help` with comprehensive usage examples
- **REQUIRED:** Validate required arguments with clear error messages

```typescript
// ✅ Good: CLI validation and help
program
  .name('import-content')
  .description('Import NCLEX311 content from extracted JSON files')
  .requiredOption('--data-dir <path>', 'Path to JSON data directory')
  .option('--images-dir <path>', 'Path to images directory')
  .option('--dry-run', 'Preview import without making changes')
  .option('--verbose', 'Enable detailed progress logging')
  .addHelpText('after', `

Examples:
  $ npx tsx scripts/import-content.ts --data-dir=python/output --dry-run
  $ npx tsx scripts/import-content.ts --data-dir=data --images-dir=images
  $ npx tsx scripts/import-content.ts --help
`)
  .action(async (options) => {
    if (!options.dataDir) {
      console.error('❌ Error: --data-dir is required');
      process.exit(1);
    }
    // Implementation
  });
```

#### Progress Tracking and Logging

- **REQUIRED:** Implement comprehensive progress tracking
- **REQUIRED:** Use structured logging with emojis for clarity
- **REQUIRED:** Report success/failure statistics
- **REQUIRED:** Include processing time metrics

```typescript
// ✅ Good: Progress tracking interface
interface ImportProgress {
  itemsProcessed: number;
  itemsSuccess: number;
  itemsFailed: number;
  startTime: Date;
  errors: string[];
}

class ScriptRunner {
  private progress: ImportProgress = {
    itemsProcessed: 0,
    itemsSuccess: 0,
    itemsFailed: 0,
    startTime: new Date(),
    errors: [],
  };

  private logProgress(message: string, level: 'info' | 'success' | 'error' | 'warn' = 'info'): void {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warn: '⚠️',
    };
    console.log(`${icons[level]} ${message}`);
  }

  private generateReport(): void {
    const duration = Date.now() - this.progress.startTime.getTime();
    console.log('\n📊 Import Summary:');
    console.log(`   Total Processed: ${this.progress.itemsProcessed}`);
    console.log(`   Successful: ${this.progress.itemsSuccess}`);
    console.log(`   Failed: ${this.progress.itemsFailed}`);
    console.log(`   Duration: ${Math.round(duration / 1000)}s`);
    
    if (this.progress.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.progress.errors.forEach(error => console.log(`   - ${error}`));
    }
  }
}
```

#### Error Handling and Validation

- **REQUIRED:** Validate environment variables at script startup
- **REQUIRED:** Graceful error handling with proper cleanup
- **REQUIRED:** Detailed error reporting with context
- **REQUIRED:** Safe rollback mechanisms for destructive operations

```typescript
// ✅ Good: Environment validation
function validateEnvironment(): void {
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  const missing = required.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    console.error(`❌ Missing environment variables: ${missing.join(', ')}`);
    console.error('   Please check your .env.local file');
    process.exit(1);
  }
}

// ✅ Good: Error handling with context
async function processItem(item: any): Promise<void> {
  try {
    // Processing logic
  } catch (error) {
    const errorMessage = `Failed to process item ${item.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    this.progress.errors.push(errorMessage);
    this.logProgress(errorMessage, 'error');
    
    // Don't throw - continue with other items
    this.progress.itemsFailed++;
  }
}
```

### NPM Script Integration

- **REQUIRED:** Register scripts in package.json with descriptive names
- **REQUIRED:** Provide both regular and dry-run variants
- **REQUIRED:** Include validation and cleanup scripts

```json
// ✅ Good: package.json script organization
{
  "scripts": {
    "import": "npx tsx scripts/import-content.ts --data-dir=../../data/output --images-dir=../../data/images",
    "import:dry-run": "npx tsx scripts/import-content.ts --data-dir=../../data/output --dry-run",
    "validate-import": "npx tsx scripts/validate-import.ts",
    "validate-import:full": "npx tsx scripts/validate-import.ts --full-report --spot-check=10",
    "rollback-import": "npx tsx scripts/rollback-import.ts --dry-run",
    "rollback-import:confirm": "npx tsx scripts/rollback-import.ts --confirm",
    "db:clear": "npx tsx scripts/clear-database.ts",
    "migrate": "node scripts/validate-migration.js"
  }
}
```

### Content Import and Processing Patterns

#### JSON Data Processing Standards

- **REQUIRED:** Validate JSON structure before processing
- **REQUIRED:** Handle malformed or incomplete data gracefully
- **REQUIRED:** Implement comprehensive error reporting
- **REQUIRED:** Support dry-run mode for safe validation

```typescript
// ✅ Good: JSON processing with validation
export interface BookPageData {
  book_page: number;
  pdf_page: number;
  content: {
    main_concept: string;
    key_points: string;
    questions: BookQuestion[];
  };
  images: BookImage[];
  extraction_metadata: {
    timestamp: string;
    extraction_confidence: 'high' | 'medium' | 'low';
    human_validated: boolean;
    notes: string;
    category: string;
    reference: string;
  };
}

export class JSONProcessor {
  private static readonly REQUIRED_FIELDS = [
    'book_page', 'pdf_page', 'content', 'extraction_metadata'
  ];

  async processJSONFile(filePath: string): Promise<BookPageData> {
    try {
      const fileContent = await readFile(filePath, 'utf-8');
      const parsedData = JSON.parse(fileContent) as BookPageData;
      
      // Validate required structure
      this.validateJSONStructure(parsedData, filePath);
      
      return parsedData;
      
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in file ${filePath}: ${error.message}`);
      }
      throw error;
    }
  }

  private validateJSONStructure(data: any, filePath: string): void {
    // Check required top-level fields
    for (const field of JSONProcessor.REQUIRED_FIELDS) {
      if (!(field in data)) {
        throw new Error(`Missing required field '${field}' in ${filePath}`);
      }
    }

    // Validate content structure
    if (!data.content.main_concept || typeof data.content.main_concept !== 'string') {
      throw new Error(`Invalid or missing main_concept in ${filePath}`);
    }

    if (!Array.isArray(data.content.questions)) {
      throw new Error(`Questions must be an array in ${filePath}`);
    }

    // Validate each question structure
    data.content.questions.forEach((question: any, index: number) => {
      this.validateQuestionStructure(question, filePath, index);
    });

    console.log(`✅ Validated JSON structure for ${filePath}`);
  }

  private validateQuestionStructure(question: any, filePath: string, index: number): void {
    const requiredFields = ['id', 'type', 'question_text', 'options', 'correct_answer', 'rationale'];
    
    for (const field of requiredFields) {
      if (!(field in question)) {
        throw new Error(`Missing field '${field}' in question ${index} of ${filePath}`);
      }
    }

    // Validate question type
    const validTypes = ['SATA', 'multiple_choice', 'fill_in_blank', 'matrix_grid', 'prioritization'];
    if (!validTypes.includes(question.type)) {
      throw new Error(`Invalid question type '${question.type}' in question ${index} of ${filePath}`);
    }

    // Validate options array
    if (!Array.isArray(question.options) || question.options.length === 0) {
      throw new Error(`Invalid or empty options array in question ${index} of ${filePath}`);
    }
  }
}
```

#### Batch Processing with Progress Tracking

- **REQUIRED:** Process large datasets in batches
- **REQUIRED:** Implement progress reporting and statistics
- **REQUIRED:** Handle partial failures gracefully
- **REQUIRED:** Support resumable operations

```typescript
// ✅ Good: Batch processing with progress tracking
export class BatchProcessor<T, R> {
  private progress = {
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    errors: [] as string[]
  };

  async processBatch(
    items: T[],
    processor: (item: T, index: number) => Promise<R>,
    options: {
      batchSize?: number;
      concurrency?: number;
      onProgress?: (progress: typeof this.progress) => void;
      continueOnError?: boolean;
    } = {}
  ): Promise<{ results: R[]; summary: typeof this.progress }> {
    const {
      batchSize = 10,
      concurrency = 3,
      onProgress,
      continueOnError = true
    } = options;

    this.progress.total = items.length;
    const results: R[] = [];
    
    console.log(`🚀 Starting batch processing: ${items.length} items`);
    console.log(`   Batch size: ${batchSize}, Concurrency: ${concurrency}`);

    // Process in chunks to manage memory and provide progress updates
    for (let i = 0; i < items.length; i += batchSize) {
      const chunk = items.slice(i, i + batchSize);
      
      // Process chunk with limited concurrency
      const chunkPromises = chunk.map(async (item, chunkIndex) => {
        const globalIndex = i + chunkIndex;
        
        try {
          const result = await processor(item, globalIndex);
          this.progress.processed++;
          this.progress.successful++;
          
          if (onProgress) {
            onProgress(this.progress);
          }
          
          return result;
          
        } catch (error) {
          this.progress.processed++;
          this.progress.failed++;
          
          const errorMessage = `Item ${globalIndex}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          this.progress.errors.push(errorMessage);
          
          console.error(`❌ ${errorMessage}`);
          
          if (onProgress) {
            onProgress(this.progress);
          }
          
          if (!continueOnError) {
            throw error;
          }
          
          return null;
        }
      });

      // Wait for chunk to complete with concurrency limit
      const chunkResults = await this.limitConcurrency(chunkPromises, concurrency);
      results.push(...chunkResults.filter((r): r is R => r !== null));
      
      // Progress update
      const progressPercent = Math.round((this.progress.processed / this.progress.total) * 100);
      console.log(`📋 Progress: ${this.progress.processed}/${this.progress.total} (${progressPercent}%)`);
    }

    console.log(`\n🏁 Batch processing completed:`);
    console.log(`   Total: ${this.progress.total}`);
    console.log(`   Successful: ${this.progress.successful}`);
    console.log(`   Failed: ${this.progress.failed}`);
    
    return { results, summary: { ...this.progress } };
  }

  private async limitConcurrency<T>(promises: Promise<T>[], limit: number): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < promises.length; i += limit) {
      const batch = promises.slice(i, i + limit);
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
    }
    
    return results;
  }
}
```

#### Data Transformation and Mapping

- **REQUIRED:** Implement clear data transformation pipelines
- **REQUIRED:** Handle different question types appropriately
- **REQUIRED:** Maintain data integrity during transformation
- **REQUIRED:** Support rollback for failed transformations

```typescript
// ✅ Good: Data transformation pipeline
export class DataTransformer {
  private static readonly QUESTION_TYPE_MAPPING = {
    'SATA': 'SELECT_ALL_THAT_APPLY',
    'multiple_choice': 'MULTIPLE_CHOICE',
    'fill_in_blank': 'FILL_IN_THE_BLANK',
    'matrix_grid': 'MATRIX_GRID',
    'prioritization': 'PRIORITIZATION'
  } as const;

  async transformBookPageToDatabase(
    bookPage: BookPageData,
    chapterId: string
  ): Promise<{
    concept: ConceptInsert;
    questions: QuestionInsert[];
    options: OptionInsert[];
    images: ImageInsert[];
  }> {
    try {
      // Transform concept
      const concept = await this.transformConcept(bookPage, chapterId);
      
      // Transform questions and options
      const { questions, options } = await this.transformQuestions(
        bookPage.content.questions,
        concept.id
      );
      
      // Transform images
      const images = await this.transformImages(
        bookPage.images,
        concept.id
      );
      
      return { concept, questions, options, images };
      
    } catch (error) {
      throw new Error(`Failed to transform book page ${bookPage.book_page}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async transformConcept(
    bookPage: BookPageData,
    chapterId: string
  ): Promise<ConceptInsert> {
    const slugGenerator = new SmartSlugGenerator(supabase);
    
    const context = {
      title: bookPage.content.main_concept,
      chapterTitle: '', // Will be filled by caller
      bookPage: bookPage.book_page,
      keyPoints: bookPage.content.key_points,
      category: bookPage.extraction_metadata.category
    };
    
    const slugResult = await slugGenerator.generateUniqueConceptSlug(context);
    
    return {
      id: crypto.randomUUID(),
      chapter_id: chapterId,
      title: bookPage.content.main_concept,
      slug: slugResult.slug,
      description: bookPage.content.key_points,
      order_index: bookPage.book_page,
      metadata: {
        book_page: bookPage.book_page,
        pdf_page: bookPage.pdf_page,
        extraction_confidence: bookPage.extraction_metadata.extraction_confidence,
        slug_generation: {
          strategy: slugResult.strategy,
          processing_time: slugResult.processingTime,
          context: slugResult.context
        }
      }
    };
  }

  private async transformQuestions(
    questions: BookQuestion[],
    conceptId: string
  ): Promise<{ questions: QuestionInsert[]; options: OptionInsert[] }> {
    const transformedQuestions: QuestionInsert[] = [];
    const transformedOptions: OptionInsert[] = [];
    
    for (const [index, question] of questions.entries()) {
      const questionId = crypto.randomUUID();
      
      // Map question type
      const dbQuestionType = DataTransformer.QUESTION_TYPE_MAPPING[question.type];
      if (!dbQuestionType) {
        throw new Error(`Unsupported question type: ${question.type}`);
      }
      
      transformedQuestions.push({
        id: questionId,
        concept_id: conceptId,
        question_text: question.question_text,
        question_type: dbQuestionType,
        correct_answer: this.formatCorrectAnswer(question.correct_answer, question.type),
        explanation: question.rationale,
        difficulty_level: 'MEDIUM', // Default
        order_index: index,
        metadata: {
          original_type: question.type,
          original_id: question.id,
          matrix_categories: question.matrix_categories
        }
      });
      
      // Transform options
      const questionOptions = this.transformOptions(question, questionId);
      transformedOptions.push(...questionOptions);
    }
    
    return { questions: transformedQuestions, options: transformedOptions };
  }

  private transformOptions(question: BookQuestion, questionId: string): OptionInsert[] {
    // Handle different question types
    if (question.type === 'prioritization') {
      // For prioritization questions, create a single option with the sequence
      return [{
        id: crypto.randomUUID(),
        question_id: questionId,
        text: question.correct_answer as string,
        is_correct: true,
        order_index: 0,
        metadata: {
          type: 'sequence',
          sequence: question.correct_answer
        }
      }];
    }
    
    // Regular options handling
    return question.options.map((optionText, index) => {
      const isCorrect = this.isOptionCorrect(optionText, question.correct_answer, question.type);
      
      return {
        id: crypto.randomUUID(),
        question_id: questionId,
        text: optionText,
        is_correct: isCorrect,
        order_index: index,
        metadata: {
          original_index: index
        }
      };
    });
  }

  private formatCorrectAnswer(correctAnswer: any, questionType: string): string {
    if (questionType === 'prioritization') {
      return Array.isArray(correctAnswer) ? correctAnswer.join(', ') : correctAnswer;
    }
    
    if (typeof correctAnswer === 'object') {
      return JSON.stringify(correctAnswer);
    }
    
    return String(correctAnswer);
  }

  private isOptionCorrect(optionText: string, correctAnswer: any, questionType: string): boolean {
    if (questionType === 'SATA') {
      return Array.isArray(correctAnswer) && correctAnswer.includes(optionText);
    }
    
    return optionText === correctAnswer;
  }
}
```

### Smart Algorithm Implementation Patterns

#### Multi-Tier Strategy Pattern

- **REQUIRED:** Implement fallback strategies for critical operations
- **REQUIRED:** Context-aware processing with meaningful differentiation
- **REQUIRED:** Performance monitoring and metrics collection
- **REQUIRED:** Comprehensive logging for debugging and optimization

```typescript
// ✅ Good: Multi-tier strategy implementation
export interface StrategyResult {
  result: string;
  strategy: 'primary' | 'contextual' | 'fallback';
  processingTime: number;
  context?: string;
  collisionCount?: number;
}

export class SmartProcessor {
  private patterns: RegExp[] = [
    /\b(specialty-term-1|specialty-term-2)\b/i,
    /\b(context-category-a|context-category-b)\b/i,
  ];

  async processWithFallback(input: ProcessingContext): Promise<StrategyResult> {
    const startTime = Date.now();
    
    try {
      // Tier 1: Primary strategy (most efficient)
      const primaryResult = await this.tryPrimaryStrategy(input);
      if (primaryResult.success) {
        return {
          result: primaryResult.value,
          strategy: 'primary',
          processingTime: Date.now() - startTime,
        };
      }

      // Tier 2: Contextual strategy (intelligent analysis)
      const contextualResult = await this.tryContextualStrategy(input);
      if (contextualResult.success) {
        return {
          result: contextualResult.value,
          strategy: 'contextual',
          processingTime: Date.now() - startTime,
          context: contextualResult.context,
        };
      }

      // Tier 3: Fallback strategy (guaranteed success)
      const fallbackResult = await this.generateFallbackResult(input);
      return {
        result: fallbackResult,
        strategy: 'fallback',
        processingTime: Date.now() - startTime,
      };
      
    } catch (error) {
      console.error('Smart processor error:', error);
      // Emergency fallback - never fail
      return {
        result: this.generateEmergencyFallback(input),
        strategy: 'fallback',
        processingTime: Date.now() - startTime,
      };
    }
  }

  private async tryContextualStrategy(
    input: ProcessingContext
  ): Promise<{ success: boolean; value?: string; context?: string }> {
    for (const pattern of this.patterns) {
      const match = input.content.match(pattern);
      if (match) {
        const context = match[1].toLowerCase();
        const processedValue = this.applyContextualTransformation(input.base, context);
        
        if (await this.validateResult(processedValue)) {
          return { success: true, value: processedValue, context };
        }
      }
    }
    return { success: false };
  }
}
```

#### Context Analysis and Pattern Matching

- **REQUIRED:** Define comprehensive pattern libraries for domain-specific processing
- **REQUIRED:** Implement robust pattern matching with priority ordering
- **REQUIRED:** Extract meaningful context for differentiation

```typescript
// ✅ Good: Medical domain context analysis
export class MedicalContextAnalyzer {
  private readonly contextPatterns = {
    specialties: /\b(pediatric|adult|geriatric|neonatal)\b/i,
    bodySystems: /\b(cardiac|pulmonary|renal|neurologic)\b/i,
    severity: /\b(acute|chronic|severe|mild|critical)\b/i,
    treatment: /\b(medication|surgery|therapy|assessment)\b/i,
    procedures: /\b(catheter|intubation|ventilation|dialysis)\b/i,
    settings: /\b(inpatient|outpatient|icu|emergency)\b/i,
    conditions: /\b(infection|inflammation|disease|disorder)\b/i,
    states: /\b(stable|unstable|deteriorating|improving)\b/i,
  };

  extractMedicalContext(text: string): MedicalContext[] {
    const contexts: MedicalContext[] = [];
    
    for (const [category, pattern] of Object.entries(this.contextPatterns)) {
      const matches = text.matchAll(new RegExp(pattern.source, 'gi'));
      for (const match of matches) {
        contexts.push({
          category: category as MedicalContextCategory,
          term: match[1].toLowerCase(),
          position: match.index || 0,
          confidence: this.calculateContextConfidence(match[1], category),
        });
      }
    }
    
    // Sort by confidence and position
    return contexts.sort((a, b) => b.confidence - a.confidence || a.position - b.position);
  }

  private calculateContextConfidence(term: string, category: string): number {
    // Priority weighting for medical contexts
    const categoryWeights = {
      severity: 0.9,
      specialties: 0.8,
      bodySystems: 0.7,
      treatment: 0.6,
      procedures: 0.5,
      settings: 0.4,
      conditions: 0.3,
      states: 0.2,
    };
    
    return categoryWeights[category as keyof typeof categoryWeights] || 0.1;
  }
}
```

#### Performance Monitoring and Metrics

- **REQUIRED:** Track processing time for optimization
- **REQUIRED:** Monitor success rates and fallback usage
- **REQUIRED:** Log performance metrics for analysis
- **REQUIRED:** Implement performance thresholds and alerts

```typescript
// ✅ Good: Performance monitoring
export class PerformanceMonitor {
  private metrics: ProcessingMetrics = {
    totalProcessed: 0,
    strategyCounts: { primary: 0, contextual: 0, fallback: 0 },
    averageProcessingTime: 0,
    successRate: 0,
  };

  recordProcessingResult(result: StrategyResult): void {
    this.metrics.totalProcessed++;
    this.metrics.strategyCounts[result.strategy]++;
    
    // Update average processing time (rolling average)
    const alpha = 0.1; // Smoothing factor
    this.metrics.averageProcessingTime = 
      alpha * result.processingTime + 
      (1 - alpha) * this.metrics.averageProcessingTime;
    
    // Log performance warnings
    if (result.processingTime > 1000) {
      console.warn(`⚠️ Slow processing detected: ${result.processingTime}ms for ${result.strategy} strategy`);
    }
    
    // Update success rate
    const successfulStrategies = this.metrics.strategyCounts.primary + this.metrics.strategyCounts.contextual;
    this.metrics.successRate = successfulStrategies / this.metrics.totalProcessed;
  }

  generatePerformanceReport(): string {
    const report = [
      '📈 Performance Report:',
      `   Total Processed: ${this.metrics.totalProcessed}`,
      `   Primary Strategy: ${this.metrics.strategyCounts.primary} (${this.getPercentage('primary')}%)`,
      `   Contextual Strategy: ${this.metrics.strategyCounts.contextual} (${this.getPercentage('contextual')}%)`,
      `   Fallback Strategy: ${this.metrics.strategyCounts.fallback} (${this.getPercentage('fallback')}%)`,
      `   Average Processing Time: ${Math.round(this.metrics.averageProcessingTime)}ms`,
      `   Success Rate: ${Math.round(this.metrics.successRate * 100)}%`,
    ];
    
    return report.join('\n');
  }

  private getPercentage(strategy: keyof ProcessingMetrics['strategyCounts']): number {
    return Math.round((this.metrics.strategyCounts[strategy] / this.metrics.totalProcessed) * 100);
  }
}
```

#### Database-Backed Conflict Detection

- **REQUIRED:** Implement efficient database queries for conflict detection
- **REQUIRED:** Use pattern matching for bulk conflict checking
- **REQUIRED:** Cache results to minimize database round trips

```typescript
// ✅ Good: Database conflict detection
export class ConflictDetector {
  private cache = new Map<string, string[]>();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private lastCacheUpdate = 0;

  async checkConflicts(baseValue: string): Promise<string[]> {
    const cacheKey = `conflicts:${baseValue}`;
    
    // Check cache first
    if (this.isCacheValid() && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    // Query database for conflicts
    const conflicts = await this.queryConflicts(baseValue);
    
    // Update cache
    this.cache.set(cacheKey, conflicts);
    this.lastCacheUpdate = Date.now();
    
    return conflicts;
  }

  private async queryConflicts(baseValue: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('target_table')
      .select('unique_field')
      .like('unique_field', `${baseValue}%`)
      .order('unique_field');

    if (error) {
      console.error('Conflict detection query error:', error);
      return [];
    }

    return data ? data.map(row => row.unique_field) : [];
  }

  private isCacheValid(): boolean {
    return Date.now() - this.lastCacheUpdate < this.cacheExpiry;
  }

  clearCache(): void {
    this.cache.clear();
    this.lastCacheUpdate = 0;
  }
}
```

### File Storage Integration Standards

#### Vercel Blob Storage Configuration

- **REQUIRED:** Use official @vercel/blob client for file operations
- **REQUIRED:** Implement proper error handling for upload failures
- **REQUIRED:** Generate unique filenames to prevent conflicts
- **REQUIRED:** Store blob URLs in database with metadata

```typescript
// ✅ Good: Vercel Blob storage integration
import { put, del, head } from '@vercel/blob';
import sharp from 'sharp';
import { createHash } from 'crypto';

export interface ImageUploadResult {
  blobUrl: string;
  filename: string;
  metadata: ImageMetadata;
}

export interface ImageMetadata {
  width: number;
  height: number;
  fileSize: number;
  format: string;
  hash: string;
}

export class BlobStorageManager {
  private static readonly ALLOWED_FORMATS = ['jpeg', 'jpg', 'png', 'webp', 'gif'];
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  async uploadImage(
    imageBuffer: Buffer,
    originalFilename: string,
    folder: string = 'images'
  ): Promise<ImageUploadResult> {
    try {
      // Validate file size
      if (imageBuffer.length > BlobStorageManager.MAX_FILE_SIZE) {
        throw new Error(`File size exceeds maximum allowed size of ${BlobStorageManager.MAX_FILE_SIZE} bytes`);
      }

      // Extract metadata using Sharp
      const metadata = await this.extractImageMetadata(imageBuffer);
      
      // Validate format
      if (!BlobStorageManager.ALLOWED_FORMATS.includes(metadata.format.toLowerCase())) {
        throw new Error(`Unsupported image format: ${metadata.format}`);
      }

      // Generate unique filename
      const uniqueFilename = this.generateUniqueFilename(originalFilename, metadata.hash);
      const blobPath = `${folder}/${uniqueFilename}`;

      // Upload to Vercel Blob
      const blob = await put(blobPath, imageBuffer, {
        access: 'public',
        contentType: `image/${metadata.format}`,
      });

      console.log(`✅ Image uploaded: ${blob.url}`);

      return {
        blobUrl: blob.url,
        filename: uniqueFilename,
        metadata,
      };
      
    } catch (error) {
      console.error('❌ Image upload failed:', error);
      throw new Error(`Image upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractImageMetadata(buffer: Buffer): Promise<ImageMetadata> {
    const image = sharp(buffer);
    const { width, height, format } = await image.metadata();
    
    if (!width || !height || !format) {
      throw new Error('Unable to extract image metadata');
    }

    // Generate content hash for deduplication
    const hash = createHash('sha256').update(buffer).digest('hex').substring(0, 16);

    return {
      width,
      height,
      fileSize: buffer.length,
      format,
      hash,
    };
  }

  private generateUniqueFilename(originalFilename: string, hash: string): string {
    const timestamp = Date.now();
    const ext = originalFilename.split('.').pop()?.toLowerCase() || 'jpg';
    return `${timestamp}-${hash}.${ext}`;
  }

  async deleteImage(blobUrl: string): Promise<void> {
    try {
      await del(blobUrl);
      console.log(`✅ Image deleted: ${blobUrl}`);
    } catch (error) {
      console.error(`❌ Failed to delete image: ${blobUrl}`, error);
      throw error;
    }
  }

  async validateImageExists(blobUrl: string): Promise<boolean> {
    try {
      await head(blobUrl);
      return true;
    } catch {
      return false;
    }
  }
}
```

#### Image Processing with Sharp

- **REQUIRED:** Use Sharp for image metadata extraction
- **REQUIRED:** Validate image formats and dimensions
- **REQUIRED:** Optimize images for web delivery when appropriate
- **REQUIRED:** Generate responsive image variants for different screen sizes

```typescript
// ✅ Good: Image processing pipeline
export class ImageProcessor {
  private static readonly THUMBNAIL_SIZE = 300;
  private static readonly MEDIUM_SIZE = 800;
  private static readonly QUALITY = 85;

  async processImage(buffer: Buffer): Promise<ProcessedImage> {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image: missing dimensions');
    }

    // Generate optimized variants
    const variants = await this.generateImageVariants(image, metadata);
    
    return {
      original: {
        buffer,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format || 'jpeg',
      },
      variants,
    };
  }

  private async generateImageVariants(
    image: sharp.Sharp,
    metadata: sharp.Metadata
  ): Promise<ImageVariant[]> {
    const variants: ImageVariant[] = [];
    const { width = 0, height = 0 } = metadata;

    // Generate thumbnail if image is large enough
    if (width > ImageProcessor.THUMBNAIL_SIZE || height > ImageProcessor.THUMBNAIL_SIZE) {
      const thumbnail = await image
        .clone()
        .resize(ImageProcessor.THUMBNAIL_SIZE, ImageProcessor.THUMBNAIL_SIZE, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: ImageProcessor.QUALITY })
        .toBuffer();

      variants.push({
        name: 'thumbnail',
        buffer: thumbnail,
        width: ImageProcessor.THUMBNAIL_SIZE,
        height: ImageProcessor.THUMBNAIL_SIZE,
      });
    }

    // Generate medium size if image is large enough
    if (width > ImageProcessor.MEDIUM_SIZE || height > ImageProcessor.MEDIUM_SIZE) {
      const medium = await image
        .clone()
        .resize(ImageProcessor.MEDIUM_SIZE, ImageProcessor.MEDIUM_SIZE, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: ImageProcessor.QUALITY })
        .toBuffer();

      variants.push({
        name: 'medium',
        buffer: medium,
        width: Math.min(width, ImageProcessor.MEDIUM_SIZE),
        height: Math.min(height, ImageProcessor.MEDIUM_SIZE),
      });
    }

    return variants;
  }
}
```

#### Database Integration for File Storage

- **REQUIRED:** Store file metadata in database with blob URLs
- **REQUIRED:** Implement proper foreign key relationships
- **REQUIRED:** Track file usage and cleanup orphaned files
- **REQUIRED:** Validate blob URL accessibility before database insertion

```typescript
// ✅ Good: Database integration for images
export class ImageDatabaseManager {
  async saveImageRecord(
    uploadResult: ImageUploadResult,
    associations: {
      conceptId?: string;
      questionId?: string;
    },
    medicalContent: string,
    extractionConfidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM'
  ): Promise<string> {
    // Validate blob URL accessibility
    const isAccessible = await this.validateBlobAccess(uploadResult.blobUrl);
    if (!isAccessible) {
      throw new Error(`Blob URL is not accessible: ${uploadResult.blobUrl}`);
    }

    const { data, error } = await supabase
      .from('images')
      .insert({
        filename: uploadResult.filename,
        blob_url: uploadResult.blobUrl,
        alt_text: `Medical image: ${medicalContent}`,
        width: uploadResult.metadata.width,
        height: uploadResult.metadata.height,
        file_size: uploadResult.metadata.fileSize,
        extraction_confidence: extractionConfidence,
        medical_content: medicalContent,
        concept_id: associations.conceptId || null,
        question_id: associations.questionId || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to save image record:', error);
      throw new Error(`Database insertion failed: ${error.message}`);
    }

    console.log(`✅ Image record saved with ID: ${data.id}`);
    return data.id;
  }

  private async validateBlobAccess(blobUrl: string): Promise<boolean> {
    try {
      const response = await fetch(blobUrl, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error(`Blob URL validation failed: ${blobUrl}`, error);
      return false;
    }
  }

  async cleanupOrphanedImages(): Promise<number> {
    // Find images not associated with any concept or question
    const { data: orphanedImages, error } = await supabase
      .from('images')
      .select('id, blob_url')
      .is('concept_id', null)
      .is('question_id', null);

    if (error) {
      throw new Error(`Failed to find orphaned images: ${error.message}`);
    }

    let deletedCount = 0;
    const blobManager = new BlobStorageManager();

    for (const image of orphanedImages || []) {
      try {
        // Delete from blob storage
        await blobManager.deleteImage(image.blob_url);
        
        // Delete from database
        await supabase.from('images').delete().eq('id', image.id);
        
        deletedCount++;
      } catch (error) {
        console.error(`Failed to cleanup image ${image.id}:`, error);
      }
    }

    console.log(`✅ Cleaned up ${deletedCount} orphaned images`);
    return deletedCount;
  }
}
```

### Authentication Standards

#### Auth.js (NextAuth) Configuration

- **REQUIRED:** Use Auth.js v5 for authentication and session management
- **REQUIRED:** Implement proper server-side and client-side session handling
- **REQUIRED:** Centralize authentication utilities in `src/lib/auth-utils.ts`
- **REQUIRED:** Use TypeScript interfaces for user and session types

```typescript
// ✅ Good: Auth configuration (auth.ts)
import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcrypt';
import { supabase } from '@/lib/database';

export const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Fetch user from database
          const { data: user, error } = await supabase
            .from('users')
            .select('id, email, name, password_hash')
            .eq('email', credentials.email)
            .single();

          if (error || !user) {
            return null;
          }

          // Verify password
          const isValidPassword = await compare(
            credentials.password as string,
            user.password_hash
          );

          if (!isValidPassword) {
            return null;
          }

          // Return user object (excluding password)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
    signUp: '/auth/register',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
```

#### NextAuth v5 Route Handler Pattern (Required)

- **REQUIRED:** Use the v5 handler export pattern to avoid runtime issues
- **REQUIRED:** JWT session strategy with session callback attaching `user.id`
- **REQUIRED:** Enable debug in development only

```ts
// ✅ Good: NextAuth v5 route handler (apps/web/src/app/api/auth/[...nextauth]/route.ts)
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const { handlers: { GET, POST }, auth } = NextAuth({
  providers: [
    Credentials({
      // ...credentials config
      async authorize(credentials) {
        // Validate input, fetch user, verify password
        // Return user object or null
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async session({ session, token }) {
      if (token && session.user && token.sub) {
        // @ts-expect-error augmenting NextAuth type at runtime
        session.user.id = token.sub;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
});
```

#### Registration API Standards

- **REQUIRED:** Implement registration at `POST /api/auth/register`
- **REQUIRED:** Safely parse JSON request body; return 400 on invalid JSON
- **REQUIRED:** Validate payload with Zod (email, password strength)
- **REQUIRED:** Enforce email uniqueness (409 Conflict on duplicate)
- OPTIONAL: Alternatively rely on the database unique constraint and map Postgres code 23505 to HTTP 409
- **REQUIRED:** Hash passwords with bcrypt (12+ rounds) before storing
- **REQUIRED:** Return generic error messages to avoid account enumeration

```ts
// ✅ Good: Registration API (apps/web/src/app/api/auth/register/route.ts)
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hash } from 'bcrypt';
import { supabase } from '@/lib/database';

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parse = RegisterSchema.safeParse(json);
  if (!parse.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const { email, password } = parse.data;

  // Check uniqueness
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
  }

  // Hash password
  const password_hash = await hash(password, 12);

  // Insert user
  const { error } = await supabase
    .from('users')
    .insert({ email, password_hash })
    .single();

  if (error) {
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }

  return NextResponse.json({ status: 'ok' }, { status: 201 });
}
```

#### Authentication UI & Accessibility Standards

- **REQUIRED:** Use ARIA roles (tab, tablist) for tabbed auth UIs; prefer accessible labels
- **REQUIRED:** Add `required` and `minLength` attributes to form inputs for better UX
- **REQUIRED:** Display generic auth errors (e.g., "Invalid credentials") to avoid leakage
- **REQUIRED:** Provide stable selectors for tests via labels and ARIA roles

```tsx
// ✅ Good: Accessible auth tabs
<div role="tablist" aria-label="Auth Tabs">
  <button role="tab" aria-selected={active === 'login'}>Login</button>
  <button role="tab" aria-selected={active === 'register'}>Register</button>
</div>

// ✅ Good: Form inputs
<input
  type="email"
  name="email"
  aria-label="email"
  required
/>
<input
  type="password"
  name="password"
  aria-label="password"
  required
  minLength={8}
/>
```

#### Authentication Testing Standards

- **REQUIRED:** Unit test API routes (registration, login) with Supertest
- **REQUIRED:** Component tests for forms (validation and error states)
- **REQUIRED:** Playwright E2E for login, logout, registration, session persistence
- **REQUIRED:** Harden selectors (labels/roles) to reduce flakiness; test across Chromium/Firefox/WebKit

```ts
// ✅ Good: E2E expectations (Playwright)
await expect(page.getByRole('tab', { name: 'Login' })).toBeVisible();
await page.getByLabel('email').fill('user@example.com');
await page.getByLabel('password').fill('P@ssw0rd!');
await page.getByRole('button', { name: /login/i }).click();
await expect(page.getByText(/welcome/i)).toBeVisible();
```

#### Library Usage Notes

- **REQUIRED:** Do not use namespace imports for bcrypt; use default or named imports consistently
- **RECOMMENDED (current repo):** Prefer named imports `import { hash, compare } from 'bcrypt'`
- **REQUIRED:** Keep NextAuth v5 in sync with handler export pattern to prevent 500s
- **REQUIRED:** Enable `debug` only in development

#### Supabase Client Typing in Authentication Flows

- RECOMMENDED: Use the typed Database client for normal application code
- ALLOWED: Within authentication flows (e.g., NextAuth authorize, registration), a temporary cast to untyped SupabaseClient is acceptable when flexible selects are needed or when typed interfaces lag schema updates
- REQUIREMENT: Limit untyped usage to the smallest scope necessary and add a comment explaining why typed access is not used

```ts
// ✅ Acceptable: narrow untyped cast in auth workflow only
const client = (supabase as unknown) as import('@supabase/supabase-js').SupabaseClient;
const { data, error } = await client
  .from('users')
  .select('id, email, password_hash')
  .eq('email', email)
  .maybeSingle();
```

#### Server-Side Authentication Utilities

- **REQUIRED:** Implement reusable authentication utilities
- **REQUIRED:** Handle authentication errors gracefully
- **REQUIRED:** Provide consistent redirect behavior
- **REQUIRED:** Type-safe session handling

```typescript
// ✅ Good: Authentication utilities (src/lib/auth-utils.ts)
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authConfig } from '@/auth';
import type { Session, User } from 'next-auth';

export interface AuthenticatedUser extends User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthenticatedSession extends Session {
  user: AuthenticatedUser;
}

/**
 * Get the current user session on the server side
 * Returns the session or null if not authenticated
 */
export async function getCurrentSession(): Promise<Session | null> {
  try {
    return await getServerSession(authConfig);
  } catch (error) {
    console.error('Error getting server session:', error);
    return null;
  }
}

/**
 * Require authentication on the server side
 * Redirects to login if not authenticated
 * Returns authenticated session
 */
export async function requireAuth(): Promise<AuthenticatedSession> {
  const session = await getCurrentSession();
  
  if (!session?.user?.id) {
    redirect('/auth/login');
  }
  
  return session as AuthenticatedSession;
}

/**
 * Check if user is authenticated (server-side)
 * Returns boolean without redirecting
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getCurrentSession();
  return !!(session?.user?.id);
}

/**
 * Get authenticated user ID
 * Returns null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getCurrentSession();
  return session?.user?.id || null;
}

/**
 * Require specific user ID match
 * Redirects if not authenticated or user ID doesn't match
 */
export async function requireUserMatch(userId: string): Promise<AuthenticatedSession> {
  const session = await requireAuth();
  
  if (session.user.id !== userId) {
    redirect('/auth/unauthorized');
  }
  
  return session;
}
```

#### Client-Side Session Management

- **REQUIRED:** Use SessionProvider for client-side session context
- **REQUIRED:** Handle loading and error states properly
- **REQUIRED:** Implement proper session refresh logic
- **REQUIRED:** Type-safe client session hooks

```tsx
// ✅ Good: Session provider wrapper (src/components/SessionProvider.tsx)
'use client';

import React from 'react';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';

interface SessionProviderProps {
  children: React.ReactNode;
  session?: Session | null;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ 
  children, 
  session 
}) => {
  return (
    <NextAuthSessionProvider 
      session={session}
      refetchInterval={5 * 60} // Refetch every 5 minutes
      refetchOnWindowFocus={true}
    >
      {children}
    </NextAuthSessionProvider>
  );
};

// ✅ Good: Custom hooks for client-side auth
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useAuthenticatedUser() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  return {
    user: session?.user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  };
}

export function useOptionalAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user || null,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  };
}
```

#### Password Security Standards

- **REQUIRED:** Use bcrypt for password hashing
- **REQUIRED:** Implement proper password validation
- **REQUIRED:** Salt rounds of at least 12
- **REQUIRED:** Secure password reset functionality

```typescript
// ✅ Good: Password utilities (src/lib/password-utils.ts)
import { hash, compare } from 'bcrypt';
import { z } from 'zod';

const SALT_ROUNDS = 12;

// Password validation schema
export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): PasswordValidationResult {
  try {
    PasswordSchema.parse(password);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => err.message),
      };
    }
    return { isValid: false, errors: ['Invalid password format'] };
  }
}

/**
 * Hash password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const validation = validatePassword(password);
  if (!validation.isValid) {
    throw new Error(`Password validation failed: ${validation.errors.join(', ')}`);
  }

  try {
    return await hash(password, SALT_ROUNDS);
  } catch (error) {
    throw new Error('Failed to hash password');
  }
}

/**
 * Compare password with hash
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    return await compare(password, hashedPassword);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}
```

#### Route Protection Patterns

- **REQUIRED:** Implement middleware for route protection
- **REQUIRED:** Use consistent authentication checks
- **REQUIRED:** Handle unauthorized access gracefully
- **REQUIRED:** Protect API routes and pages uniformly

```typescript
// ✅ Good: Route protection middleware (middleware.ts)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/auth';

// Protected route patterns
const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/practice',
  '/api/user',
];

const AUTH_ROUTES = [
  '/auth/login',
  '/auth/register',
];

export default auth((req: NextRequest) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;
  
  // Check if route requires authentication
  const requiresAuth = PROTECTED_ROUTES.some(route => 
    pathname.startsWith(route)
  );
  
  // Check if route is auth-related
  const isAuthRoute = AUTH_ROUTES.some(route => 
    pathname.startsWith(route)
  );
  
  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  
  // Redirect unauthenticated users to login
  if (!isAuthenticated && requiresAuth) {
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};

// ✅ Good: API route protection
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const session = await requireAuth();
    
    // API logic here
    return NextResponse.json({ 
      user: session.user,
      message: 'Authenticated API access' 
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
}
```

## Enforcement and Tooling

### Automated Enforcement

#### Pre-commit Hooks

**Tool:** Husky + lint-staged
**Configuration:** `.husky/pre-commit`

```bash
# Husky pre-commit hook
npx lint-staged
```

**Lint-staged Configuration:**
```json
{
  "lint-staged": {
    "apps/web/**/*.{js,jsx,ts,tsx}": [
      "npm run lint:fix --workspace=apps/web",
      "npm run format --workspace=apps/web"
    ],
    "apps/web/**/*.{json,css,md}": [
      "npm run format --workspace=apps/web"
    ]
  }
}
```

#### CI/CD Pipeline

**Tool:** GitHub Actions
**Configuration:** `.github/workflows/ci.yml`

**Checks Performed:**
1. TypeScript compilation (`npm run type-check`)
2. ESLint linting (`npm run lint`)
3. Prettier formatting check (`npm run format:check`)
4. Unit tests (`npm run test`)
5. E2E tests (`npm run test:e2e`)
6. Build verification (`npm run build`)

#### Development Workflow Standards

##### NPM Scripts Organization

- **REQUIRED:** Organize scripts by category (dev, build, test, lint, database)
- **REQUIRED:** Use workspace-aware commands for monorepo structure
- **REQUIRED:** Provide both individual and combined scripts for efficiency
- **REQUIRED:** Include validation and cleanup scripts

```json
// ✅ Good: Comprehensive script organization (apps/web/package.json)
{
  "scripts": {
    // Development server
    "dev": "next dev",
    "dev:debug": "NODE_OPTIONS='--inspect' next dev",
    "dev:turbo": "next dev --turbo",
    
    // Build and production
    "build": "next build",
    "start": "next start",
    "build:analyze": "ANALYZE=true next build",
    
    // Type checking and compilation
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch",
    
    // Code quality
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    
    // Testing
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    
    // Database operations
    "migrate": "node scripts/validate-migration.js",
    "migrate:validate": "node scripts/validate-migration.js",
    "seed": "node scripts/seed-dev-data.js",
    "bootstrap": "npm run migrate && npm run seed",
    
    // Data import and processing
    "import": "npx tsx scripts/import-content.ts --data-dir=../../data/output --images-dir=../../data/images",
    "import:dry-run": "npx tsx scripts/import-content.ts --data-dir=../../data/output --dry-run",
    "validate-import": "npx tsx scripts/validate-import.ts",
    "validate-import:full": "npx tsx scripts/validate-import.ts --full-report --spot-check=10",
    "rollback-import": "npx tsx scripts/rollback-import.ts --dry-run",
    "rollback-import:confirm": "npx tsx scripts/rollback-import.ts --confirm",
    
    // Database utilities
    "db:clear": "npx tsx scripts/clear-database.ts",
    "db:reset": "npm run db:clear && npm run bootstrap",
    
    // Combined workflows
    "ci": "npm run type-check && npm run lint && npm run test && npm run build",
    "pre-commit-test": "npm run type-check && npm run lint && npm run format:check",
    "clean": "rm -rf .next && rm -rf dist && rm -rf coverage"
  }
}
```

##### Workspace Commands (Root package.json)

- **REQUIRED:** Provide workspace-aware commands for monorepo operations
- **REQUIRED:** Enable running scripts across all packages
- **REQUIRED:** Support development environment setup

```json
// ✅ Good: Root workspace scripts
{
  "scripts": {
    // Development
    "dev": "npm run dev --workspace=apps/web",
    "dev:all": "npm run dev --workspaces --if-present",
    
    // Build
    "build": "npm run build --workspace=apps/web",
    "build:all": "npm run build --workspaces --if-present",
    
    // Code quality across workspace
    "lint": "npm run lint --workspaces --if-present",
    "lint:fix": "npm run lint:fix --workspaces --if-present",
    "format": "npm run format --workspaces --if-present",
    "type-check": "npm run type-check --workspaces --if-present",
    
    // Testing across workspace
    "test": "npm run test --workspaces --if-present",
    "test:e2e": "npm run test:e2e --workspace=apps/web",
    
    // Installation and setup
    "install:all": "npm install",
    "clean:all": "npm run clean --workspaces --if-present && rm -rf node_modules",
    "bootstrap": "npm install && npm run bootstrap --workspace=apps/web",
    
    // Git hooks
    "prepare": "husky",
    
    // Combined CI workflow
    "ci": "npm run lint && npm run type-check && npm run test && npm run build"
  }
}
```

##### Development Server Configuration

- **REQUIRED:** Configure development server for optimal developer experience
- **REQUIRED:** Support debugging and profiling modes
- **REQUIRED:** Enable hot reload and fast refresh
- **REQUIRED:** Configure proper error handling

```javascript
// ✅ Good: Next.js configuration (next.config.ts)
import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Monorepo configuration
  outputFileTracingRoot: path.join(__dirname, '../../'),
  
  // Development optimizations
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js'],
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['src'],
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Webpack customization for development
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Enable source maps in development
      config.devtool = 'eval-source-map';
    }
    
    // Bundle analyzer in development
    if (process.env.ANALYZE) {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
        })
      );
    }
    
    return config;
  },
  
  // Image optimization
  images: {
    domains: ['vercel.app'],
    formats: ['image/webp', 'image/avif'],
  },
};

export default nextConfig;
```

##### Debugging and Development Tools

- **REQUIRED:** Configure debugging tools for effective troubleshooting
- **REQUIRED:** Set up performance monitoring for development
- **REQUIRED:** Enable detailed error reporting
- **REQUIRED:** Support remote debugging capabilities

```json
// ✅ Good: VSCode launch configuration (.vscode/launch.json)
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/apps/web/node_modules/.bin/next",
      "args": ["dev"],
      "cwd": "${workspaceFolder}/apps/web",
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/apps/web",
      "sourceMapPathOverrides": {
        "webpack://_N_E/./*": "${webRoot}/*",
        "webpack:///./~/*": "${webRoot}/node_modules/*"
      }
    },
    {
      "name": "Next.js: debug full stack",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/apps/web/node_modules/.bin/next",
      "args": ["dev"],
      "cwd": "${workspaceFolder}/apps/web",
      "console": "integratedTerminal",
      "serverReadyAction": {
        "pattern": "started server on .+, url: (https?://.+)",
        "uriFormat": "%s",
        "action": "debugWithChrome"
      }
    }
  ]
}
```

##### Environment Management

- **REQUIRED:** Consistent environment variable management
- **REQUIRED:** Environment-specific configuration
- **REQUIRED:** Secure handling of sensitive data
- **REQUIRED:** Clear documentation of required variables

```bash
# ✅ Good: Environment template (.env.example)
# Database Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key

# File Storage
VERCEL_BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# Development Tools
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development

# Optional: Analytics and Monitoring
# NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id
# SENTRY_DSN=your_sentry_dsn

# Optional: Feature Flags
# NEXT_PUBLIC_ENABLE_BETA_FEATURES=false
```

### Development Tools

#### VSCode Extensions (Recommended)

- **ESLint:** Real-time linting
- **Prettier:** Code formatting
- **TypeScript Hero:** Import organization
- **Tailwind CSS IntelliSense:** CSS class completion
- **Playwright Test for VSCode:** E2E test debugging

#### Editor Configuration

**.vscode/settings.json**
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true
}
```

### Quality Gates

#### Definition of Done Checklist

- [ ] **TypeScript:** Code compiles without errors in strict mode
- [ ] **ESLint:** All linting rules pass
- [ ] **Prettier:** Code is properly formatted
- [ ] **Tests:** Unit tests written and passing (minimum 80% coverage)
- [ ] **Integration:** API endpoints tested with integration tests
- [ ] **E2E:** Critical user flows covered by E2E tests
- [ ] **Documentation:** Code documented with JSDoc, architecture docs updated
- [ ] **Performance:** No performance regressions introduced
- [ ] **Security:** Input validation and error handling implemented

#### Code Review Checklist

- [ ] **Functionality:** Code solves the intended problem
- [ ] **Standards:** Follows all coding standards outlined in this document
- [ ] **Testing:** Adequate test coverage for new functionality
- [ ] **Performance:** No obvious performance issues
- [ ] **Security:** No security vulnerabilities introduced
- [ ] **Documentation:** Code is self-documenting and properly commented
- [ ] **Architecture:** Follows established patterns and project structure

---

## Conclusion

These coding standards ensure consistency, maintainability, and quality across the NCLEX311 Web application. They are enforced through automated tooling and should be followed by all contributors to maintain a high-quality codebase.

**For questions or updates to these standards:** Create an issue in the project repository and tag the architecture team for review.

**Last Updated:** Based on development environment setup from Stories 1.1.5 and 1.2 (September 2024)