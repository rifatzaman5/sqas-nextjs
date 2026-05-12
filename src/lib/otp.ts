import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

const OTP_TTL_MINUTES = 5;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 30;

export type OtpRole = 'student' | 'teacher' | 'admin';

export function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

/**
 * Invalidate any active OTPs for this user, then insert a new one.
 * Returns the plaintext code so the caller can email it.
 */
export async function createOtp(userId: number | string, role: OtpRole): Promise<string> {
  const code = generateOtp();
  const code_hash = await bcrypt.hash(code, 8);
  const expires_at = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();

  // Mark previous unused OTPs as used so a stale code can't be reused
  await supabaseAdmin
    .from('otp_codes')
    .update({ used: true })
    .eq('user_id', userId)
    .eq('role', role)
    .eq('used', false);

  const { error } = await supabaseAdmin
    .from('otp_codes')
    .insert({ user_id: userId, role, code_hash, channel: 'email', expires_at });

  if (error) throw new Error(`Failed to create OTP: ${error.message}`);
  return code;
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: 'no_code' | 'expired' | 'too_many_attempts' | 'invalid' };

export async function verifyOtp(userId: number | string, role: OtpRole, code: string): Promise<VerifyResult> {
  const { data } = await supabaseAdmin
    .from('otp_codes')
    .select('id, code_hash, expires_at, attempts')
    .eq('user_id', userId)
    .eq('role', role)
    .eq('used', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!data) return { ok: false, reason: 'no_code' };

  const row = data as { id: number; code_hash: string; expires_at: string; attempts: number };

  if (new Date(row.expires_at).getTime() < Date.now()) {
    await supabaseAdmin.from('otp_codes').update({ used: true }).eq('id', row.id);
    return { ok: false, reason: 'expired' };
  }

  if (row.attempts >= MAX_ATTEMPTS) {
    await supabaseAdmin.from('otp_codes').update({ used: true }).eq('id', row.id);
    return { ok: false, reason: 'too_many_attempts' };
  }

  const match = await bcrypt.compare(code, row.code_hash);
  if (!match) {
    await supabaseAdmin.from('otp_codes').update({ attempts: row.attempts + 1 }).eq('id', row.id);
    return { ok: false, reason: 'invalid' };
  }

  await supabaseAdmin.from('otp_codes').update({ used: true }).eq('id', row.id);
  return { ok: true };
}

/**
 * Returns seconds remaining in cooldown, or 0 if the user can request a new OTP.
 */
export async function getResendCooldown(userId: number | string, role: OtpRole): Promise<number> {
  const { data } = await supabaseAdmin
    .from('otp_codes')
    .select('created_at')
    .eq('user_id', userId)
    .eq('role', role)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!data) return 0;
  const elapsed = (Date.now() - new Date((data as { created_at: string }).created_at).getTime()) / 1000;
  return Math.max(0, Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed));
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(1, local.length - 2))}@${domain}`;
}
