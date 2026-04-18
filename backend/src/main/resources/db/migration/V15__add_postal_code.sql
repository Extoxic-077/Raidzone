-- V15: Add postal_code to users table

ALTER TABLE users ADD COLUMN IF NOT EXISTS postal_code VARCHAR(10);
