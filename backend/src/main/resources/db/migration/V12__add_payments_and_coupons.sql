-- ── 1. Extend the orders table ────────────────────────────────────────────────

ALTER TABLE orders
    ADD COLUMN payment_method   VARCHAR(20),
    ADD COLUMN paid_at          TIMESTAMP,
    ADD COLUMN discount_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
    ADD COLUMN coupon_code      VARCHAR(50);

-- Change default for new orders (only affects future INSERTs)
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'PENDING_PAYMENT';

-- Existing confirmed orders stay confirmed (intentional no-op documenting intent)
UPDATE orders SET status = 'CONFIRMED' WHERE status = 'CONFIRMED';

-- ── 2. Payments table ─────────────────────────────────────────────────────────

CREATE TABLE payments (
    id                          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id                    UUID            NOT NULL REFERENCES orders(id),
    provider                    VARCHAR(20)     NOT NULL,
    status                      VARCHAR(20)     NOT NULL DEFAULT 'PENDING',
    amount                      NUMERIC(12,2)   NOT NULL,
    currency                    VARCHAR(10)     NOT NULL DEFAULT 'INR',
    stripe_payment_intent_id    VARCHAR(255),
    razorpay_order_id           VARCHAR(255),
    razorpay_payment_id         VARCHAR(255),
    coinbase_charge_id          VARCHAR(255),
    coinbase_charge_code        VARCHAR(50),
    coinbase_hosted_url         TEXT,
    created_at                  TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_order_id        ON payments(order_id);
CREATE INDEX idx_payments_provider        ON payments(provider);
CREATE INDEX idx_payments_stripe_intent   ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_razorpay_order  ON payments(razorpay_order_id);
CREATE INDEX idx_payments_coinbase_charge ON payments(coinbase_charge_id);

-- ── 3. Coupons table ──────────────────────────────────────────────────────────

CREATE TABLE coupons (
    id                UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    code              VARCHAR(50)     NOT NULL UNIQUE,
    type              VARCHAR(20)     NOT NULL,
    value             NUMERIC(10,2)   NOT NULL,
    min_order_amount  NUMERIC(10,2)   NOT NULL DEFAULT 0,
    max_discount      NUMERIC(10,2),
    usage_limit       INTEGER         NOT NULL DEFAULT 100,
    used_count        INTEGER         NOT NULL DEFAULT 0,
    is_active         BOOLEAN         NOT NULL DEFAULT TRUE,
    expires_at        TIMESTAMP,
    created_at        TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- ── 4. Coupon usages table ────────────────────────────────────────────────────

CREATE TABLE coupon_usages (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id   UUID            NOT NULL REFERENCES coupons(id),
    user_id     UUID            NOT NULL REFERENCES users(id),
    order_id    UUID            NOT NULL REFERENCES orders(id),
    discount    NUMERIC(12,2)   NOT NULL,
    used_at     TIMESTAMP       NOT NULL DEFAULT NOW(),
    UNIQUE(coupon_id, user_id)
);

-- ── 5. Seed test coupons ──────────────────────────────────────────────────────

INSERT INTO coupons (code, type, value, min_order_amount, max_discount, usage_limit, is_active)
VALUES
    ('HASHVAULT10', 'PERCENTAGE', 10.00, 200.00, 500.00,  200, TRUE),
    ('FLAT50',      'FIXED',      50.00,  99.00,   NULL,  100, TRUE),
    ('CRYPTO20',    'PERCENTAGE', 20.00, 500.00, 1000.00,  50, TRUE)
ON CONFLICT (code) DO NOTHING;
