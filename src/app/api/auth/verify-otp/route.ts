import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { signToken, COOKIE_NAME } from '@/lib/auth';
import { verifyOtp } from '@/lib/otp';

export async function POST(req: NextRequest) {
  const { userId, role, code } = await req.json();

  if (!userId || !role || !code) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  if (role !== 'student') {
    return NextResponse.json({ error: 'OTP not required for this role' }, { status: 400 });
  }
  if (!/^\d{6}$/.test(String(code))) {
    return NextResponse.json({ error: 'Code must be 6 digits' }, { status: 400 });
  }

  const result = await verifyOtp(userId, 'student', String(code));
  if (!result.ok) {
    const map: Record<string, string> = {
      no_code:           'No active code. Please request a new one.',
      expired:           'Code has expired. Please request a new one.',
      too_many_attempts: 'Too many wrong attempts. Please request a new code.',
      invalid:           'Incorrect code. Please try again.',
    };
    return NextResponse.json({ error: map[result.reason] }, { status: 401 });
  }

  // Pull fresh student info so the JWT carries the latest name/enrollment
  const { data: student } = await supabaseAdmin
    .from('students')
    .select('id, name, enrollment_no')
    .eq('id', userId)
    .single();

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  const token = signToken({
    id: student.id,
    role: 'student',
    name: student.name,
    enrollment: student.enrollment_no,
  });

  const response = NextResponse.json({ name: student.name, role: 'student' });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
  return response;
}
