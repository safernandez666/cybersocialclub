-- ==========================================================================
-- Migration: Social Login (Google + LinkedIn) for CSC Socios
-- Date: 2026-03-17
-- Author: Gonza (Backend)
-- Security review: Male — APPROVED WITH CONDITIONS
--
-- CRITICAL: Execute this migration in Supabase SQL Editor BEFORE
-- deploying the browser client code. RLS policies must be live first.
-- ==========================================================================

-- ── Step 1: Add new columns to members table ──

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS auth_provider      TEXT,          -- 'google', 'linkedin_oidc', NULL (manual registration)
  ADD COLUMN IF NOT EXISTS auth_provider_id   UUID,          -- Supabase Auth user UUID
  ADD COLUMN IF NOT EXISTS last_login_at      TIMESTAMPTZ;   -- Last social login timestamp

-- photo_url may already exist — add only if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE members ADD COLUMN photo_url TEXT;
  END IF;
END $$;


-- ── Step 2: Create indexes ──

CREATE INDEX IF NOT EXISTS idx_members_auth_provider_id
  ON members(auth_provider_id)
  WHERE auth_provider_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_members_email
  ON members(email);


-- ── Step 3: Enable RLS on members table ──
-- CRITICAL: Must be enabled BEFORE deploying browser client (Male review S8)

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Policy: Socios can read their own profile
CREATE POLICY "member_read_own"
  ON members FOR SELECT
  USING (auth_provider_id = auth.uid());

-- Policy: Socios can update their own profile
CREATE POLICY "member_update_own"
  ON members FOR UPDATE
  USING (auth_provider_id = auth.uid())
  WITH CHECK (auth_provider_id = auth.uid());

-- Policy: Service role has full access (for admin operations + API routes)
-- Note: service_role bypasses RLS by default, but explicit policy for clarity
CREATE POLICY "service_role_full_access"
  ON members FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Allow anon users to INSERT (for registration via API route)
-- The API route uses supabase (anon key) for member registration
CREATE POLICY "anon_insert_registration"
  ON members FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Allow anon users to read approved members (public directory)
CREATE POLICY "anon_read_approved"
  ON members FOR SELECT
  TO anon
  USING (status = 'approved');


-- ── Step 4: Create audit_logs table ──

CREATE TABLE IF NOT EXISTS audit_logs (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_type    TEXT NOT NULL,           -- 'social_login'
  event_subtype TEXT NOT NULL,           -- 'login_success', 'provider_conflict_attempt', etc.
  member_id     UUID,                    -- FK to members.id (nullable for failed attempts)
  provider      TEXT,                    -- 'google', 'linkedin_oidc'
  ip_address    TEXT,
  user_agent    TEXT,
  metadata      JSONB,                   -- Extra context (e.g. { existing_provider: 'google' })
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- RLS on audit_logs: only service_role can read/write
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_service_only"
  ON audit_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Index for querying audit logs by member
CREATE INDEX IF NOT EXISTS idx_audit_logs_member_id
  ON audit_logs(member_id)
  WHERE member_id IS NOT NULL;

-- Index for querying audit logs by event type
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type
  ON audit_logs(event_type, created_at DESC);


-- ── Step 5: Verification queries (run after migration) ──
-- Uncomment and run these to verify the migration:

-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'members' ORDER BY ordinal_position;
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('members', 'audit_logs');
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'members';
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'audit_logs';
