'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FaShieldHalved, FaChalkboardUser, FaGraduationCap, FaQrcode, FaEye, FaEyeSlash } from 'react-icons/fa6';

const ROLES = [
  { key: 'admin',   label: 'Admin',   icon: <FaShieldHalved />,   color: 'from-[#007b8f] to-[#1a869a] hover:from-[#007990] hover:to-[#0d7d92]' },
  { key: 'teacher', label: 'Teacher', icon: <FaChalkboardUser />, color: 'from-[#1a869a] to-[#00b8c5] hover:from-[#0d7d92] hover:to-[#00a3af]' },
  { key: 'student', label: 'Student', icon: <FaGraduationCap />,  color: 'from-[#448843] to-[#a8c243] hover:from-[#3a7438] hover:to-[#94ad3b]' },
] as const;

const BG_IMAGE = 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1920&q=80';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ role: 'admin' as 'admin' | 'teacher' | 'student', username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const activeRole = ROLES.find(r => r.key === form.role)!;

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
        router.push(`/${form.role}`);
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
    <div className="relative min-h-[100dvh] flex items-center justify-center px-3 py-6 sm:p-4 overflow-x-hidden overflow-y-auto">
      {/* Unsplash university background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${BG_IMAGE}')` }}
      />
      {/* Dark teal overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#063a47]/95 via-[#007b8f]/80 to-[#063a47]/95" />

      {/* Animated floating blobs (minimal teal/forest palette) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-56 h-56 sm:w-96 sm:h-96 rounded-full bg-[#1a869a]/35 blur-3xl animate-blob" />
        <div className="absolute top-1/3 -right-24 w-64 h-64 sm:w-[28rem] sm:h-[28rem] rounded-full bg-[#448843]/25 blur-3xl animate-blob-2 animation-delay-2" />
        <div className="absolute -bottom-24 left-1/4 w-60 h-60 sm:w-[26rem] sm:h-[26rem] rounded-full bg-[#00b8c5]/25 blur-3xl animate-blob animation-delay-4" />
        <div className="absolute top-1/4 left-1/2 w-44 h-44 sm:w-72 sm:h-72 rounded-full bg-[#a8c243]/20 blur-3xl animate-blob-2 animation-delay-6" />
      </div>

      {/* Faint orbiting rings (hidden on smallest screens to avoid clutter) */}
      <div className="pointer-events-none absolute inset-0 hidden xs:flex items-center justify-center">
        <div className="w-[28rem] h-[28rem] sm:w-[36rem] sm:h-[36rem] rounded-full border border-white/5 animate-slow-spin" />
        <div className="absolute w-[40rem] h-[40rem] sm:w-[48rem] sm:h-[48rem] rounded-full border border-white/5 animate-slow-spin" style={{ animationDuration: '60s', animationDirection: 'reverse' }} />
      </div>

      {/* Content */}
      <div className="relative w-full max-w-sm animate-fade-up">

        {/* Logo + heading */}
        <div className="text-center mb-5 sm:mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl mb-3 sm:mb-4 text-2xl sm:text-3xl text-white shadow-lg shadow-black/30">
            <FaQrcode />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight drop-shadow-lg">SQAS</h1>
          <p className="text-slate-200/80 text-xs sm:text-sm mt-1">Smart Attendance System</p>
          <p className="text-slate-300/60 text-[11px] sm:text-xs mt-0.5">University of Sargodha &middot; Dept. of IT</p>
        </div>

        {/* Glassmorphism Card */}
        <div className="bg-white/10 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/20 rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/40 overflow-hidden">
          {/* Role selector */}
          <div className="grid grid-cols-3 border-b border-white/10">
            {ROLES.map(r => (
              <button
                key={r.key}
                type="button"
                onClick={() => setForm({ role: r.key, username: '', password: '' })}
                className={`flex flex-col items-center gap-1 sm:gap-1.5 py-3 sm:py-4 text-[11px] sm:text-xs font-semibold transition-all relative ${
                  form.role === r.key
                    ? 'text-white bg-white/10'
                    : 'text-slate-300/70 hover:text-white active:bg-white/5 sm:hover:bg-white/5'
                }`}
              >
                <span className={`text-lg sm:text-xl transition-transform ${form.role === r.key ? 'scale-110' : ''}`}>{r.icon}</span>
                {r.label}
                {form.role === r.key && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 sm:w-10 h-0.5 bg-gradient-to-r from-[#00b8c5] to-[#a8c243] rounded-full" />
                )}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-slate-200/80 uppercase tracking-wider mb-1.5">
                {form.role === 'student' ? 'Enrollment No.' : 'Username / ID'}
              </label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                placeholder={form.role === 'student' ? 'e.g. 220064' : form.role === 'admin' ? 'admin' : 'Teacher ID (e.g. 1)'}
                required
                autoComplete="username"
                inputMode={form.role === 'student' || form.role === 'teacher' ? 'numeric' : 'text'}
                className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-base sm:text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/10 transition"
              />
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-slate-200/80 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-11 bg-white/5 border border-white/15 rounded-xl text-base sm:text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/10 transition"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-1"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-gradient-to-r ${activeRole.color} disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-black/30 hover:shadow-xl hover:shadow-black/40 sm:hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 text-sm`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">{activeRole.icon} Sign in as {activeRole.label}</span>
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mx-5 sm:mx-6 mb-5 sm:mb-6 p-3 sm:p-3.5 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            <p className="text-[11px] sm:text-xs font-semibold text-slate-200/80 mb-1.5">
              Demo (password: <span className="font-mono text-white">123</span>)
            </p>
            <div className="flex flex-col sm:grid sm:grid-cols-3 gap-1 text-[11px] sm:text-xs text-slate-300/70">
              <span>Admin: <span className="font-mono text-white">admin</span></span>
              <span>Teacher: <span className="font-mono text-white">1</span></span>
              <span>Student: <span className="font-mono text-white">220064</span></span>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-300/60 text-[11px] sm:text-xs mt-4 sm:mt-5 px-2 leading-relaxed">
          BS Information Technology &middot; Regular 0 (2022-2026)<br className="sm:hidden" />
          <span className="hidden sm:inline"> &middot; </span>Semester 8 &middot; UoS
        </p>
      </div>
    </div>
  );
}
