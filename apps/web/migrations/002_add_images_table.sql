-- Migration: 002_add_images_table.sql
-- Description: Add images table with blob storage integration for medical images
-- Created: 2025-09-20
-- Related to: Story 1.2 - Database Import from Pre-Extracted JSON and Images

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