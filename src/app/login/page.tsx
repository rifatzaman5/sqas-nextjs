'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FaShieldHalved, FaChalkboardUser, FaGraduationCap, FaQrcode, FaEye, FaEyeSlash } from 'react-icons/fa6';

const ROLES = [
  { key: 'admin',   label: 'Admin',   icon: <FaShieldHalved />,   color: 'bg-indigo-600 hover:bg-indigo-700' },
  { key: 'teacher', label: 'Teacher', icon: <FaChalkboardUser />, color: 'bg-blue-600 hover:bg-blue-700'    },
  { key: 'student', label: 'Student', icon: <FaGraduationCap />,  color: 'bg-emerald-600 hover:bg-emerald-700' },
] as const;

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo + heading */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4 text-3xl text-white">
            <FaQrcode />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">SQAS</h1>
          <p className="text-slate-400 text-sm mt-1">Smart Attendance System</p>
          <p className="text-slate-500 text-xs mt-0.5">University of Sargodha — Dept. of IT</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Role selector */}
          <div className="grid grid-cols-3">
            {ROLES.map(r => (
              <button
                key={r.key}
                type="button"
                onClick={() => setForm({ role: r.key, username: '', password: '' })}
                className={`flex flex-col items-center gap-1.5 py-4 text-xs font-semibold transition-all border-b-2 ${
                  form.role === r.key
                    ? 'border-b-2 border-current bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100'
                    : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-700/50'
                }`}
                style={form.role === r.key ? { borderColor: 'currentColor' } : {}}
              >
                <span className={`text-xl ${form.role === r.key ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300 dark:text-slate-600'}`}>{r.icon}</span>
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                {form.role === 'student' ? 'Enrollment No.' : 'Username / ID'}
              </label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                placeholder={form.role === 'student' ? 'e.g. 220064' : form.role === 'admin' ? 'admin' : 'Teacher ID (e.g. 1)'}
                required
                autoComplete="username"
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-500 bg-slate-50 dark:bg-slate-700 placeholder-slate-300 dark:placeholder-slate-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-11 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-500 bg-slate-50 dark:bg-slate-700 placeholder-slate-300 dark:placeholder-slate-500 transition"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPass ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full ${activeRole.color} disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm`}
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
          <div className="mx-6 mb-6 p-3.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Demo credentials (password: <span className="font-mono">123</span>)</p>
            <div className="grid grid-cols-3 gap-1 text-xs text-slate-500 dark:text-slate-400">
              <span>Admin: <span className="font-mono text-slate-700 dark:text-slate-300">admin</span></span>
              <span>Teacher: <span className="font-mono text-slate-700 dark:text-slate-300">1</span></span>
              <span>Student: <span className="font-mono text-slate-700 dark:text-slate-300">220064</span></span>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-5">
          Sania Nawaz &middot; Sania Saeed &middot; Waqar Ali &mdash; BSIT Sem 5 &middot; UoS
        </p>
      </div>
    </div>
  );
}