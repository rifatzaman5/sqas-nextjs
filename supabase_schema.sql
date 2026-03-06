-- Smart Attendance System using QR Scanning (SQAS)
-- Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  designation TEXT DEFAULT 'Lecturer',
  department TEXT DEFAULT 'Information Technology',
  subject TEXT,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  enrollment_no TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  batch TEXT DEFAULT 'F22',
  semester SMALLINT DEFAULT 5,
  branch TEXT DEFAULT 'Information Technology',
  email TEXT,
  phone TEXT,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  branch TEXT DEFAULT 'Information Technology',
  semester SMALLINT DEFAULT 5,
  teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Timetable table
CREATE TABLE IF NOT EXISTS timetable (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id INTEGER REFERENCES teachers(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  room TEXT DEFAULT 'Lab-1',
  batch TEXT DEFAULT 'F22',
  branch TEXT DEFAULT 'Information Technology',
  academic_year TEXT DEFAULT '2025-26',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  timetable_id INTEGER REFERENCES timetable(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
  date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'present',
  lat DECIMAL(10,7),
  lon DECIMAL(10,7),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, timetable_id, date)
);

-- QR Tokens table
CREATE TABLE IF NOT EXISTS qr_tokens (
  id SERIAL PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  timetable_id INTEGER REFERENCES timetable(id) ON DELETE CASCADE,
  teacher_id INTEGER REFERENCES teachers(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  university_name TEXT DEFAULT 'University of Sargodha',
  address TEXT DEFAULT 'Sargodha Campus, Sargodha',
  lat DECIMAL(10,7) DEFAULT 32.5785,
  lon DECIMAL(10,7) DEFAULT 74.0828,
  coverage DECIMAL(5,2) DEFAULT 0.5,
  attendance_window INTEGER DEFAULT 15
);

-- =============================================
-- SEED DATA
-- =============================================
-- Password for all: 123 (bcrypt hash)
-- $2b$10$pj.5HlXzx5gtaY3uV2fPiuRnUqvHBf6YqIPUdKrXCo7dPEAUQr6dm

-- Insert admin
INSERT INTO admins (username, password) VALUES
('admin', '$2b$10$pj.5HlXzx5gtaY3uV2fPiuRnUqvHBf6YqIPUdKrXCo7dPEAUQr6dm')
ON CONFLICT (username) DO NOTHING;

-- Insert teacher
INSERT INTO teachers (id, name, email, phone, designation, department, subject, password) VALUES
(1, 'Dr. Muhammad Ali Raza', 'ali.raza@uos.edu.pk', '0300-1234567', 'Assistant Professor', 'Information Technology', 'Software Engineering', '$2b$10$pj.5HlXzx5gtaY3uV2fPiuRnUqvHBf6YqIPUdKrXCo7dPEAUQr6dm')
ON CONFLICT (id) DO NOTHING;

-- Insert students
INSERT INTO students (enrollment_no, name, batch, semester, branch, password) VALUES
('220064', 'Sania Nawaz', 'F22', 5, 'Information Technology', '$2b$10$pj.5HlXzx5gtaY3uV2fPiuRnUqvHBf6YqIPUdKrXCo7dPEAUQr6dm'),
('220091', 'Sania Saeed', 'F22', 5, 'Information Technology', '$2b$10$pj.5HlXzx5gtaY3uV2fPiuRnUqvHBf6YqIPUdKrXCo7dPEAUQr6dm'),
('210051', 'Waqar Ali', 'F21', 5, 'Information Technology', '$2b$10$pj.5HlXzx5gtaY3uV2fPiuRnUqvHBf6YqIPUdKrXCo7dPEAUQr6dm')
ON CONFLICT (enrollment_no) DO NOTHING;

-- Insert subjects
INSERT INTO subjects (id, name, code, branch, semester, teacher_id) VALUES
(1, 'Software Engineering', 'SE-501', 'Information Technology', 5, 1),
(2, 'Computer Networks', 'CN-502', 'Information Technology', 5, 1),
(3, 'Artificial Intelligence', 'AI-503', 'Information Technology', 5, 1),
(4, 'Database Systems', 'DBS-504', 'Information Technology', 5, 1),
(5, 'Web Technologies', 'WT-505', 'Information Technology', 5, 1)
ON CONFLICT (id) DO NOTHING;

-- Insert timetable
INSERT INTO timetable (subject_id, teacher_id, day, start_time, end_time, room, batch, branch, academic_year) VALUES
(1, 1, 'Monday',    '08:00', '09:00', 'Lab-1', 'F22', 'Information Technology', '2025-26'),
(2, 1, 'Monday',    '09:00', '10:00', 'Lab-1', 'F22', 'Information Technology', '2025-26'),
(3, 1, 'Monday',    '10:00', '11:00', 'Lab-1', 'F22', 'Information Technology', '2025-26'),
(4, 1, 'Tuesday',   '08:00', '09:00', 'Lab-1', 'F22', 'Information Technology', '2025-26'),
(5, 1, 'Tuesday',   '09:00', '10:00', 'Lab-1', 'F22', 'Information Technology', '2025-26'),
(1, 1, 'Tuesday',   '10:00', '11:00', 'Lab-1', 'F22', 'Information Technology', '2025-26'),
(2, 1, 'Wednesday', '08:00', '09:00', 'Lab-1', 'F22', 'Information Technology', '2025-26'),
(3, 1, 'Wednesday', '09:00', '10:00', 'Lab-1', 'F22', 'Information Technology', '2025-26'),
(4, 1, 'Wednesday', '10:00', '11:00', 'Lab-1', 'F22', 'Information Technology', '2025-26'),
(5, 1, 'Thursday',  '08:00', '09:00', 'Lab-1', 'F22', 'Information Technology', '2025-26'),
(1, 1, 'Thursday',  '09:00', '10:00', 'Lab-1', 'F22', 'Information Technology', '2025-26'),
(2, 1, 'Thursday',  '10:00', '11:00', 'Lab-1', 'F22', 'Information Technology', '2025-26'),
(3, 1, 'Friday',    '08:00', '09:00', 'Lab-1', 'F22', 'Information Technology', '2025-26'),
(4, 1, 'Friday',    '09:00', '10:00', 'Lab-1', 'F22', 'Information Technology', '2025-26'),
(5, 1, 'Friday',    '10:00', '11:00', 'Lab-1', 'F22', 'Information Technology', '2025-26');

-- Insert settings
INSERT INTO settings (university_name, address, lat, lon, coverage, attendance_window)
VALUES ('University of Sargodha', 'University Road, Sargodha, Punjab, Pakistan', 32.0740, 72.6861, 0.5, 15)
ON CONFLICT DO NOTHING;

-- Update settings to UoS if already inserted
UPDATE settings SET
  university_name = 'University of Sargodha',
  address = 'University Road, Sargodha, Punjab, Pakistan',
  lat = 32.0740,
  lon = 72.6861
WHERE id = 1;

-- Enable Row Level Security (disable for simplicity with service role)
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (used by API routes)
DROP POLICY IF EXISTS "service_role_all" ON admins;
DROP POLICY IF EXISTS "service_role_all" ON teachers;
DROP POLICY IF EXISTS "service_role_all" ON students;
DROP POLICY IF EXISTS "service_role_all" ON subjects;
DROP POLICY IF EXISTS "service_role_all" ON timetable;
DROP POLICY IF EXISTS "service_role_all" ON attendance;
DROP POLICY IF EXISTS "service_role_all" ON qr_tokens;
DROP POLICY IF EXISTS "service_role_all" ON settings;

CREATE POLICY "service_role_all" ON admins FOR ALL USING (true);
CREATE POLICY "service_role_all" ON teachers FOR ALL USING (true);
CREATE POLICY "service_role_all" ON students FOR ALL USING (true);
CREATE POLICY "service_role_all" ON subjects FOR ALL USING (true);
CREATE POLICY "service_role_all" ON timetable FOR ALL USING (true);
CREATE POLICY "service_role_all" ON attendance FOR ALL USING (true);
CREATE POLICY "service_role_all" ON qr_tokens FOR ALL USING (true);
CREATE POLICY "service_role_all" ON settings FOR ALL USING (true);

-- Fix passwords: ensure all accounts use hash for "123"
UPDATE admins  SET password = '$2b$10$pj.5HlXzx5gtaY3uV2fPiuRnUqvHBf6YqIPUdKrXCo7dPEAUQr6dm';
UPDATE teachers SET password = '$2b$10$pj.5HlXzx5gtaY3uV2fPiuRnUqvHBf6YqIPUdKrXCo7dPEAUQr6dm';
UPDATE students SET password = '$2b$10$pj.5HlXzx5gtaY3uV2fPiuRnUqvHBf6YqIPUdKrXCo7dPEAUQr6dm';
