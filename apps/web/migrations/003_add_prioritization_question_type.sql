-- Migration: Add PRIORITIZATION Question Type
-- Date: 2025-09-23
-- Purpose: Add support for drag-and-drop sequencing/ordering questions

-- Add PRIORITIZATION to the question_type enum
-- Note: PostgreSQL requires special syntax to add values to existing ENUMs
ALTER TYPE question_type ADD VALUE 'PRIORITIZATION';

-- Verify the updated enum values
-- Expected values: 'MULTIPLE_CHOICE', 'SELECT_ALL_THAT_APPLY', 'FILL_IN_THE_BLANK', 'MATRIX_GRID', 'PRIORITIZATION'

-- Example prioritization question usage:
-- INSERT INTO questions (text, type, rationale, concept_id) VALUES
-- ('Please arrange the following milestones in motor development in ascending order?', 'PRIORITIZATION', 'Growth and development are continuous...', 'concept-uuid');

-- Note: Prioritization questions use comma-separated answer format
-- Example correct_answer in options: "2, 4, 3, 1" representing the correct sequence