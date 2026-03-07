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
  batch TEXT DEFAULT 'BSIT-R0-2022',
  semester SMALLINT DEFAULT 8,
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
  semester SMALLINT DEFAULT 8,
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
  batch TEXT DEFAULT 'BSIT-R0-2022',
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

-- Insert teachers (real Semester 8 teachers)
INSERT INTO teachers (id, name, email, phone, designation, department, subject, password) VALUES
(1, 'Azhar Mushtaq',           'azhar.mushtaq@uos.edu.pk',       '', 'Lecturer', 'Information Technology', 'Cyber Security',                              '$2b$10$pj.5HlXzx5gtaY3uV2fPiuRnUqvHBf6YqIPUdKrXCo7dPEAUQr6dm'),
(2, 'Aoun Abbas',              'aoun.abbas@uos.edu.pk',           '', 'Lecturer', 'Information Technology', 'Database Administration and Management',       '$2b$10$pj.5HlXzx5gtaY3uV2fPiuRnUqvHBf6YqIPUdKrXCo7dPEAUQr6dm'),
(3, 'Faisal Imran',            'faisal.imran@uos.edu.pk',         '', 'Lecturer', 'Information Technology', 'Translation of Holy Quran-IV',                 '$2b$10$pj.5HlXzx5gtaY3uV2fPiuRnUqvHBf6YqIPUdKrXCo7dPEAUQr6dm'),
(4, 'Dr. Khalid Mahmood Aamir','khalid.mahmood@uos.edu.pk',       '', 'Assistant Professor', 'Information Technology', 'Final Year Project-II',           '$2b$10$pj.5HlXzx5gtaY3uV2fPiuRnUqvHBf6YqIPUdKrXCo7dPEAUQr6dm'),
(5, 'Zubair Hanif',            'zubair.hanif@uos.edu.pk',         '', 'Lecturer', 'Information Technology', 'Citizenship',                                  '$2b$10$pj.5HlXzx5gtaY3uV2fPiuRnUqvHBf6YqIPUdKrXCo7dPEAUQr6dm')
ON CONFLICT (id) DO NOTHING;

-- Insert students (will be updated with real list later)
INSERT INTO students (enrollment_no, name, batch, semester, branch, password) VALUES
('220064', 'Sania Nawaz',  'BSIT-R0-2022', 8, 'Information Technology', '$2b$10$pj.5HlXzx5gtaY3uV2fPiuRnUqvHBf6YqIPUdKrXCo7dPEAUQr6dm'),
('220091', 'Sania Saeed',  'BSIT-R0-2022', 8, 'Information Technology', '$2b$10$pj.5HlXzx5gtaY3uV2fPiuRnUqvHBf6YqIPUdKrXCo7dPEAUQr6dm'),
('210051', 'Waqar Ali',    'BSIT-R0-2022', 8, 'Information Technology', '$2b$10$pj.5HlXzx5gtaY3uV2fPiuRnUqvHBf6YqIPUdKrXCo7dPEAUQr6dm')
ON CONFLICT (enrollment_no) DO NOTHING;

-- Insert subjects (real Semester 8 subjects)
INSERT INTO subjects (id, name, code, branch, semester, teacher_id) VALUES
(1, 'Cyber Security',                              'ITCC-402',   'Information Technology', 8, 1),
(2, 'Database Administration and Management',       'ITCC-406',   'Information Technology', 8, 2),
(3, 'Translation of Holy Quran-IV',                 'URCG-5111',  'Information Technology', 8, 3),
(4, 'Final Year Project-II',                        'CMPC-402',   'Information Technology', 8, 4),
(5, 'Citizenship',                                  'URCC-1010',  'Information Technology', 8, 5)
ON CONFLICT (id) DO NOTHING;

-- Insert timetable (real Semester 8 schedule - BS IT Regular 0, 2022-2026)
INSERT INTO timetable (subject_id, teacher_id, day, start_time, end_time, room, batch, branch, academic_year) VALUES
-- Monday
(1, 1, 'Monday',    '10:00', '11:00', 'MAB CR-168',                   'BSIT-R0-2022', 'Information Technology', '2025-26'),
(2, 2, 'Monday',    '11:00', '12:00', 'MAB CyberL-05 (FYP Lab)',      'BSIT-R0-2022', 'Information Technology', '2025-26'),
-- Tuesday
(2, 2, 'Tuesday',   '08:00', '09:00', 'MAB L-01',                     'BSIT-R0-2022', 'Information Technology', '2025-26'),
(3, 3, 'Tuesday',   '10:50', '11:30', 'Physics Hall',                  'BSIT-R0-2022', 'Information Technology', '2025-26'),
(4, 4, 'Tuesday',   '11:30', '12:30', 'MAB CR-170',                   'BSIT-R0-2022', 'Information Technology', '2025-26'),
-- Wednesday
(2, 2, 'Wednesday', '09:00', '10:00', 'MAB CR-167',                   'BSIT-R0-2022', 'Information Technology', '2025-26'),
(5, 5, 'Wednesday', '11:40', '12:40', 'MAB CR-169',                   'BSIT-R0-2022', 'Information Technology', '2025-26'),
(1, 1, 'Wednesday', '12:40', '13:40', 'MAB CR-168',                   'BSIT-R0-2022', 'Information Technology', '2025-26'),
-- Thursday
(4, 4, 'Thursday',  '11:00', '12:00', 'MAB CR-170',                   'BSIT-R0-2022', 'Information Technology', '2025-26'),
(5, 5, 'Thursday',  '12:00', '13:00', 'Maryam Hall CR-5',             'BSIT-R0-2022', 'Information Technology', '2025-26'),
-- Friday
(2, 2, 'Friday',    '09:00', '10:00', 'MAB CR-167',                   'BSIT-R0-2022', 'Information Technology', '2025-26');

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
