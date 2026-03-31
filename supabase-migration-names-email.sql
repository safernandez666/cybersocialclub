-- Migration: member_number unique, email case-insensitive, first/last name
-- Date: 2026-03-31
-- Spec: spec-member-number-email-names-csc.md

-- 1. UNIQUE constraint on member_number (partial: allows NULLs for pending members)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_members_member_number_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_members_member_number_unique ON members(member_number)
      WHERE member_number IS NOT NULL;
  END IF;
END $$;

-- 2. Case-insensitive email uniqueness
-- Replace existing index with LOWER() version
DROP INDEX IF EXISTS idx_members_email;
CREATE UNIQUE INDEX idx_members_email ON members(LOWER(email));

-- 3. Add first_name and last_name columns (nullable for backwards compat)
ALTER TABLE members ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS last_name TEXT;
