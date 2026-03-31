-- Migration: Login y Claim Account
-- Date: 2026-03-31
-- Spec: spec-login-portal-csc.md

-- 1. Table: account_claims (track magic link claims for existing members)
CREATE TABLE IF NOT EXISTS account_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id),
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  claimed_at TIMESTAMPTZ,        -- NULL until used
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for token lookup (used in verify + complete)
CREATE INDEX idx_account_claims_token ON account_claims(token);
-- Index for member lookup (limit active claims per member)
CREATE INDEX idx_account_claims_member ON account_claims(member_id);

-- RLS: only service_role can read/write (tokens are sensitive)
ALTER TABLE account_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only" ON account_claims
  FOR ALL USING (auth.role() = 'service_role');
