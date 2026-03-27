-- V1: Enable pgcrypto and create the users table.
-- Users are stored here for Phase 2 authentication; the table is validated
-- by Hibernate in Phase 1 but no endpoints expose it yet.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    email            VARCHAR(255)  NOT NULL,
    name             VARCHAR(255)  NOT NULL,
    phone            VARCHAR(20),
    nickname         VARCHAR(100),
    password_hash    TEXT,
    role             VARCHAR(20)   NOT NULL DEFAULT 'USER',
    provider         VARCHAR(20)   NOT NULL DEFAULT 'LOCAL',
    is_email_verified BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active        BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_users_email    UNIQUE (email),
    CONSTRAINT uq_users_nickname UNIQUE (nickname)
);

CREATE INDEX idx_users_email ON users (email);
