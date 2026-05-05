import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'student') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { token, lat, lon, deviceId } = await req.json();
  if (!token) return NextResponse.json({ error: 'QR token required' }, { status: 400 });
  if (!deviceId || typeof deviceId !== 'string' || deviceId.length < 8) {
    return NextResponse.json({ error: 'Device fingerprint missing — please reload the page and allow storage' }, { status: 400 });
  }

  // Find token
  const { data: qrData } = await supabaseAdmin
    .from('qr_tokens')
    .select('id, token, timetable_id, teacher_id, expires_at, used_at, used_by_student_id, timetable(subject_id, teacher_id, batch)')
    .eq('token', token)
    .single();

  if (!qrData) return NextResponse.json({ error: 'Invalid QR code' }, { status: 400 });

  // Check expiry
  if (new Date(qrData.expires_at) < new Date()) {
    return NextResponse.json({ error: 'QR code has expired' }, { status: 400 });
  }

  // One-time-use guard: this student already scanned this token
  const { data: priorScan } = await supabaseAdmin
    .from('qr_token_scans')
    .select('id')
    .eq('qr_token_id', qrData.id)
    .eq('student_id', session.id)
    .maybeSingle();

  if (priorScan) {
    return NextResponse.json({ error: 'This QR code has already been used by your account' }, { status: 400 });
  }

  // Device binding: register on first use, enforce on subsequent
  const { data: student } = await supabaseAdmin
    .from('students')
    .select('id, device_id')
    .eq('id', session.id)
    .single();

  if (!student) return NextResponse.json({ error: 'Student record not found' }, { status: 404 });

  if (!student.device_id) {
    const { error: regErr } = await supabaseAdmin
      .from('students')
      .update({ device_id: deviceId, device_registered_at: new Date().toISOString() })
      .eq('id', session.id);
    if (regErr) return NextResponse.json({ error: 'Failed to register device' }, { status: 500 });
  } else if (student.device_id !== deviceId) {
    return NextResponse.json({
      error: 'This is not your registered device. Please mark attendance from your registered phone, or contact admin to reset device binding.',
    }, { status: 403 });
  }

  // Check location if provided (within configured coverage)
  if (lat && lon) {
    const { data: settings } = await supabaseAdmin.from('settings').select('lat, lon, coverage').eq('id', 1).single();
    if (settings) {
      const dist = getDistanceKm(lat, lon, settings.lat, settings.lon);
      if (dist > settings.coverage) {
        return NextResponse.json({ error: `You are ${dist.toFixed(2)} km away from campus. Must be within ${settings.coverage} km.` }, { status: 400 });
      }
    }
  }

  const today = new Date().toISOString().split('T')[0];

  // Check duplicate attendance (same class, same day)
  const { data: existing } = await supabaseAdmin
    .from('attendance')
    .select('id')
    .eq('student_id', session.id)
    .eq('timetable_id', qrData.timetable_id)
    .eq('date', today)
    .maybeSingle();

  if (existing) return NextResponse.json({ error: 'Attendance already marked for this class today' }, { status: 400 });

  // Record this scan (locks token for this student)
  const { error: scanErr } = await supabaseAdmin.from('qr_token_scans').insert({
    qr_token_id: qrData.id,
    student_id: session.id,
    device_id: deviceId,
  });
  if (scanErr) return NextResponse.json({ error: 'Failed to record scan' }, { status: 500 });

  // Resolve subject_id from joined timetable (Supabase returns array or object depending on relation)
  const tt = qrData.timetable as unknown as { subject_id?: number } | { subject_id?: number }[] | null;
  const subjectId = Array.isArray(tt) ? tt[0]?.subject_id : tt?.subject_id;

  // Mark attendance
  const { error } = await supabaseAdmin.from('attendance').insert({
    student_id: session.id,
    timetable_id: qrData.timetable_id,
    subject_id: subjectId,
    teacher_id: qrData.teacher_id,
    date: today,
    status: 'present',
    lat: lat || null,
    lon: lon || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Stamp token's first use (audit only — does not block other students within window)
  if (!qrData.used_at) {
    await supabaseAdmin
      .from('qr_tokens')
      .update({ used_at: new Date().toISOString(), used_by_student_id: session.id })
      .eq('id', qrData.id);
  }

  return NextResponse.json({ success: true, message: 'Attendance marked successfully!' });
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
