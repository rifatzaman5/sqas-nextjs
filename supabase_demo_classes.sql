-- =============================================
-- DEMO CLASSES — For Exhibition / Anytime QR Generation
-- Adds one "Demo Class" timetable slot per teacher for ALL 7 days
-- Time window: 00:00 - 23:59 (so QR can be generated anytime)
-- Run this in Supabase SQL Editor
-- =============================================

-- 0) Reset auto-increment sequences (seed data inserted with explicit IDs
--    leaves sequences out of sync — this realigns them with current MAX id)
SELECT setval('subjects_id_seq',  COALESCE((SELECT MAX(id) FROM subjects),  1), true);
SELECT setval('timetable_id_seq', COALESCE((SELECT MAX(id) FROM timetable), 1), true);
SELECT setval('teachers_id_seq',  COALESCE((SELECT MAX(id) FROM teachers),  1), true);
SELECT setval('students_id_seq',  COALESCE((SELECT MAX(id) FROM students),  1), true);

-- 1) Add a demo subject for each teacher (so it shows clearly as "Demo")
--    Skips if a demo subject already exists for that teacher
INSERT INTO subjects (name, code, branch, semester, teacher_id)
SELECT
  'Demo Class (Exhibition)',
  'DEMO-' || t.id,
  'Information Technology',
  8,
  t.id
FROM teachers t
WHERE NOT EXISTS (
  SELECT 1 FROM subjects s
  WHERE s.teacher_id = t.id AND s.code LIKE 'DEMO-%'
);

-- 2) Add timetable entries for the demo subject — one row per day per teacher
--    Time: 00:00 - 23:59 → QR generation works at any time
INSERT INTO timetable (subject_id, teacher_id, day, start_time, end_time, room, batch, branch, academic_year)
SELECT
  s.id,
  s.teacher_id,
  d.day_name,
  '00:00',
  '23:59',
  'Demo Lab (Anytime)',
  'BSIT-R0-2022',
  'Information Technology',
  '2025-26'
FROM subjects s
CROSS JOIN (
  VALUES ('Monday'), ('Tuesday'), ('Wednesday'),
         ('Thursday'), ('Friday'), ('Saturday'), ('Sunday')
) AS d(day_name)
WHERE s.code LIKE 'DEMO-%'
  AND NOT EXISTS (
    -- Prevent duplicates if migration is re-run
    SELECT 1 FROM timetable tt
    WHERE tt.subject_id = s.id
      AND tt.teacher_id = s.teacher_id
      AND tt.day = d.day_name
      AND tt.start_time = '00:00'
  );

-- =============================================
-- DONE!
-- Each teacher now has 7 demo slots (Mon-Sun, 00:00-23:59)
-- During exhibition: teacher logs in → Take Attendance → "Demo Class (Exhibition)"
-- → Generate QR works on ANY day at ANY time
-- =============================================

-- To VERIFY (run separately):
-- SELECT t.name AS teacher, s.name AS subject, tt.day, tt.start_time, tt.end_time, tt.room
-- FROM timetable tt
-- JOIN teachers t ON t.id = tt.teacher_id
-- JOIN subjects s ON s.id = tt.subject_id
-- WHERE s.code LIKE 'DEMO-%'
-- ORDER BY t.id, tt.day;

-- To REMOVE demo classes later (if needed):
-- DELETE FROM timetable WHERE subject_id IN (SELECT id FROM subjects WHERE code LIKE 'DEMO-%');
-- DELETE FROM subjects WHERE code LIKE 'DEMO-%';
