import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';
import { signToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { role, username, password } = await req.json();

  if (!role || !username || !password) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  let user: { id: string | number; name: string; passwordHash: string } | null = null;
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
      .select('id, name, password, enrollment_no')
      .eq('enrollment_no', username)
      .single();
    if (data) {
      user = { id: data.id, name: data.name, passwordHash: data.password };
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

  const token = signToken({ id: user.id, role: role as 'admin' | 'teacher' | 'student', name: user.name, enrollment });

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
