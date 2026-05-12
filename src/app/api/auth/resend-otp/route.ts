import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createOtp, getResendCooldown, maskEmail } from '@/lib/otp';
import { sendOtpEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  const { userId, role } = await req.json();

  if (!userId || role !== 'student') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const cooldown = await getResendCooldown(userId, 'student');
  if (cooldown > 0) {
    return NextResponse.json({ error: `Please wait ${cooldown}s before requesting a new code.` }, { status: 429 });
  }

  const { data: student } = await supabaseAdmin
    .from('students')
    .select('id, name, email')
    .eq('id', userId)
    .single();

  if (!student || !student.email) {
    return NextResponse.json({ error: 'Student not found or missing email' }, { status: 404 });
  }

  try {
    const code = await createOtp(student.id, 'student');
    await sendOtpEmail(student.email, student.name, code);
  } catch (err) {
    console.error('Resend OTP failed:', err);
    return NextResponse.json({ error: 'Could not send verification code. Try again.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, maskedEmail: maskEmail(student.email) });
}
