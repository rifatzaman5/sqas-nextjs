import { Resend } from 'resend';

let _client: Resend | null = null;

function getClient(): Resend {
  if (_client) return _client;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set');
  _client = new Resend(key);
  return _client;
}

function fromAddress(): string {
  return process.env.EMAIL_FROM || 'SQAS <onboarding@resend.dev>';
}

export async function sendOtpEmail(to: string, name: string, code: string): Promise<void> {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f8fafc;color:#0f172a">
      <div style="background:#063a47;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
        <h1 style="margin:0;font-size:20px">SQAS — Login Verification</h1>
        <p style="margin:4px 0 0;font-size:12px;opacity:0.8">Smart QR Attendance System · University of Sargodha</p>
      </div>
      <div style="background:#fff;padding:24px;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px">
        <p style="margin:0 0 12px;font-size:14px">Hi <strong>${escapeHtml(name)}</strong>,</p>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.5">
          Use the code below to complete your login. This code expires in <strong>5 minutes</strong>.
        </p>
        <div style="background:#f0f9fa;border:1px dashed #1a869a;border-radius:8px;padding:18px;text-align:center;margin:16px 0">
          <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;color:#1a869a;text-transform:uppercase;font-weight:600">Verification Code</p>
          <p style="margin:0;font-size:32px;letter-spacing:8px;font-weight:700;color:#063a47;font-family:'Courier New',monospace">${code}</p>
        </div>
        <p style="margin:16px 0 0;font-size:12px;color:#64748b;line-height:1.5">
          If you did not request this code, someone may be trying to access your account. Contact your admin immediately.
        </p>
      </div>
      <p style="margin:16px 0 0;font-size:11px;color:#94a3b8;text-align:center">
        This is an automated message. Please do not reply.
      </p>
    </div>
  `;

  await getClient().emails.send({
    from: fromAddress(),
    to,
    subject: `Your SQAS login code: ${code}`,
    html,
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
