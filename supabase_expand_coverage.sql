-- =============================================
-- EXPAND COVERAGE: Lahore + Islamabad + Sargodha
-- Sets geofence center between cities with 200 km radius
-- Covers all 3 major cities for exhibition demo
-- =============================================

UPDATE settings
SET
  lat = 32.5950,         -- Midpoint between Lahore & Islamabad
  lon = 73.7000,         -- Central Punjab/KP region
  coverage = 200,        -- 200 km radius (covers Lahore + Islamabad + Sargodha)
  university_name = 'University of Sargodha',
  address = 'Demo Coverage: Lahore, Islamabad, Sargodha & surroundings',
  attendance_window = 15 -- 15 min QR validity (demo-friendly)
WHERE id = 1;

-- Verify the update
SELECT
  lat AS center_latitude,
  lon AS center_longitude,
  coverage AS radius_km,
  university_name,
  address,
  attendance_window AS qr_validity_minutes
FROM settings
WHERE id = 1;

-- =============================================
-- VERIFICATION: Approximate distances from center (32.5950, 73.7000):
--   • Lahore     (31.5204, 74.3587)  ≈ 134 km ✅
--   • Islamabad  (33.6844, 73.0479)  ≈ 135 km ✅
--   • Sargodha   (32.0740, 72.6861)  ≈ 111 km ✅
--   • Rawalpindi (33.5651, 73.0169)  ≈ 122 km ✅
--   • Gujranwala (32.1877, 74.1945)  ≈ 60 km ✅
--   • Faisalabad (31.4180, 73.0791)  ≈ 145 km ✅
-- All within 200 km — geofence will accept attendance from any of these!
-- =============================================
