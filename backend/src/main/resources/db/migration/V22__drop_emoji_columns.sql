-- Remove emoji columns from categories and products
-- UI uses SVG icons instead of Unicode emoji

ALTER TABLE categories DROP COLUMN IF EXISTS emoji;
ALTER TABLE products   DROP COLUMN IF EXISTS emoji;
