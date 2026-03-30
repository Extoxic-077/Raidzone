-- Orders table: one row per checkout, belongs to a user
CREATE TABLE orders (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status           VARCHAR(20)  NOT NULL DEFAULT 'CONFIRMED',
    total_amount     NUMERIC(12,2) NOT NULL,
    total_items      INT           NOT NULL,
    shipping_name    VARCHAR(120)  NOT NULL,
    shipping_email   VARCHAR(200)  NOT NULL,
    shipping_phone   VARCHAR(30),
    shipping_address TEXT,
    created_at       TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
