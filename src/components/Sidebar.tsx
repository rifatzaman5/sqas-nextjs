'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTheme } from '@/hooks/useTheme';
import {
  FaHouse, FaGraduationCap, FaChalkboardUser, FaBook,
  FaCalendarDays, FaClipboardList, FaGear, FaQrcode,
  FaCamera, FaRightFromBracket, FaBars, FaXmark, FaShieldHalved,
  FaSun, FaMoon
} from 'react-icons/fa6';

interface NavItem { href: string; label: string; icon: React.ReactNode; }

const adminNav: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: <FaHouse /> },
  { href: '/admin/students', label: 'Students', icon: <FaGraduationCap /> },
  { href: '/admin/teachers', label: 'Teachers', icon: <FaChalkboardUser /> },
  { href: '/admin/subjects', label: 'Subjects', icon: <FaBook /> },
  { href: '/admin/timetable', label: 'Timetable', icon: <FaCalendarDays /> },
  { href: '/admin/attendance', label: 'Attendance', icon: <FaClipboardList /> },
  { href: '/admin/settings', label: 'Settings', icon: <FaGear /> },
];

const teacherNav: NavItem[] = [
  { href: '/teacher', label: 'Dashboard', icon: <FaHouse /> },
  { href: '/teacher/take-attendance', label: 'Take Attendance', icon: <FaQrcode /> },
  { href: '/teacher/view-attendance', label: 'View Attendance', icon: <FaClipboardList /> },
];

const studentNav: NavItem[] = [
  { href: '/student', label: 'Dashboard', icon: <FaHouse /> },
  { href: '/student/mark-attendance', label: 'Mark Attendance', icon: <FaCamera /> },
  { href: '/student/view-attendance', label: 'My Attendance', icon: <FaClipboardList /> },
];

const navMap = { admin: adminNav, teacher: teacherNav, student: studentNav };

const roleConfig = {
  admin:   { bar: 'from-indigo-700 to-indigo-900', sidebar: 'from-indigo-700 to-indigo-900', accent: 'bg-indigo-600', badge: 'Admin',   badgeColor: 'bg-indigo-100 text-indigo-700', icon: <FaShieldHalved className="text-indigo-200" /> },
  teacher: { bar: 'from-blue-600 to-blue-800',     sidebar: 'from-blue-600 to-blue-800',     accent: 'bg-blue-600',   badge: 'Teacher', badgeColor: 'bg-blue-100 text-blue-700',     icon: <FaChalkboardUser className="text-blue-200" /> },
  student: { bar: 'from-emerald-600 to-emerald-800', sidebar: 'from-emerald-600 to-emerald-800', accent: 'bg-emerald-600', badge: 'Student', badgeColor: 'bg-emerald-100 text-emerald-700', icon: <FaGraduationCap className="text-emerald-200" /> },
};

export default function Sidebar({ role, name }: { role: 'admin' | 'teacher' | 'student'; name: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { isDark, toggle: toggleTheme } = useTheme();
  const nav = navMap[role];
  const cfg = roleConfig[role];

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    toast.success('Logged out');
    router.push('/login');
    router.refresh();
  };

  const isActive = (href: string) => pathname === href;

  const NavLinks = ({ onClose }: { onClose?: () => void }) => (
    <nav className="flex-1 py-2 px-2 overflow-y-auto">
      {nav.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 transition-all ${
              active ? 'bg-white/20 text-white shadow-sm' : 'text-white/65 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className={`text-base flex-shrink-0 ${active ? 'text-white' : 'text-white/50'}`}>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* â”€â”€ Mobile fixed top bar â”€â”€ */}
      <header className={`lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-gradient-to-r ${cfg.bar} flex items-center justify-between px-4 shadow-md`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center text-base">
            {cfg.icon}
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">SQAS</p>
            <p className="text-white/55 text-[10px] leading-none mt-0.5 truncate max-w-[140px]">{name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <FaSun size={14} /> : <FaMoon size={14} />}
          </button>
          <button
            onClick={() => setOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            <FaBars size={15} />
          </button>
        </div>
      </header>

      {/* â”€â”€ Mobile overlay â”€â”€ */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* â”€â”€ Mobile slide-out drawer â”€â”€ */}
      <div className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 flex flex-col bg-gradient-to-b ${cfg.sidebar} shadow-2xl transform transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Drawer header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-white/10">
          <div>
            <p className="text-white font-bold text-xl">SQAS</p>
            <p className="text-white/55 text-xs mt-0.5">Smart Attendance System</p>
            <p className="text-white/35 text-xs mt-0.5">University of Sargodha</p>
          </div>
          <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white mt-0.5 transition-colors">
            <FaXmark size={18} />
          </button>
        </div>
        {/* User */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
          <div className={`w-10 h-10 ${cfg.accent} rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm truncate">{name}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badgeColor}`}>{cfg.badge}</span>
          </div>
        </div>
        <NavLinks onClose={() => setOpen(false)} />
        <div className="p-3 border-t border-white/10">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/65 hover:bg-white/10 hover:text-white transition-all"
          >
            <FaRightFromBracket className="text-white/50 text-base" />
            Sign Out
          </button>
        </div>
      </div>

      {/* â”€â”€ Desktop sidebar â”€â”€ */}
      <aside className={`hidden lg:flex flex-col w-60 min-h-screen bg-gradient-to-b ${cfg.sidebar} flex-shrink-0`}>
        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center text-lg">
              {cfg.icon}
            </div>
            <div>
              <p className="text-white font-bold text-base leading-none">SQAS</p>
              <p className="text-white/50 text-[10px] leading-none mt-1">Smart QR Attendance</p>
            </div>
          </div>
          <p className="text-white/35 text-[10px] mt-1">University of Sargodha</p>
        </div>
        {/* User */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
          <div className={`w-9 h-9 ${cfg.accent} rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm truncate">{name}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${cfg.badgeColor}`}>{cfg.badge}</span>
          </div>
        </div>
        <NavLinks />
        <div className="p-3 border-t border-white/10">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/65 hover:bg-white/10 hover:text-white transition-all mb-1"
          >
            {isDark ? <FaSun className="text-white/50 text-base" /> : <FaMoon className="text-white/50 text-base" />}
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/65 hover:bg-white/10 hover:text-white transition-all"
          >
            <FaRightFromBracket className="text-white/50 text-base" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

