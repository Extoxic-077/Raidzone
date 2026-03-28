-- V5: Seed admin user
-- Password: admin123  (BCrypt strength 10)
INSERT INTO users (id, email, name, phone, nickname, password_hash, role, provider, is_email_verified, is_active, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'admin@hashvault.com',
    'HashVault Admin',
    NULL,
    'admin',
    '$2b$10$MfQQfafuiDpmsvtqEa/eEOqSmaQWbC8OAhxA99ZI03jvVtEN311HC',
    'ADMIN',
    'LOCAL',
    TRUE,
    TRUE,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;
