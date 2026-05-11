'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  FaShieldHalved, FaChalkboardUser, FaGraduationCap,
  FaQrcode, FaEye, FaEyeSlash, FaArrowRightLong,
  FaLocationDot, FaBuildingColumns,
} from 'react-icons/fa6';

const ROLES = [
  { key: 'admin',   label: 'Admin',   icon: <FaShieldHalved /> },
  { key: 'teacher', label: 'Teacher', icon: <FaChalkboardUser /> },
  { key: 'student', label: 'Student', icon: <FaGraduationCap /> },
] as const;

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] flex items-center justify-center text-slate-500">Loading…</div>}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next'); // deep-link after login (e.g. /student/mark-attendance?token=XXX)
  const [form, setForm] = useState({ role: 'student' as 'admin' | 'teacher' | 'student', username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Welcome, ${data.name}!`);
        // If a "next" URL was provided (e.g. from a QR deep-link) and the user
        // logged in with the matching role, bounce them there. Otherwise default
        // to the role dashboard.
        const goNext =
          next &&
          (form.role === 'student' ? next.startsWith('/student') :
           form.role === 'teacher' ? next.startsWith('/teacher') :
           next.startsWith('/admin'));
        router.push(goNext ? next : `/${form.role}`);
        router.refresh();
      } else {
        toast.error(data.error || 'Login failed');
      }
    } catch {
      toast.error('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-900 flex flex-col lg:flex-row">
      {/* ─── Left: Brand panel (desktop) / Top header (mobile) ─── */}
      <aside className="lg:w-[44%] xl:w-[40%] bg-[#063a47] text-white relative overflow-hidden flex-shrink-0">
        {/* Subtle, non-animated geometric texture (no blobs) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-20 -right-16 w-64 h-64 lg:w-80 lg:h-80 rounded-full bg-[#1a869a]/30 pointer-events-none"
        />

        <div className="relative h-full flex flex-col justify-between p-6 lg:p-10 xl:p-14 min-h-[180px] lg:min-h-screen">
          {/* Top: logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 lg:w-12 lg:h-12 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center">
              <FaQrcode className="text-xl lg:text-2xl" />
            </div>
            <div>
              <p className="font-bold text-lg lg:text-xl tracking-tight">SQAS</p>
              <p className="text-white/60 text-[11px] lg:text-xs leading-none mt-0.5">Smart QR Attendance System</p>
            </div>
          </div>

          {/* Middle: tagline (desktop only) */}
          <div className="hidden lg:block max-w-md">
            <p className="text-xs uppercase tracking-[0.18em] text-[#a8c243] font-semibold mb-3">
              University of Sargodha
            </p>
            <h1 className="text-3xl xl:text-4xl font-bold leading-tight mb-3">
              Mark attendance the modern way.
            </h1>
            <p className="text-white/70 text-sm leading-relaxed">
              QR-based attendance tied to your registered device, your campus location and the exact time of your class — built for the BS&nbsp;IT department.
            </p>

            <ul className="mt-6 space-y-2.5 text-sm text-white/80">
              <li className="flex items-start gap-2.5">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#a8c243] flex-shrink-0" />
                One-tap QR scan from your registered phone
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#a8c243] flex-shrink-0" />
                Geofenced to the campus, time-locked to the slot
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#a8c243] flex-shrink-0" />
                Live 75% rule tracking per subject
              </li>
            </ul>
          </div>

          {/* Bottom: footer (desktop only) */}
          <div className="hidden lg:flex items-center gap-4 text-xs text-white/50">
            <span className="flex items-center gap-1.5"><FaBuildingColumns className="text-[#a8c243]" /> Dept. of IT</span>
            <span className="w-px h-3 bg-white/20" />
            <span className="flex items-center gap-1.5"><FaLocationDot className="text-[#a8c243]" /> Sargodha, Pakistan</span>
          </div>
        </div>
      </aside>

      {/* ─── Right: Form ─── */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 lg:py-12">
        <div className="w-full max-w-md">
          {/* Heading */}
          <div className="mb-6 lg:mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
              Sign in to your account
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5">
              Choose your role and enter your credentials.
            </p>
            {next && next.includes('token=') && (
              <div className="mt-4 p-3 bg-[#f0f9fa] dark:bg-[#1a869a]/20 border border-[#1a869a]/30 rounded-lg flex items-start gap-2.5">
                <FaQrcode className="text-[#1a869a] text-base mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[#063a47] dark:text-[#a8c243]">QR Code Detected</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    Sign in as a <strong>Student</strong> to automatically mark attendance.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Role selector (real segmented control) */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              I am a
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map(r => {
                const active = form.role === r.key;
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => setForm({ role: r.key, username: '', password: '' })}
                    className={`flex flex-col items-center gap-1 py-3 rounded-lg border text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-[#063a47] border-[#063a47] text-white'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <span className="text-base">{r.icon}</span>
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {form.role === 'student' ? 'Enrollment number' : form.role === 'admin' ? 'Username' : 'Teacher ID'}
              </label>
              <input
                id="username"
                type="text"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                placeholder={form.role === 'student' ? 'e.g. 220064' : form.role === 'admin' ? 'admin' : 'e.g. 1'}
                required
                autoComplete="username"
                inputMode={form.role === 'student' || form.role === 'teacher' ? 'numeric' : 'text'}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a869a] focus:border-[#1a869a] transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <span className="text-xs text-slate-400 dark:text-slate-500">Contact admin if forgotten</span>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 pr-11 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a869a] focus:border-[#1a869a] transition"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#063a47] hover:bg-[#082d36] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <FaArrowRightLong className="text-xs" />
                </>
              )}
            </button>
          </form>

          {/* Demo note (small, secondary) */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Demo credentials</p>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <p className="text-slate-400 dark:text-slate-500">Admin</p>
                <p className="font-mono text-slate-700 dark:text-slate-200">admin / 123</p>
              </div>
              <div className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <p className="text-slate-400 dark:text-slate-500">Teacher</p>
                <p className="font-mono text-slate-700 dark:text-slate-200">1 / 123</p>
              </div>
              <div className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <p className="text-slate-400 dark:text-slate-500">Student</p>
                <p className="font-mono text-slate-700 dark:text-slate-200">220064 / 123</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-8">
            © {new Date().getFullYear()} University of Sargodha · BS&nbsp;IT Department
          </p>
        </div>
      </main>
    </div>
  );
}
