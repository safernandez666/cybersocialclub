-- Migration: Tokens out of URL query strings (SEC-HIGH)
-- Date: 2026-04-29
-- Task: c0e5194d
-- Spec: api-contract-tokens-out-of-urls.md
--
-- 1. members.verification_code: 6-digit numeric code that replaces the random
--    verification_token in URLs. The user types it into a form on /verify-email.
-- 2. members.verification_code_attempts: per-row brute-force counter (anti
--    short-code guessing, in addition to per-email rate limit in app code).
-- 3. account_claims.jti: single-use identifier embedded in claim JWTs.
--    Replaces the random hex token in claim URLs (the JWT itself is now
--    delivered in a URL fragment, not a query string).
--
-- Backwards compatibility:
-- - members.verification_token column is NOT dropped here so any in-flight
--   emails sent before this deploy still resolve to a row when admin needs
--   to inspect; the new endpoint only reads verification_code. Drop in a
--   follow-up migration once all in-flight emails (24h TTL) have expired.
-- - account_claims.token kept (now nullable) for the same reason.

BEGIN;

-- 1. members.verification_code
ALTER TABLE members ADD COLUMN IF NOT EXISTS verification_code TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS verification_code_attempts INT NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_members_email_verification_code
  ON members(email, verification_code)
  WHERE verification_code IS NOT NULL;

-- 2. account_claims.jti
ALTER TABLE account_claims ADD COLUMN IF NOT EXISTS jti UUID;
UPDATE account_claims SET jti = gen_random_uuid() WHERE jti IS NULL;
ALTER TABLE account_claims ALTER COLUMN jti SET NOT NULL;

-- Add unique constraint (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'account_claims_jti_unique'
  ) THEN
    ALTER TABLE account_claims ADD CONSTRAINT account_claims_jti_unique UNIQUE (jti);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_account_claims_jti ON account_claims(jti);

-- token column can now be optional (new rows don't use it)
ALTER TABLE account_claims ALTER COLUMN token DROP NOT NULL;

COMMIT;
