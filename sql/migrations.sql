-- ============================================================
-- Migration: Add Kroger OAuth token columns to profiles
-- Run this in the Supabase SQL Editor
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kroger_access_token text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kroger_refresh_token text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kroger_token_expires_at timestamptz;
