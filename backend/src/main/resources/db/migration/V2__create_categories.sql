-- V2: Create the categories table.
-- Each category groups related digital products (e.g. Gift Cards, Streaming).

CREATE TABLE categories (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(100) NOT NULL,
    description TEXT,
    emoji       VARCHAR(10),
    sort_order  INTEGER      NOT NULL DEFAULT 0,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_categories_slug UNIQUE (slug)
);

CREATE INDEX idx_categories_slug      ON categories (slug);
CREATE INDEX idx_categories_sort_order ON categories (sort_order);
