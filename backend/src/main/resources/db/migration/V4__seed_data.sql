-- V4: Seed initial categories and products.
-- 5 categories, 12 products spread across them with realistic INR pricing.

-- ── Categories ───────────────────────────────────────────────────────────────

INSERT INTO categories (id, name, slug, description, emoji, sort_order, is_active) VALUES
(gen_random_uuid(), 'PC Games',       'pc-games',      'PC and console game titles, keys and activations',            '🎮', 1, TRUE),
(gen_random_uuid(), 'Gift Cards',     'gift-cards',    'Digital wallet top-ups and platform gift cards',              '🎁', 2, TRUE),
(gen_random_uuid(), 'Mobile Top-Up',  'mobile-top-up', 'In-game currency for mobile and cross-platform titles',       '📱', 3, TRUE),
(gen_random_uuid(), 'Streaming',      'streaming',     'Video and music streaming subscriptions',                     '📺', 4, TRUE),
(gen_random_uuid(), 'VPN & Software', 'vpn-software',  'VPN subscriptions, productivity tools and security software', '🛡', 5, TRUE);

-- ── Products ─────────────────────────────────────────────────────────────────
-- Prices in INR. original_price set only when there is an active discount.

-- Gift Cards: Steam Wallet ₹500 India
INSERT INTO products (
    id, name, slug, description, how_to_redeem,
    category_id, brand, product_type, region, emoji, image_url,
    price, original_price, avg_rating, review_count,
    is_active, is_flash_deal, badge, sort_order
) VALUES (
    gen_random_uuid(),
    'Steam Wallet Card ₹500 – India',
    'steam-wallet-500-in',
    'Add ₹500 directly to your Steam Wallet. Works on any India region Steam account. Instantly delivered to your inbox after payment.',
    E'1. Log in to your Steam account.\n2. Click your username at the top right → Account Details.\n3. Click "Add funds to your Steam Wallet".\n4. Select "Redeem a Steam Gift Card or Wallet Code".\n5. Enter the 15-character code exactly as shown.\n6. Click "Continue" – funds are added immediately.',
    (SELECT id FROM categories WHERE slug = 'gift-cards'),
    'Valve / Steam', 'Wallet Card', 'India', '💳', NULL,
    499.00, NULL, 4.7, 1842,
    TRUE, FALSE, 'HOT', 10
);

-- Gift Cards: Steam Wallet ₹1000 India
INSERT INTO products (
    id, name, slug, description, how_to_redeem,
    category_id, brand, product_type, region, emoji, image_url,
    price, original_price, avg_rating, review_count,
    is_active, is_flash_deal, badge, sort_order
) VALUES (
    gen_random_uuid(),
    'Steam Wallet Card ₹1000 – India',
    'steam-wallet-1000-in',
    'Add ₹1000 directly to your Steam Wallet. Works on any India region Steam account. Instant digital delivery.',
    E'1. Log in to your Steam account.\n2. Click your username at the top right → Account Details.\n3. Click "Add funds to your Steam Wallet".\n4. Select "Redeem a Steam Gift Card or Wallet Code".\n5. Enter the 15-character code exactly as shown.\n6. Click "Continue" – funds are added immediately.',
    (SELECT id FROM categories WHERE slug = 'gift-cards'),
    'Valve / Steam', 'Wallet Card', 'India', '💳', NULL,
    949.00, 999.00, 4.8, 2315,
    TRUE, FALSE, 'SALE', 20
);

-- Gift Cards: Steam Wallet $20 Global
INSERT INTO products (
    id, name, slug, description, how_to_redeem,
    category_id, brand, product_type, region, emoji, image_url,
    price, original_price, avg_rating, review_count,
    is_active, is_flash_deal, badge, sort_order
) VALUES (
    gen_random_uuid(),
    'Steam Wallet Card $20 – Global',
    'steam-wallet-20-global',
    'Add $20 USD to your Steam Wallet. Compatible with global Steam accounts. Ideal for international purchases and sales.',
    E'1. Log in to your Steam account.\n2. Click your username at the top right → Account Details.\n3. Click "Add funds to your Steam Wallet".\n4. Select "Redeem a Steam Gift Card or Wallet Code".\n5. Enter the 15-character code exactly as shown.\n6. Click "Continue" – funds are added immediately.',
    (SELECT id FROM categories WHERE slug = 'gift-cards'),
    'Valve / Steam', 'Wallet Card', 'Global', '💳', NULL,
    1649.00, 1799.00, 4.6, 987,
    TRUE, FALSE, NULL, 30
);

-- Gift Cards: Xbox Game Pass Ultimate 3 Months Global  [FLASH DEAL]
INSERT INTO products (
    id, name, slug, description, how_to_redeem,
    category_id, brand, product_type, region, emoji, image_url,
    price, original_price, avg_rating, review_count,
    is_active, is_flash_deal, badge, sort_order
) VALUES (
    gen_random_uuid(),
    'Xbox Game Pass Ultimate 3 Months – Global',
    'xbox-gamepass-3m-global',
    'Unlock 3 months of Xbox Game Pass Ultimate: 100+ high-quality games, Xbox Live Gold, EA Play, and cloud gaming. Global code, works on Xbox and Windows PC.',
    E'1. Sign in to your Microsoft account at microsoft.com/redeem.\n2. Enter the 25-character product key.\n3. Click "Next" and follow the on-screen prompts.\n4. Your Game Pass Ultimate subscription activates immediately.\n5. Download and enjoy games on Xbox console or Windows PC.',
    (SELECT id FROM categories WHERE slug = 'gift-cards'),
    'Microsoft / Xbox', 'Subscription', 'Global', '🎮', NULL,
    1299.00, 1799.00, 4.8, 3102,
    TRUE, TRUE, 'HOT', 40
);

-- Mobile Top-Up: Valorant 1000 VP  [FLASH DEAL]
INSERT INTO products (
    id, name, slug, description, how_to_redeem,
    category_id, brand, product_type, region, emoji, image_url,
    price, original_price, avg_rating, review_count,
    is_active, is_flash_deal, badge, sort_order
) VALUES (
    gen_random_uuid(),
    'Valorant 1000 VP – Global',
    'valorant-1000-vp',
    'Top up 1000 Valorant Points to unlock agents, skins, and battle pass tiers in Riot Games'' acclaimed tactical shooter. Global code, no region restrictions.',
    E'1. Visit valorant.com and log in with your Riot account.\n2. Click the VP (+) button at the top of the Store screen.\n3. Select "Redeem a code" at the bottom of the page.\n4. Enter your 25-character PIN code and click "Submit".\n5. VP are credited to your account instantly.',
    (SELECT id FROM categories WHERE slug = 'mobile-top-up'),
    'Riot Games', 'In-Game Currency', 'Global', '⚡', NULL,
    699.00, 879.00, 4.5, 4217,
    TRUE, TRUE, 'HOT', 10
);

-- Mobile Top-Up: Valorant 2100 VP
INSERT INTO products (
    id, name, slug, description, how_to_redeem,
    category_id, brand, product_type, region, emoji, image_url,
    price, original_price, avg_rating, review_count,
    is_active, is_flash_deal, badge, sort_order
) VALUES (
    gen_random_uuid(),
    'Valorant 2100 VP – Global',
    'valorant-2100-vp',
    'Top up 2100 Valorant Points – the most popular bundle for buying a full weapon skin. Global code, works on all Riot accounts.',
    E'1. Visit valorant.com and log in with your Riot account.\n2. Click the VP (+) button at the top of the Store screen.\n3. Select "Redeem a code" at the bottom of the page.\n4. Enter your 25-character PIN code and click "Submit".\n5. VP are credited to your account instantly.',
    (SELECT id FROM categories WHERE slug = 'mobile-top-up'),
    'Riot Games', 'In-Game Currency', 'Global', '⚡', NULL,
    1399.00, NULL, 4.6, 2890,
    TRUE, FALSE, 'NEW', 20
);

-- Mobile Top-Up: PUBG 325 UC Global
INSERT INTO products (
    id, name, slug, description, how_to_redeem,
    category_id, brand, product_type, region, emoji, image_url,
    price, original_price, avg_rating, review_count,
    is_active, is_flash_deal, badge, sort_order
) VALUES (
    gen_random_uuid(),
    'PUBG Mobile 325 UC – Global',
    'pubg-325-uc',
    'Add 325 Unknown Cash to your PUBG Mobile account. Use UC to buy outfits, crates, and the Royale Pass. Global code, no region lock.',
    E'1. Open PUBG Mobile and tap your profile icon.\n2. Tap "UC" on the top-right to open the UC Shop.\n3. Scroll down and tap "Redeem Code".\n4. Enter the redemption code and tap "Claim".\n5. UC is added to your account immediately.',
    (SELECT id FROM categories WHERE slug = 'mobile-top-up'),
    'Krafton / PUBG Corp', 'In-Game Currency', 'Global', '🔫', NULL,
    369.00, NULL, 4.3, 1654,
    TRUE, FALSE, NULL, 30
);

-- Mobile Top-Up: PUBG 1800+180 UC Global  [FLASH DEAL]
INSERT INTO products (
    id, name, slug, description, how_to_redeem,
    category_id, brand, product_type, region, emoji, image_url,
    price, original_price, avg_rating, review_count,
    is_active, is_flash_deal, badge, sort_order
) VALUES (
    gen_random_uuid(),
    'PUBG Mobile 1800+180 UC – Global',
    'pubg-1800-uc',
    'Add 1800 UC and receive 180 bonus UC (total 1980 UC) to your PUBG Mobile account. Best value bundle for Royale Pass and premium crates. Global code.',
    E'1. Open PUBG Mobile and tap your profile icon.\n2. Tap "UC" on the top-right to open the UC Shop.\n3. Scroll down and tap "Redeem Code".\n4. Enter the redemption code and tap "Claim".\n5. UC is added to your account immediately.',
    (SELECT id FROM categories WHERE slug = 'mobile-top-up'),
    'Krafton / PUBG Corp', 'In-Game Currency', 'Global', '🔫', NULL,
    1399.00, 1799.00, 4.5, 2103,
    TRUE, TRUE, 'SALE', 40
);

-- Streaming: Netflix Premium 1 Month India
INSERT INTO products (
    id, name, slug, description, how_to_redeem,
    category_id, brand, product_type, region, emoji, image_url,
    price, original_price, avg_rating, review_count,
    is_active, is_flash_deal, badge, sort_order
) VALUES (
    gen_random_uuid(),
    'Netflix Premium 1 Month – India',
    'netflix-premium-1m-in',
    'Enjoy 1 month of Netflix Premium in India: 4K Ultra HD, HDR, Dolby Atmos, and 4 simultaneous streams. Redeem code on a new or existing India account.',
    E'1. Go to netflix.com/redeem or open the Netflix app.\n2. Sign in to your India Netflix account (or create one).\n3. Enter the gift code in the provided field.\n4. Click "Redeem" – your subscription activates immediately.\n5. Enjoy unlimited 4K streaming for 30 days.',
    (SELECT id FROM categories WHERE slug = 'streaming'),
    'Netflix', 'Subscription', 'India', '🎬', NULL,
    599.00, 799.00, 4.7, 5421,
    TRUE, FALSE, 'HOT', 10
);

-- Streaming: Spotify Premium 3 Months India
INSERT INTO products (
    id, name, slug, description, how_to_redeem,
    category_id, brand, product_type, region, emoji, image_url,
    price, original_price, avg_rating, review_count,
    is_active, is_flash_deal, badge, sort_order
) VALUES (
    gen_random_uuid(),
    'Spotify Premium 3 Months – India',
    'spotify-premium-3m-in',
    'Get 3 months of Spotify Premium in India: ad-free music, offline listening, unlimited skips, and highest audio quality. Redeem on a new or existing account.',
    E'1. Go to spotify.com/in-en/redeem.\n2. Log in with your Spotify India account.\n3. Enter the gift card code in the provided field.\n4. Click "Redeem" to apply the code.\n5. Premium activates instantly – enjoy 3 months ad-free.',
    (SELECT id FROM categories WHERE slug = 'streaming'),
    'Spotify', 'Subscription', 'India', '🎵', NULL,
    269.00, 399.00, 4.6, 3298,
    TRUE, FALSE, NULL, 20
);

-- Streaming: YouTube Premium 1 Month India
INSERT INTO products (
    id, name, slug, description, how_to_redeem,
    category_id, brand, product_type, region, emoji, image_url,
    price, original_price, avg_rating, review_count,
    is_active, is_flash_deal, badge, sort_order
) VALUES (
    gen_random_uuid(),
    'YouTube Premium 1 Month – India',
    'youtube-premium-1m-in',
    'Enjoy 1 month of YouTube Premium in India: ad-free videos, background play, YouTube Music, and offline downloads. Redeem on any Google account based in India.',
    E'1. Go to youtube.com/paid_memberships.\n2. Sign in with your India Google account.\n3. Click "Redeem a gift code".\n4. Enter your redemption code and click "Redeem".\n5. Premium activates immediately – enjoy ad-free YouTube.',
    (SELECT id FROM categories WHERE slug = 'streaming'),
    'Google / YouTube', 'Subscription', 'India', '▶️', NULL,
    119.00, 159.00, 4.4, 2876,
    TRUE, FALSE, 'NEW', 30
);

-- VPN & Software: NordVPN 1 Year Global
INSERT INTO products (
    id, name, slug, description, how_to_redeem,
    category_id, brand, product_type, region, emoji, image_url,
    price, original_price, avg_rating, review_count,
    is_active, is_flash_deal, badge, sort_order
) VALUES (
    gen_random_uuid(),
    'NordVPN 1 Year – Global',
    'nordvpn-1year-global',
    'Secure your online privacy for a full year with NordVPN: 5500+ servers in 60 countries, AES-256 encryption, no-log policy, kill switch, and up to 6 simultaneous devices. Global code.',
    E'1. Go to nordvpn.com and log in or create an account.\n2. Click your profile icon → Nord Account Dashboard.\n3. Navigate to "Services" → "Activate a new service".\n4. Enter the redemption code and click "Activate".\n5. Download the NordVPN app on your devices and sign in.',
    (SELECT id FROM categories WHERE slug = 'vpn-software'),
    'Nord Security', 'VPN Subscription', 'Global', '🛡', NULL,
    2799.00, 4999.00, 4.7, 1987,
    TRUE, FALSE, 'SALE', 10
);
