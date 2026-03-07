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
    .select('id, subject_id, teacher_id, day')
    .eq('id', timetable_id)
    .eq('teacher_id', session.id)
    .single();

  if (!slot) return NextResponse.json({ error: 'Timetable slot not found' }, { status: 404 });

  // Only allow QR generation on the correct day
  const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = WEEKDAYS[new Date().getDay()];
  if (slot.day !== todayName) {
    return NextResponse.json({ error: `Cannot generate QR — this class is on ${slot.day}, not today (${todayName})` }, { status: 400 });
  }

  // Read attendance window from settings (default 15 min)
  const { data: settings } = await supabaseAdmin.from('settings').select('attendance_window').eq('id', 1).single();
  const windowMinutes = settings?.attendance_window || 15;

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
