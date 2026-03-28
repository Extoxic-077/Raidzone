-- Tracks which user bought which product (one record per user-product pair).
-- Created when the user clicks "Buy Now" on the product detail page.
CREATE TABLE purchases (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    product_id UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, product_id)
);

CREATE INDEX idx_purchases_user    ON purchases(user_id);
CREATE INDEX idx_purchases_product ON purchases(product_id);
