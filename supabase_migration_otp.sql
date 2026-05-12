-- =============================================
-- OTP Migration: Email-based OTP for student login
-- Run this in Supabase SQL Editor (safe to re-run)
-- =============================================

-- 1) Ensure email column exists and is required for students
--    (existing rows with NULL email will need to be filled in by admin first)
ALTER TABLE students
  ALTER COLUMN email SET NOT NULL;

-- 2) OTP codes table — stores hashed OTPs with expiry
CREATE TABLE IF NOT EXISTS otp_codes (
  id          BIGSERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  code_hash   TEXT NOT NULL,
  channel     TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'sms')),
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  attempts    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookup for the most recent unused OTP per user
CREATE INDEX IF NOT EXISTS otp_codes_user_lookup_idx
  ON otp_codes (user_id, role, used, expires_at DESC);

-- 3) RLS — service role full access (matches existing pattern)
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all" ON otp_codes;
CREATE POLICY "service_role_all" ON otp_codes FOR ALL USING (true);

-- 4) Optional: auto-cleanup of expired OTPs older than 1 day
--    (run this once or schedule via Supabase cron)
-- DELETE FROM otp_codes WHERE expires_at < NOW() - INTERVAL '1 day';
