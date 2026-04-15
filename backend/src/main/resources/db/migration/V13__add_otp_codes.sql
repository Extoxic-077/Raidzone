-- V13: OTP codes table for email verification and login

CREATE TABLE IF NOT EXISTS otp_codes (
    id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code        VARCHAR(6)  NOT NULL,
    purpose     VARCHAR(20) NOT NULL DEFAULT 'LOGIN',   -- LOGIN | REGISTER
    expires_at  TIMESTAMPTZ NOT NULL,
    used        BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_otp_codes_lookup
    ON otp_codes (user_id, purpose, used, expires_at);

COMMENT ON TABLE otp_codes IS 'One-time password codes for email-based 2FA and account verification';
COMMENT ON COLUMN otp_codes.purpose IS 'LOGIN = login OTP, REGISTER = email verification after signup';
