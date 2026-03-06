import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  const subject_id = searchParams.get('subject_id');
  const student_id_param = searchParams.get('student_id');
  const teacher_id_param = searchParams.get('teacher_id');

  // ?totals=1 → return per-subject total classes held (aggregate, no personal data)
  if (searchParams.get('totals') === '1') {
    const { data, error } = await supabaseAdmin
      .from('attendance')
      .select('subject_id, date, subjects(name, code)');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    // Count distinct dates per subject
    const map: Record<number, { subject_id: number; name: string; code: string; total: number }> = {};
    const seen = new Set<string>();
    for (const row of (data || [])) {
      const key = `${row.subject_id}-${row.date}`;
      if (!seen.has(key)) {
        seen.add(key);
        const sid = row.subject_id as number;
        if (!map[sid]) map[sid] = { subject_id: sid, name: (row.subjects as unknown as {name:string;code:string})?.name || '', code: (row.subjects as unknown as {name:string;code:string})?.code || '', total: 0 };
        map[sid].total++;
      }
    }
    return NextResponse.json(Object.values(map));
  }

  let query = supabaseAdmin
    .from('attendance')
    .select('*, students(name, enrollment_no), subjects(name, code), teachers(name), timetable(day, start_time, end_time)')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  // Role-based data isolation — critical security fix
  if (session.role === 'student') {
    query = query.eq('student_id', session.id);
  } else if (session.role === 'teacher') {
    query = query.eq('teacher_id', session.id);
    if (date) query = query.eq('date', date);
    if (student_id_param) query = query.eq('student_id', student_id_param);
    if (subject_id) query = query.eq('subject_id', subject_id);
  } else {
    // Admin: full access with optional filters
    if (date) query = query.eq('date', date);
    if (student_id_param) query = query.eq('student_id', student_id_param);
    if (teacher_id_param) query = query.eq('teacher_id', teacher_id_param);
    if (subject_id) query = query.eq('subject_id', subject_id);
  }

  const { data, error } = await query.limit(1000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
