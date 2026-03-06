'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, CalendarDays, ClipboardList,
  QrCode, LogOut, Menu, X, ScanLine, CheckSquare, Settings
} from 'lucide-react';

interface NavItem { href: string; label: string; icon: React.ReactNode; }

const adminNav: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { href: '/admin/students', label: 'Students', icon: <GraduationCap size={18} /> },
  { href: '/admin/teachers', label: 'Teachers', icon: <Users size={18} /> },
  { href: '/admin/subjects', label: 'Subjects', icon: <BookOpen size={18} /> },
  { href: '/admin/timetable', label: 'Timetable', icon: <CalendarDays size={18} /> },
  { href: '/admin/attendance', label: 'Attendance', icon: <ClipboardList size={18} /> },
  { href: '/admin/settings', label: 'Settings', icon: <Settings size={18} /> },
];

const teacherNav: NavItem[] = [
  { href: '/teacher', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { href: '/teacher/take-attendance', label: 'Take Attendance', icon: <QrCode size={18} /> },
  { href: '/teacher/view-attendance', label: 'View Attendance', icon: <ClipboardList size={18} /> },
];

const studentNav: NavItem[] = [
  { href: '/student', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { href: '/student/mark-attendance', label: 'Mark Attendance', icon: <ScanLine size={18} /> },
  { href: '/student/view-attendance', label: 'My Attendance', icon: <CheckSquare size={18} /> },
];

const navMap = { admin: adminNav, teacher: teacherNav, student: studentNav };
const roleColors = { admin: 'from-slate-800 to-slate-900', teacher: 'from-blue-800 to-blue-900', student: 'from-emerald-800 to-emerald-900' };
const roleTitles = { admin: '🔐 Admin', teacher: '👨‍🏫 Teacher', student: '🎓 Student' };
const uniName = 'University of Sargodha';

export default function Sidebar({ role, name }: { role: 'admin' | 'teacher' | 'student'; name: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const nav = navMap[role];

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    toast.success('Logged out');
    router.push('/login');
    router.refresh();
  };

  const NavLinks = () => (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {nav.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              active ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className={`lg:hidden flex items-center justify-between px-4 py-3 bg-gradient-to-r ${roleColors[role]} text-white`}>
        <div>
          <span className="font-bold text-sm">SQAS</span>
          <span className="text-white/60 text-xs ml-2">{roleTitles[role]}</span>
        </div>
        <button onClick={() => setOpen(!open)} className="p-1">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {open && <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col bg-gradient-to-b ${roleColors[role]} text-white transform transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'} lg:min-h-screen`}>
        {/* Brand */}
        <div className="px-6 py-5 border-b border-white/10">
          <h1 className="text-xl font-bold">SQAS</h1>
          <p className="text-white/60 text-xs mt-0.5">Smart Attendance System</p>
          <p className="text-white/40 text-xs mt-0.5">{uniName}</p>
        </div>

        {/* User info */}
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium">{name}</p>
              <p className="text-xs text-white/60 capitalize">{roleTitles[role]}</p>
            </div>
          </div>
        </div>

        <NavLinks />

        {/* Logout */}
        <div className="px-3 pb-4">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
