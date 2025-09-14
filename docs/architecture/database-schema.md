# Database Schema

This SQL script defines the complete schema for the PostgreSQL database (implemented via Supabase).

## Migration Strategy

Migrations are managed through a hybrid approach:
- **Development:** Manual execution via Supabase Dashboard SQL Editor for safety and control
- **Validation:** Custom npm scripts (`npm run migrate`) validate schema completeness
- **Production:** All schema changes deployed manually through Supabase Dashboard
- **Local Testing:** Migration scripts available for validation but not automatic execution

> **Note:** Automated migrations are intentionally disabled to prevent unsafe schema changes during deployments.

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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
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

-- Table for medical images associated with concepts or questions
CREATE TABLE images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    blob_url TEXT NOT NULL,
    alt TEXT NOT NULL,
    width INT NOT NULL,
    height INT NOT NULL,
    file_size BIGINT NOT NULL,
    extraction_confidence VARCHAR(10) NOT NULL CHECK (extraction_confidence IN ('high', 'medium', 'low')),
    medical_content TEXT NOT NULL,
    concept_id UUID REFERENCES concepts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        (concept_id IS NOT NULL AND question_id IS NULL) OR
        (concept_id IS NULL AND question_id IS NOT NULL) OR
        (concept_id IS NULL AND question_id IS NULL)
    )
);
CREATE INDEX idx_images_concept_id ON images(concept_id);
CREATE INDEX idx_images_question_id ON images(question_id);

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
