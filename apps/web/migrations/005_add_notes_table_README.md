# Migration 005: Add Notes Table

## Overview

This migration adds the `notes` table to support the personal notes feature (Story 1.5.5).

## Purpose

Allows authenticated users to create, read, update, and delete personal notes on concepts for their own study purposes.

## Date

2025-10-08

## Dependencies

- Migration 001: Initial schema (users, concepts tables must exist)

## How to Apply

### Option 1: Supabase Dashboard (Recommended for Production)

1. Log in to Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `005_add_notes_table.sql`
4. Paste into SQL Editor
5. Click "Run" to execute
6. Verify success with the verification query at the bottom of the file

### Option 2: Local Development (psql)

```bash
# Connect to your local database
psql -U postgres -d nclex311

# Run the migration
\i apps/web/migrations/005_add_notes_table.sql

# Verify
SELECT table_name, column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'notes'
ORDER BY ordinal_position;
```

## Schema Details

### Table: `notes`

| Column     | Type        | Constraints                                         | Description                   |
| ---------- | ----------- | --------------------------------------------------- | ----------------------------- |
| id         | UUID        | PRIMARY KEY, DEFAULT gen_random_uuid()              | Unique identifier             |
| user_id    | UUID        | NOT NULL, REFERENCES users(id) ON DELETE CASCADE    | User who created the note     |
| concept_id | UUID        | NOT NULL, REFERENCES concepts(id) ON DELETE CASCADE | Concept the note is about     |
| content    | TEXT        | NOT NULL, CHECK (char_length(content) <= 2000)      | Note content (max 2000 chars) |
| created_at | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL                             | Creation timestamp            |
| updated_at | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL                             | Last update timestamp         |

### Constraints

- `unique_user_concept_note`: UNIQUE (user_id, concept_id) - One note per user per concept

### Indexes

- `idx_notes_user_concept`: (user_id, concept_id) - Primary query pattern
- `idx_notes_user_id`: (user_id) - Get all notes for a user
- `idx_notes_concept_id`: (concept_id) - Get all notes for a concept

## Verification

After applying the migration, verify the table exists:

```sql
-- Check table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'notes'
);

-- View table structure
\d notes

-- Check constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'notes';

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'notes';
```

## Rollback

If you need to rollback this migration:

```sql
DROP TABLE IF EXISTS notes CASCADE;
```

**WARNING:** This will permanently delete all user notes!

## Related Files

- Schema: `apps/web/src/lib/db/schema/notes.ts`
- Service: `apps/web/src/lib/db/services/NotesService.ts`
- API Routes: `apps/web/src/app/api/concepts/[id]/notes/route.ts`
- Component: `apps/web/src/components/Notes/NotesModal.tsx`

## Story Reference

Story 1.5.5: Notes Modal - Personal note-taking feature for concepts
