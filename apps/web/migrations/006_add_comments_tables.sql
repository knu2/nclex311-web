-- Migration: 006_add_comments_tables.sql
-- Description: Modify existing comments table and add comment_likes table for Discussion Modal (Story 1.5.6)
-- Date: 2025-10-10
-- Dependencies: 001_initial_schema.sql (users and concepts tables with existing comments table)
-- Rollback: See rollback section at bottom

BEGIN;

-- Modify existing comments table
-- 1. Rename 'text' column to 'content' to match our API
ALTER TABLE comments RENAME COLUMN text TO content;

-- 2. Add length constraint (2000 chars max, must not be empty)
ALTER TABLE comments ADD CONSTRAINT comments_content_length_check 
  CHECK (char_length(content) <= 2000 AND char_length(content) > 0);

-- Create comment_likes table
CREATE TABLE comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, comment_id)
);

-- Create indexes for performance
-- Note: idx_comments_concept_id already exists from migration 001, so we add new ones
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON comment_likes(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_comments_updated_at 
  BEFORE UPDATE ON comments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Verify tables exist
SELECT 'comments' as table_name, COUNT(*) as row_count FROM comments
UNION ALL
SELECT 'comment_likes' as table_name, COUNT(*) as row_count FROM comment_likes;

COMMIT;

/*
-- ROLLBACK INSTRUCTIONS
-- If you need to rollback this migration, run the following:

BEGIN;

-- Drop the trigger
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;

-- Drop the function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop comment_likes table
DROP TABLE IF EXISTS comment_likes;

-- Remove the constraint
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_content_length_check;

-- Rename content back to text
ALTER TABLE comments RENAME COLUMN content TO text;

-- Drop the new indexes (keep the original idx_comments_concept_id)
DROP INDEX IF EXISTS idx_comments_created_at;
DROP INDEX IF EXISTS idx_comments_user;

COMMIT;
*/
