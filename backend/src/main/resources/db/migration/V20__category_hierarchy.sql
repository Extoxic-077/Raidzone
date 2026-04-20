-- V20: Category hierarchy — add parent_id, insert new category tree, migrate existing products.

-- ── 1. Add parent_id ──────────────────────────────────────────────────────────
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id);

-- ── 2. Insert top-level parent categories ────────────────────────────────────
INSERT INTO categories (id, name, slug, description, emoji, sort_order, is_active) VALUES
(gen_random_uuid(), 'Games',         'games',        'Game titles for all platforms',                  '🎮', 10, TRUE),
(gen_random_uuid(), 'Card',          'card',         'Gift cards, game cards and subscriptions',       '🃏', 20, TRUE),
(gen_random_uuid(), 'Direct Pop-up', 'direct-popup', 'Direct top-up services for games and apps',     '⚡', 30, TRUE);

-- ── 3. Insert subcategories for Games ────────────────────────────────────────
INSERT INTO categories (id, name, slug, description, emoji, sort_order, is_active, parent_id) VALUES
(gen_random_uuid(), 'PC',              'games-pc',          'PC game keys and activations',         '💻', 1,  TRUE, (SELECT id FROM categories WHERE slug='games')),
(gen_random_uuid(), 'Webgame',         'games-webgame',     'Browser and web game credits',         '🌐', 2,  TRUE, (SELECT id FROM categories WHERE slug='games')),
(gen_random_uuid(), 'Mobile',          'games-mobile',      'Mobile game cards and credits',        '📳', 3,  TRUE, (SELECT id FROM categories WHERE slug='games')),
(gen_random_uuid(), 'PlayStation',     'games-playstation', 'PlayStation Network cards and games',  '🎮', 4,  TRUE, (SELECT id FROM categories WHERE slug='games')),
(gen_random_uuid(), 'Xbox',            'games-xbox',        'Xbox gift cards and Game Pass',        '🎯', 5,  TRUE, (SELECT id FROM categories WHERE slug='games')),
(gen_random_uuid(), 'Nintendo Switch', 'games-nintendo',    'Nintendo eShop cards and games',       '🎲', 6,  TRUE, (SELECT id FROM categories WHERE slug='games'));

-- ── 4. Insert subcategories for Card ─────────────────────────────────────────
INSERT INTO categories (id, name, slug, description, emoji, sort_order, is_active, parent_id) VALUES
(gen_random_uuid(), 'Mobile Game Cards',     'card-mobile-game',    'Top-up cards for mobile games',          '🎴', 1,  TRUE, (SELECT id FROM categories WHERE slug='card')),
(gen_random_uuid(), 'Game Cards',            'card-game-cards',     'Prepaid game card codes',                 '🃏', 2,  TRUE, (SELECT id FROM categories WHERE slug='card')),
(gen_random_uuid(), 'Payment Cards',         'card-payment',        'Prepaid payment and virtual cards',       '💳', 3,  TRUE, (SELECT id FROM categories WHERE slug='card')),
(gen_random_uuid(), 'Gift Cards',            'card-gift-cards',     'Gift cards for popular platforms',        '🎁', 4,  TRUE, (SELECT id FROM categories WHERE slug='card')),
(gen_random_uuid(), 'Game Console',          'card-console',        'Console store credit cards',              '🕹', 5,  TRUE, (SELECT id FROM categories WHERE slug='card')),
(gen_random_uuid(), 'Game CD-Key',           'card-cdkey',          'PC game activation keys',                 '🔑', 6,  TRUE, (SELECT id FROM categories WHERE slug='card')),
(gen_random_uuid(), 'Video Streaming',       'card-video-streaming','Streaming service subscriptions',         '📺', 7,  TRUE, (SELECT id FROM categories WHERE slug='card')),
(gen_random_uuid(), 'Music',                 'card-music',          'Music streaming subscriptions',           '🎵', 8,  TRUE, (SELECT id FROM categories WHERE slug='card')),
(gen_random_uuid(), 'Shopping',              'card-shopping',       'Shopping platform gift cards',            '🛍', 9,  TRUE, (SELECT id FROM categories WHERE slug='card')),
(gen_random_uuid(), 'Telco Prepaid Cards',   'card-telco',          'Mobile carrier prepaid vouchers',         '📶', 10, TRUE, (SELECT id FROM categories WHERE slug='card')),
(gen_random_uuid(), 'Tools',                 'card-tools',          'Productivity and utility software',       '🔧', 11, TRUE, (SELECT id FROM categories WHERE slug='card')),
(gen_random_uuid(), 'Software',              'card-software',       'Software licenses and activations',       '💿', 12, TRUE, (SELECT id FROM categories WHERE slug='card')),
(gen_random_uuid(), 'Social App',            'card-social',         'Social media top-up and premium',         '💬', 13, TRUE, (SELECT id FROM categories WHERE slug='card')),
(gen_random_uuid(), 'Freebie Codes',         'card-freebie',        'Free promotional codes',                  '🆓', 14, TRUE, (SELECT id FROM categories WHERE slug='card')),
(gen_random_uuid(), 'Subscription',          'card-subscription',   'Recurring subscription services',         '🔄', 15, TRUE, (SELECT id FROM categories WHERE slug='card'));

-- ── 5. Insert subcategories for Direct Pop-up ────────────────────────────────
INSERT INTO categories (id, name, slug, description, emoji, sort_order, is_active, parent_id) VALUES
(gen_random_uuid(), 'Mobile Game Top-Up',    'popup-mobile-game',   'Direct top-up for mobile games',          '📱', 1, TRUE, (SELECT id FROM categories WHERE slug='direct-popup')),
(gen_random_uuid(), 'Game Direct Top-Up',    'popup-game-direct',   'Direct in-game currency top-up',          '🎮', 2, TRUE, (SELECT id FROM categories WHERE slug='direct-popup')),
(gen_random_uuid(), 'China Direct Top-Up',   'popup-china',         'China region direct top-up services',     '🇨🇳', 3, TRUE, (SELECT id FROM categories WHERE slug='direct-popup')),
(gen_random_uuid(), 'Video Streaming',       'popup-video',         'Direct streaming account top-up',         '📺', 4, TRUE, (SELECT id FROM categories WHERE slug='direct-popup')),
(gen_random_uuid(), 'Entertainment',         'popup-entertainment', 'Entertainment platform top-up',           '🎬', 5, TRUE, (SELECT id FROM categories WHERE slug='direct-popup')),
(gen_random_uuid(), 'Live Streaming',        'popup-live',          'Live streaming platform credits',         '🎥', 6, TRUE, (SELECT id FROM categories WHERE slug='direct-popup'));

-- ── 6. Migrate existing products to new categories ───────────────────────────
-- PC Games → games-pc
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug='games-pc')
WHERE category_id = (SELECT id FROM categories WHERE slug='pc-games');

-- Gift Cards (old) → card-gift-cards
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug='card-gift-cards')
WHERE category_id = (SELECT id FROM categories WHERE slug='gift-cards');

-- Mobile Top-Up (old) → popup-mobile-game
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug='popup-mobile-game')
WHERE category_id = (SELECT id FROM categories WHERE slug='mobile-top-up');

-- Streaming (old) → card-video-streaming
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug='card-video-streaming')
WHERE category_id = (SELECT id FROM categories WHERE slug='streaming');

-- VPN & Software (old) → card-software
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug='card-software')
WHERE category_id = (SELECT id FROM categories WHERE slug='vpn-software');

-- ── 7. Deactivate old flat categories ─────────────────────────────────────────
UPDATE categories SET is_active = FALSE
WHERE slug IN ('pc-games', 'gift-cards', 'mobile-top-up', 'streaming', 'vpn-software');

-- ── 8. Insert standalone Mobile Top-Up ───────────────────────────────────────
INSERT INTO categories (id, name, slug, description, emoji, sort_order, is_active) VALUES
(gen_random_uuid(), 'Mobile Top-Up', 'mobile-topup', 'Mobile carrier and in-game top-ups', '📱', 40, TRUE);
