-- V21: Add companies table and company_id FK on products.

-- ── 1. Create companies table ─────────────────────────────────────────────────
CREATE TABLE companies (
    id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(150) NOT NULL,
    slug        VARCHAR(150) NOT NULL UNIQUE,
    logo_url    TEXT,
    description TEXT,
    website_url TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. Add company_id FK to products ─────────────────────────────────────────
ALTER TABLE products ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- ── 3. Seed well-known companies ─────────────────────────────────────────────
INSERT INTO companies (id, name, slug, description, sort_order) VALUES
(gen_random_uuid(), 'Valve / Steam',       'valve-steam',        'The leading PC gaming platform',                        10),
(gen_random_uuid(), 'Microsoft / Xbox',    'microsoft-xbox',     'Xbox games and services',                               20),
(gen_random_uuid(), 'Sony PlayStation',    'sony-playstation',   'PlayStation gaming platform',                           30),
(gen_random_uuid(), 'Nintendo',            'nintendo',           'Nintendo Switch games and credits',                     40),
(gen_random_uuid(), 'Riot Games',          'riot-games',         'Valorant, League of Legends and more',                  50),
(gen_random_uuid(), 'Electronic Arts',     'electronic-arts',    'EA Sports and EA Play titles',                          60),
(gen_random_uuid(), 'Blizzard',            'blizzard',           'World of Warcraft, Overwatch and more',                 70),
(gen_random_uuid(), 'Epic Games',          'epic-games',         'Fortnite V-Bucks and Epic Store',                       80),
(gen_random_uuid(), 'Krafton',             'krafton',            'PUBG Mobile and BGMI developer',                        90),
(gen_random_uuid(), 'Ubisoft',             'ubisoft',            'Ubisoft Connect games',                                 100),
(gen_random_uuid(), 'Netflix',             'netflix',            'Video streaming subscriptions',                         110),
(gen_random_uuid(), 'Spotify',             'spotify',            'Music streaming subscriptions',                         120),
(gen_random_uuid(), 'Google',              'google',             'Google Play, YouTube Premium and services',             130),
(gen_random_uuid(), 'Apple',               'apple',              'Apple App Store and iTunes',                            140),
(gen_random_uuid(), 'Amazon',              'amazon',             'Amazon gift cards and Prime',                           150),
(gen_random_uuid(), 'Nord Security',       'nord-security',      'NordVPN and NordPass',                                  160),
(gen_random_uuid(), 'Garena',              'garena',             'Free Fire and Garena games',                            170),
(gen_random_uuid(), 'Supercell',           'supercell',          'Clash of Clans, Brawl Stars',                           180),
(gen_random_uuid(), 'Moonton',             'moonton',            'Mobile Legends: Bang Bang',                             190);

-- ── 4. Map existing seed products to companies ────────────────────────────────
UPDATE products SET company_id = (SELECT id FROM companies WHERE slug='valve-steam')
WHERE brand ILIKE '%steam%' OR brand ILIKE '%valve%';

UPDATE products SET company_id = (SELECT id FROM companies WHERE slug='microsoft-xbox')
WHERE brand ILIKE '%microsoft%' OR brand ILIKE '%xbox%';

UPDATE products SET company_id = (SELECT id FROM companies WHERE slug='riot-games')
WHERE brand ILIKE '%riot%';

UPDATE products SET company_id = (SELECT id FROM companies WHERE slug='krafton')
WHERE brand ILIKE '%krafton%' OR brand ILIKE '%pubg%';

UPDATE products SET company_id = (SELECT id FROM companies WHERE slug='netflix')
WHERE brand ILIKE '%netflix%';

UPDATE products SET company_id = (SELECT id FROM companies WHERE slug='spotify')
WHERE brand ILIKE '%spotify%';

UPDATE products SET company_id = (SELECT id FROM companies WHERE slug='google')
WHERE brand ILIKE '%google%';

UPDATE products SET company_id = (SELECT id FROM companies WHERE slug='nord-security')
WHERE brand ILIKE '%nord%';
