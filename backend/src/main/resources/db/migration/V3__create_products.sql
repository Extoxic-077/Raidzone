-- V3: Create the products table.
-- Each product is a digital good that belongs to one category.
-- Prices are stored in INR. Flash deals are surfaced on the homepage.

CREATE TABLE products (
    id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255)   NOT NULL,
    slug            VARCHAR(255)   NOT NULL,
    description     TEXT,
    how_to_redeem   TEXT,
    category_id     UUID           NOT NULL REFERENCES categories (id),
    brand           VARCHAR(100),
    product_type    VARCHAR(100),
    region          VARCHAR(50)    NOT NULL DEFAULT 'Global',
    emoji           VARCHAR(10),
    image_url       TEXT,
    price           NUMERIC(10, 2) NOT NULL,
    original_price  NUMERIC(10, 2),
    avg_rating      NUMERIC(3, 1)  NOT NULL DEFAULT 0,
    review_count    INTEGER        NOT NULL DEFAULT 0,
    is_active       BOOLEAN        NOT NULL DEFAULT TRUE,
    is_flash_deal   BOOLEAN        NOT NULL DEFAULT FALSE,
    badge           VARCHAR(20),
    sort_order      INTEGER        NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_products_slug UNIQUE (slug)
);

CREATE INDEX idx_products_category_id  ON products (category_id);
CREATE INDEX idx_products_is_active    ON products (is_active);
CREATE INDEX idx_products_slug         ON products (slug);
CREATE INDEX idx_products_is_flash_deal ON products (is_flash_deal);
