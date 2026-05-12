import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';
import { signToken, COOKIE_NAME } from '@/lib/auth';
import { createOtp, maskEmail } from '@/lib/otp';
import { sendOtpEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  const { role, username, password } = await req.json();

  if (!role || !username || !password) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  let user: { id: string | number; name: string; passwordHash: string; email?: string | null } | null = null;
  let enrollment: string | undefined;

  if (role === 'admin') {
    const { data } = await supabaseAdmin
      .from('admins')
      .select('id, username, password')
      .eq('username', username)
      .single();
    if (data) user = { id: data.id, name: data.username, passwordHash: data.password };
  } else if (role === 'teacher') {
    const { data } = await supabaseAdmin
      .from('teachers')
      .select('id, name, password')
      .eq('id', parseInt(username))
      .single();
    if (data) user = { id: data.id, name: data.name, passwordHash: data.password };
  } else if (role === 'student') {
    const { data } = await supabaseAdmin
      .from('students')
      .select('id, name, password, enrollment_no, email')
      .eq('enrollment_no', username)
      .single();
    if (data) {
      user = { id: data.id, name: data.name, passwordHash: data.password, email: data.email };
      enrollment = data.enrollment_no;
    }
  }

  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // ── Students must complete OTP before a session cookie is issued ──
  if (role === 'student') {
    if (!user.email) {
      return NextResponse.json(
        { error: 'No email on file. Please contact your admin to add your email address.' },
        { status: 400 }
      );
    }

    try {
      const code = await createOtp(user.id as number, 'student');
      await sendOtpEmail(user.email, user.name, code);
    } catch (err) {
      console.error('OTP send failed:', err);
      return NextResponse.json({ error: 'Could not send verification code. Try again.' }, { status: 500 });
    }

    return NextResponse.json({
      otpRequired: true,
      userId: user.id,
      role: 'student',
      name: user.name,
      maskedEmail: maskEmail(user.email),
    });
  }

  // ── Admin / Teacher: existing direct-login flow ──
  const token = signToken({ id: user.id, role: role as 'admin' | 'teacher', name: user.name, enrollment });

  const response = NextResponse.json({ name: user.name, role });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
  return response;
}
