import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'teacher') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { timetable_id } = await req.json();
  if (!timetable_id) return NextResponse.json({ error: 'timetable_id required' }, { status: 400 });

  // Verify timetable belongs to this teacher
  const { data: slot } = await supabaseAdmin
    .from('timetable')
    .select('id, subject_id, teacher_id, day, start_time, end_time')
    .eq('id', timetable_id)
    .eq('teacher_id', session.id)
    .single();

  if (!slot) return NextResponse.json({ error: 'Timetable slot not found' }, { status: 404 });

  // Compute time in Pakistan timezone (Vercel runs in UTC by default — without
  // this, an 8 AM class in Lahore would be checked against 3 AM UTC and fail).
  const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const pkParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const todayName = pkParts.find(p => p.type === 'weekday')?.value || '';
  const pkHour    = parseInt(pkParts.find(p => p.type === 'hour')?.value || '0', 10);
  const pkMinute  = parseInt(pkParts.find(p => p.type === 'minute')?.value || '0', 10);
  // 'en-US' with hour12:false returns '24' for midnight — normalize to 0
  const safeHour = pkHour === 24 ? 0 : pkHour;

  if (slot.day !== todayName) {
    return NextResponse.json({ error: `Cannot generate QR — this class is on ${slot.day}, not today (${todayName})` }, { status: 400 });
  }

  // Time-window guard: only allow during the class period (with small grace before/after).
  const EARLY_GRACE_MIN = 10;
  const LATE_GRACE_MIN  = 15;
  const toMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };
  const nowMins   = safeHour * 60 + pkMinute;
  const startMins = toMinutes(slot.start_time);
  const endMins   = toMinutes(slot.end_time);
  const fmt = (mins: number) => `${Math.floor(mins / 60).toString().padStart(2, '0')}:${(mins % 60).toString().padStart(2, '0')}`;
  if (nowMins < startMins - EARLY_GRACE_MIN) {
    return NextResponse.json({
      error: `Too early — this class starts at ${slot.start_time}. QR can be generated from ${fmt(startMins - EARLY_GRACE_MIN)} onwards.`,
    }, { status: 400 });
  }
  if (nowMins > endMins + LATE_GRACE_MIN) {
    return NextResponse.json({
      error: `Class is over — ended at ${slot.end_time}. QR generation closed at ${fmt(endMins + LATE_GRACE_MIN)}.`,
    }, { status: 400 });
  }

  // Read attendance window from settings (default 15 min)
  const { data: settings } = await supabaseAdmin.from('settings').select('attendance_window').eq('id', 1).single();
  let windowMinutes = settings?.attendance_window || 15;

  // Cap the QR validity so it never extends past class-end + late grace
  const maxRemainingMins = Math.max(1, (endMins + LATE_GRACE_MIN) - nowMins);
  if (windowMinutes > maxRemainingMins) windowMinutes = maxRemainingMins;

  // Generate unique token
  const token = `SQAS-${timetable_id}-${Date.now()}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
  const expires_at = new Date(Date.now() + windowMinutes * 60 * 1000).toISOString();

  // Delete old tokens for this slot
  await supabaseAdmin.from('qr_tokens').delete().eq('timetable_id', timetable_id);

  // Insert new token
  const { data, error } = await supabaseAdmin
    .from('qr_tokens')
    .insert({ token, timetable_id, teacher_id: session.id, expires_at })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ token: data.token, expires_at: data.expires_at, window_minutes: windowMinutes });
}
