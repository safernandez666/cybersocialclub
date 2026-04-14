-- Migration: Verification token expiration
-- Date: 2026-04-10
-- P0 fix: tokens must expire after 24h to prevent indefinite reuse

-- 1. Add verification_token_expires_at column
ALTER TABLE members ADD COLUMN IF NOT EXISTS verification_token_expires_at TIMESTAMPTZ;

-- 2. Backfill existing tokens: set expiry to 24h from now (so pending verifications still work)
UPDATE members
SET verification_token_expires_at = NOW() + INTERVAL '24 hours'
WHERE verification_token IS NOT NULL
  AND verification_token_expires_at IS NULL;
