-- Migration: 007_add_completed_concepts_table.sql
-- Description: Add completed_concepts table for tracking user progress
-- Date: 2025-10-14
-- Story: 1.5.8 Progress Dashboard
-- Dependencies: 001_initial_schema.sql (users, concepts tables)
-- Rollback: DROP TABLE IF EXISTS completed_concepts CASCADE;

BEGIN;

-- Drop table if it exists (to handle partial migrations)
DROP TABLE IF EXISTS completed_concepts CASCADE;

-- Create completed_concepts table
CREATE TABLE completed_concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Unique constraint: user can only complete each concept once
  CONSTRAINT unique_user_concept UNIQUE (user_id, concept_id)
);

-- Create indexes for performance
CREATE INDEX idx_completed_concepts_user_id ON completed_concepts(user_id);
CREATE INDEX idx_completed_concepts_concept_id ON completed_concepts(concept_id);
CREATE INDEX idx_completed_concepts_user_concept ON completed_concepts(user_id, concept_id);

-- Verify the table was created
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'completed_concepts'
ORDER BY ordinal_position;

COMMIT;

-- Verification query (run separately after migration)
-- SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_name = 'completed_concepts';
