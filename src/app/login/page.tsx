'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FaShieldHalved, FaChalkboardUser, FaGraduationCap, FaQrcode, FaEye, FaEyeSlash } from 'react-icons/fa6';

const ROLES = [
  { key: 'admin',   label: 'Admin',   icon: <FaShieldHalved />,   color: 'from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600' },
  { key: 'teacher', label: 'Teacher', icon: <FaChalkboardUser />, color: 'from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500' },
  { key: 'student', label: 'Student', icon: <FaGraduationCap />,  color: 'from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500' },
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
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Unsplash university background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${BG_IMAGE}')` }}
      />
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-indigo-950/85 to-slate-950/95" />

      {/* Animated floating blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-500/30 blur-3xl animate-blob" />
        <div className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full bg-emerald-500/25 blur-3xl animate-blob-2 animation-delay-2" />
        <div className="absolute -bottom-32 left-1/4 w-[26rem] h-[26rem] rounded-full bg-blue-500/25 blur-3xl animate-blob animation-delay-4" />
        <div className="absolute top-1/4 left-1/2 w-72 h-72 rounded-full bg-fuchsia-500/20 blur-3xl animate-blob-2 animation-delay-6" />
      </div>

      {/* Faint orbiting ring decoration */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-[36rem] h-[36rem] rounded-full border border-white/5 animate-slow-spin" />
        <div className="absolute w-[48rem] h-[48rem] rounded-full border border-white/5 animate-slow-spin" style={{ animationDuration: '60s', animationDirection: 'reverse' }} />
      </div>

      {/* Content */}
      <div className="relative w-full max-w-sm animate-fade-up">

        {/* Logo + heading */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl mb-4 text-3xl text-white shadow-lg shadow-black/30">
            <FaQrcode />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">SQAS</h1>
          <p className="text-slate-200/80 text-sm mt-1">Smart Attendance System</p>
          <p className="text-slate-300/60 text-xs mt-0.5">University of Sargodha &middot; Dept. of IT</p>
        </div>

        {/* Glassmorphism Card */}
        <div className="bg-white/10 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl shadow-black/40 overflow-hidden">
          {/* Role selector */}
          <div className="grid grid-cols-3 border-b border-white/10">
            {ROLES.map(r => (
              <button
                key={r.key}
                type="button"
                onClick={() => setForm({ role: r.key, username: '', password: '' })}
                className={`flex flex-col items-center gap-1.5 py-4 text-xs font-semibold transition-all relative ${
                  form.role === r.key
                    ? 'text-white bg-white/10'
                    : 'text-slate-300/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={`text-xl transition-transform ${form.role === r.key ? 'scale-110' : ''}`}>{r.icon}</span>
                {r.label}
                {form.role === r.key && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full" />
                )}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-200/80 uppercase tracking-wider mb-1.5">
                {form.role === 'student' ? 'Enrollment No.' : 'Username / ID'}
              </label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                placeholder={form.role === 'student' ? 'e.g. 220064' : form.role === 'admin' ? 'admin' : 'Teacher ID (e.g. 1)'}
                required
                autoComplete="username"
                className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/10 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200/80 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-11 bg-white/5 border border-white/15 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/10 transition"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                >
                  {showPass ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-gradient-to-r ${activeRole.color} disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-black/30 hover:shadow-xl hover:shadow-black/40 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 text-sm`}
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
          <div className="mx-6 mb-6 p-3.5 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            <p className="text-xs font-semibold text-slate-200/80 mb-1.5">
              Demo credentials (password: <span className="font-mono text-white">123</span>)
            </p>
            <div className="grid grid-cols-3 gap-1 text-xs text-slate-300/70">
              <span>Admin: <span className="font-mono text-white">admin</span></span>
              <span>Teacher: <span className="font-mono text-white">1</span></span>
              <span>Student: <span className="font-mono text-white">220064</span></span>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-300/60 text-xs mt-5">
          BS Information Technology &middot; Regular 0 (2022-2026) &middot; Semester 8 &middot; UoS
        </p>
      </div>
    </div>
  );
}
