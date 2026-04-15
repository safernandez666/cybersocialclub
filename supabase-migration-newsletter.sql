-- Newsletter subscribers table for CSC landing page
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'unsubscribed'))
);

-- Index for status queries (e.g. export active subscribers)
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscribers (status);

-- RLS: service role key bypasses RLS, so we enable it but add no policies
-- This means the table is inaccessible from the browser (anon key)
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Optional: admin read-only policy (uncomment if needed for dashboard)
-- CREATE POLICY "Admin read newsletter" ON newsletter_subscribers
--   FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
