import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const teacher_id = searchParams.get('teacher_id');
  const batch = searchParams.get('batch');
  const academic_year = searchParams.get('academic_year');

  let query = supabaseAdmin
    .from('timetable')
    .select('*, subjects(name, code), teachers(name)')
    .order('day')
    .order('start_time');

  // Teachers only see their own timetable
  if (session.role === 'teacher') {
    query = query.eq('teacher_id', session.id);
  } else {
    if (teacher_id) query = query.eq('teacher_id', teacher_id);
  }

  if (batch) query = query.eq('batch', batch);
  if (academic_year) query = query.eq('academic_year', academic_year);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();

  // Sanity: end_time must be strictly after start_time
  if (body.start_time && body.end_time && String(body.end_time) <= String(body.start_time)) {
    return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
  }

  // Prevent room or teacher double-booking on the same day with overlapping time
  if (body.day && body.start_time && body.end_time) {
    const { data: clash } = await supabaseAdmin
      .from('timetable')
      .select('id, room, teacher_id, batch, start_time, end_time, subjects(name, code)')
      .eq('day', body.day)
      .or(`room.eq.${body.room},teacher_id.eq.${body.teacher_id},batch.eq.${body.batch}`);
    const overlap = (clash || []).find((s) => {
      const sameRoom = s.room === body.room;
      const sameTeacher = s.teacher_id === body.teacher_id;
      const sameBatch = s.batch === body.batch;
      const overlaps = String(s.start_time) < String(body.end_time) && String(s.end_time) > String(body.start_time);
      return overlaps && (sameRoom || sameTeacher || sameBatch);
    });
    if (overlap) {
      const reason = overlap.room === body.room ? `room ${overlap.room} is busy`
                   : overlap.teacher_id === body.teacher_id ? 'teacher already has a class'
                   : `batch ${overlap.batch} already has a class`;
      return NextResponse.json({ error: `Time conflict: ${reason} on ${body.day} ${overlap.start_time}–${overlap.end_time}` }, { status: 400 });
    }
  }

  const { data, error } = await supabaseAdmin
    .from('timetable')
    .insert(body)
    .select('*, subjects(name, code), teachers(name)')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await req.json();
  const { error } = await supabaseAdmin.from('timetable').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
