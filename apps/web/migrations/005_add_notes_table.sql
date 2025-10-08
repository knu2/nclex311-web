-- Migration: Add notes table for user personal notes on concepts
-- Description: Creates notes table to store user's private notes for concepts
-- Date: 2025-10-08
-- Dependencies: 001_initial_schema.sql (users, concepts tables)
-- Rollback: DROP TABLE IF EXISTS notes CASCADE;

BEGIN;

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Ensure one note per user per concept
  CONSTRAINT unique_user_concept_note UNIQUE (user_id, concept_id)
);

-- Create index for efficient querying by user and concept
CREATE INDEX IF NOT EXISTS idx_notes_user_concept ON notes(user_id, concept_id);

-- Create index for querying all notes by user
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);

-- Create index for querying all notes by concept
CREATE INDEX IF NOT EXISTS idx_notes_concept_id ON notes(concept_id);

-- Add comment to table
COMMENT ON TABLE notes IS 'Stores user personal notes for concepts';
COMMENT ON COLUMN notes.content IS 'Note content in plain text, max 2000 characters';
COMMENT ON COLUMN notes.user_id IS 'User who created the note';
COMMENT ON COLUMN notes.concept_id IS 'Concept the note is about';

COMMIT;

-- Verification query (run separately to verify migration success)
-- SELECT table_name, column_name, data_type, character_maximum_length 
-- FROM information_schema.columns 
-- WHERE table_name = 'notes' 
-- ORDER BY ordinal_position;
