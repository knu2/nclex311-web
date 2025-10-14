-- Migration: 004_create_bookmarks_table.sql
-- Description: Create bookmarks table for Story 1.5.9
-- Date: 2025-10-14
-- Dependencies: 001_initial_schema.sql (users, concepts tables)
-- Rollback: DROP TABLE IF EXISTS bookmarks CASCADE;

-- Drop existing table if it exists (clean slate)
DROP TABLE IF EXISTS bookmarks CASCADE;

-- Create bookmarks table
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  bookmarked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Unique constraint: one bookmark per user per concept
  CONSTRAINT unique_user_concept_bookmark UNIQUE (user_id, concept_id)
);

-- Create indexes for efficient lookups
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_concept_id ON bookmarks(concept_id);
CREATE INDEX idx_bookmarks_bookmarked_at ON bookmarks(bookmarked_at DESC);

-- Add comments for documentation
COMMENT ON TABLE bookmarks IS 'User bookmarks for concepts - tracks which concepts users have bookmarked for quick access';
COMMENT ON COLUMN bookmarks.user_id IS 'Reference to the user who created the bookmark';
COMMENT ON COLUMN bookmarks.concept_id IS 'Reference to the bookmarked concept';
COMMENT ON COLUMN bookmarks.bookmarked_at IS 'Timestamp when concept was bookmarked (used for sorting)';

-- Verify the table was created
SELECT 
  table_name, 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'bookmarks'
ORDER BY ordinal_position;
