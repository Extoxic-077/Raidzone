-- V16: Digital keys warehouse system

CREATE TABLE digital_keys (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id    UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    key_value     TEXT        NOT NULL,           -- AES-256-GCM encrypted
    status        VARCHAR(10) NOT NULL DEFAULT 'AVAILABLE',  -- AVAILABLE | SOLD
    order_item_id UUID        REFERENCES order_items(id),
    assigned_at   TIMESTAMPTZ,
    added_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_digital_keys_product_available
    ON digital_keys (product_id, status)
    WHERE status = 'AVAILABLE';

CREATE INDEX idx_digital_keys_order_item
    ON digital_keys (order_item_id)
    WHERE order_item_id IS NOT NULL;

ALTER TABLE order_items
    ADD COLUMN IF NOT EXISTS digital_key_id UUID REFERENCES digital_keys(id);

COMMENT ON TABLE digital_keys IS 'Encrypted digital product keys assigned to orders on payment confirmation';
COMMENT ON COLUMN digital_keys.key_value IS 'AES-256-GCM encrypted key value, stored as base64(iv:ciphertext)';
