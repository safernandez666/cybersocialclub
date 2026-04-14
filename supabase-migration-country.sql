-- Migration: Add country field to members table
-- Run in Supabase SQL Editor
-- Date: 2026-03-31

-- Add country column with default 'Argentina' so existing records are not broken
ALTER TABLE members ADD COLUMN country TEXT NOT NULL DEFAULT 'Argentina';
