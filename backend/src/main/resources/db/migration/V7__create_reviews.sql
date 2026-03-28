-- Reviews: one review per user per product
CREATE TABLE reviews (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id    UUID        NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    rating     SMALLINT    NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment    VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (product_id, user_id)
);

CREATE INDEX idx_reviews_product ON reviews(product_id);
