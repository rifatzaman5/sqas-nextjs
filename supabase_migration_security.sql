-- =============================================
-- Security Migration: Device Binding + QR One-Time Use
-- Run this in Supabase SQL Editor (safe to re-run)
-- =============================================

-- 1) Device binding columns on students
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS device_id TEXT,
  ADD COLUMN IF NOT EXISTS device_registered_at TIMESTAMPTZ;

-- 2) QR one-time-use tracking on qr_tokens
ALTER TABLE qr_tokens
  ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS used_by_student_id INTEGER REFERENCES students(id) ON DELETE SET NULL;

-- 3) Per-student-per-token scan ledger (prevents same student replaying same QR)
CREATE TABLE IF NOT EXISTS qr_token_scans (
  id SERIAL PRIMARY KEY,
  qr_token_id INTEGER REFERENCES qr_tokens(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  device_id TEXT,
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(qr_token_id, student_id)
);

-- RLS for the new table (service role full access, matches existing pattern)
ALTER TABLE qr_token_scans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all" ON qr_token_scans;
CREATE POLICY "service_role_all" ON qr_token_scans FOR ALL USING (true);

-- 4) Tighten default attendance_window to 5 minutes for new installs
--    (existing rows untouched — admin can change via Settings page)
ALTER TABLE settings ALTER COLUMN attendance_window SET DEFAULT 5;
