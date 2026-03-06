import { supabaseAdmin } from '@/lib/supabase';
import Link from 'next/link';
import { FaGraduationCap, FaChalkboardUser, FaBook, FaCircleCheck, FaClipboardList, FaUsers, FaCalendarDays, FaGear } from 'react-icons/fa6';

async function getStats() {
  const today = new Date().toISOString().split('T')[0];
  const [s, t, sub, att, todayAtt, recentAtt] = await Promise.all([
    supabaseAdmin.from('students').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('teachers').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('subjects').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('attendance').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('attendance').select('id', { count: 'exact', head: true }).eq('date', today),
    supabaseAdmin.from('attendance').select('id, date, created_at, students(name, enrollment_no), subjects(name, code)').order('created_at', { ascending: false }).limit(8),
  ]);
  return {
    students: s.count || 0, teachers: t.count || 0, subjects: sub.count || 0,
    attendance: att.count || 0, todayAtt: todayAtt.count || 0,
    recent: recentAtt.data || [],
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const statCards = [
    { label: 'Total Students', value: stats.students, bg: 'bg-blue-500',    icon: <FaGraduationCap className="text-white text-lg" />, href: '/admin/students' },
    { label: 'Total Teachers', value: stats.teachers, bg: 'bg-violet-500',  icon: <FaChalkboardUser className="text-white text-lg" />, href: '/admin/teachers' },
    { label: 'Total Subjects', value: stats.subjects, bg: 'bg-orange-500',  icon: <FaBook className="text-white text-lg" />,          href: '/admin/subjects' },
    { label: "Today's Present", value: stats.todayAtt, bg: 'bg-emerald-500', icon: <FaCircleCheck className="text-white text-lg" />,  href: '/admin/attendance' },
  ];

  const quickLinks = [
    { href: '/admin/students',   label: 'Students',   icon: <FaGraduationCap />, color: 'text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-100' },
    { href: '/admin/teachers',   label: 'Teachers',   icon: <FaChalkboardUser />,color: 'text-violet-600 bg-violet-50 hover:bg-violet-100 border-violet-100' },
    { href: '/admin/subjects',   label: 'Subjects',   icon: <FaBook />,          color: 'text-orange-600 bg-orange-50 hover:bg-orange-100 border-orange-100' },
    { href: '/admin/timetable',  label: 'Timetable',  icon: <FaCalendarDays />,  color: 'text-green-600 bg-green-50 hover:bg-green-100 border-green-100' },
    { href: '/admin/attendance', label: 'Attendance', icon: <FaClipboardList />, color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-100' },
    { href: '/admin/settings',   label: 'Settings',   icon: <FaGear />,          color: 'text-slate-600 bg-slate-50 hover:bg-slate-100 border-slate-100' },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 mt-0.5 text-sm">University of Sargodha â€” Smart QR Attendance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {statCards.map((card) => (
          <Link key={card.label} href={card.href} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-all group">
            <div className={`inline-flex items-center justify-center w-10 h-10 ${card.bg} rounded-xl mb-3`}>{card.icon}</div>
            <p className="text-2xl font-bold text-slate-800">{card.value}</p>
            <p className="text-xs text-slate-500 mt-0.5 group-hover:text-slate-700 transition-colors">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Total all-time */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <FaUsers className="text-slate-500 text-base" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Total Attendance Records (all time)</p>
            <p className="text-xl font-bold text-slate-800">{stats.attendance}</p>
          </div>
        </div>
        <Link href="/admin/attendance" className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap">View All â†’</Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-700 mb-3 text-sm">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-2">
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href} className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl font-medium text-xs text-center transition-all border ${link.color}`}>
                <span className="text-base">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-700 text-sm">Recent Attendance</h2>
            <Link href="/admin/attendance" className="text-xs text-blue-600 hover:underline">View all â†’</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {stats.recent.length ? stats.recent.map((r) => {
              const rec = r as unknown as { id: number; date: string; created_at: string; students?: { name: string; enrollment_no: string }; subjects?: { name: string; code: string } };
              return (
                <div key={rec.id} className="flex items-center justify-between px-5 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{rec.students?.name}</p>
                    <p className="text-xs text-slate-400">{rec.subjects?.name} Â· {rec.students?.enrollment_no}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Present</span>
                    <p className="text-xs text-slate-400 mt-0.5">{rec.date}</p>
                  </div>
                </div>
              );
            }) : (
              <p className="text-center py-8 text-slate-400 text-sm">No records yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 bg-slate-800 rounded-2xl text-white text-sm">
        <p className="font-semibold">SQAS â€” Smart Attendance System using QR Scanning</p>
        <p className="text-slate-400 text-xs mt-1">Sania Nawaz (BSIT51F22S064) Â· Sania Saeed (BSIT51F22S091) Â· Waqar Ali (BSIT51F21R051RE) Â· University of Sargodha</p>
      </div>
    </div>
  );
}
