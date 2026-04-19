-- Fix: notifications.metadata column type JSONB → TEXT
-- JSONB caused "column is of type jsonb but expression is of type character varying"
-- when NotificationService inserted a plain Java String via JPA.
ALTER TABLE notifications
    ALTER COLUMN metadata TYPE TEXT USING metadata::TEXT;
