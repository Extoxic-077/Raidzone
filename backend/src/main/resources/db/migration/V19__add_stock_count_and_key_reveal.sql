-- V19: stock_count on products + key reveal tracking on digital_keys

-- 1. Denormalised stock count cache for fast out-of-stock checks
ALTER TABLE products ADD COLUMN stock_count INTEGER NOT NULL DEFAULT 0;

-- Back-fill from existing available keys
UPDATE products p
   SET stock_count = (
       SELECT COUNT(*)
         FROM digital_keys dk
        WHERE dk.product_id = p.id
          AND dk.status = 'AVAILABLE'
   );

-- 2. Track whether a purchased key has been revealed to the buyer
ALTER TABLE digital_keys ADD COLUMN is_revealed  BOOLEAN     NOT NULL DEFAULT FALSE;
ALTER TABLE digital_keys ADD COLUMN revealed_at  TIMESTAMPTZ;
