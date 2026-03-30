-- V7 created rating as SMALLINT but the Review entity maps to INTEGER.
-- Widen the column to avoid Hibernate schema-validation failure.
ALTER TABLE reviews ALTER COLUMN rating TYPE INTEGER;
