-- Migration 004: Add Reference Field to Concepts Table
-- Description: Add bibliographic reference field to store citation information for concept sources
-- Date: 2025-10-08
-- Dependencies: 001_initial_schema.sql
-- Rollback: ALTER TABLE concepts DROP COLUMN reference;

BEGIN;

-- Add reference column to concepts table (nullable TEXT field)
ALTER TABLE concepts ADD COLUMN reference TEXT;

-- Add comment to document the column purpose
COMMENT ON COLUMN concepts.reference IS 'Bibliographic reference/citation for the concept source material (plain text format)';

-- Verify the column was added successfully
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'concepts' AND column_name = 'reference';

COMMIT;
