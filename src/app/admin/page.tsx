import { supabaseAdmin } from '@/lib/supabase';
import Link from 'next/link';

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
    { label: 'Total Students', value: stats.students, color: 'bg-blue-500', emoji: '🎓', href: '/admin/students' },
    { label: 'Total Teachers', value: stats.teachers, color: 'bg-purple-500', emoji: '👨‍🏫', href: '/admin/teachers' },
    { label: 'Total Subjects', value: stats.subjects, color: 'bg-orange-500', emoji: '📚', href: '/admin/subjects' },
    { label: 'Today\'s Attendance', value: stats.todayAtt, color: 'bg-green-500', emoji: '✅', href: '/admin/attendance' },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1 text-sm">University of Sargodha — Smart QR Attendance System</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => (
          <Link key={card.label} href={card.href} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow group">
            <div className={`inline-flex items-center justify-center w-10 h-10 ${card.color} rounded-lg mb-3 text-xl`}>{card.emoji}</div>
            <p className="text-3xl font-bold text-gray-800">{card.value}</p>
            <p className="text-sm text-gray-500 mt-1 group-hover:text-gray-700">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Total all-time row */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Total Attendance Records (all time)</p>
          <p className="text-2xl font-bold text-gray-800">{stats.attendance}</p>
        </div>
        <Link href="/admin/attendance" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 font-medium">View All →</Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/admin/students', label: '🎓 Students', color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
              { href: '/admin/teachers', label: '👨‍🏫 Teachers', color: 'text-purple-600 bg-purple-50 hover:bg-purple-100' },
              { href: '/admin/subjects', label: '📚 Subjects', color: 'text-orange-600 bg-orange-50 hover:bg-orange-100' },
              { href: '/admin/timetable', label: '🗓️ Timetable', color: 'text-green-600 bg-green-50 hover:bg-green-100' },
              { href: '/admin/attendance', label: '✅ Attendance', color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' },
              { href: '/admin/settings', label: '⚙️ Settings', color: 'text-gray-600 bg-gray-50 hover:bg-gray-100' },
            ].map((link) => (
              <Link key={link.href} href={link.href} className={`px-4 py-3 rounded-lg font-medium text-sm text-center transition-colors ${link.color}`}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">Recent Attendance</h2>
            <Link href="/admin/attendance" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.recent.length ? stats.recent.map((r) => {
              const rec = r as { id: number; date: string; created_at: string; students?: { name: string; enrollment_no: string }; subjects?: { name: string; code: string } };
              return (
                <div key={rec.id} className="flex items-center justify-between px-5 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{rec.students?.name}</p>
                    <p className="text-xs text-gray-400">{rec.subjects?.name} · {rec.students?.enrollment_no}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Present</span>
                    <p className="text-xs text-gray-400 mt-1">{rec.date}</p>
                  </div>
                </div>
              );
            }) : (
              <p className="text-center py-6 text-gray-400 text-sm">No records yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 bg-slate-800 rounded-xl text-white text-sm">
        <p className="font-semibold">SQAS — Smart Attendance System using QR Scanning</p>
        <p className="text-slate-300 text-xs mt-1">Sania Nawaz (BSIT51F22S064) · Sania Saeed (BSIT51F22S091) · Waqar Ali (BSIT51F21R051RE) · University of Sargodha</p>
      </div>
    </div>
  );
}

    supabaseAdmin.from('students').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('teachers').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('subjects').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('attendance').select('id', { count: 'exact', head: true }),
  ]);
  return { students: s.count || 0, teachers: t.count || 0, subjects: sub.count || 0, attendance: att.count || 0 };
}

export default async function AdminDashboard() {
  const stats = await getStats();
  const cards = [
    { label: 'Total Students', value: stats.students, color: 'bg-blue-500', emoji: '🎓' },
    { label: 'Total Teachers', value: stats.teachers, color: 'bg-purple-500', emoji: '👨‍🏫' },
    { label: 'Total Subjects', value: stats.subjects, color: 'bg-orange-500', emoji: '📚' },
    { label: 'Attendance Records', value: stats.attendance, color: 'bg-green-500', emoji: '✅' },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">University of Sargodha — Smart Attendance System</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className={`inline-flex items-center justify-center w-10 h-10 ${card.color} rounded-lg mb-3 text-xl`}>
              {card.emoji}
            </div>
            <p className="text-3xl font-bold text-gray-800">{card.value}</p>
            <p className="text-sm text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-700 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { href: '/admin/students', label: 'Manage Students', color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
            { href: '/admin/teachers', label: 'Manage Teachers', color: 'text-purple-600 bg-purple-50 hover:bg-purple-100' },
            { href: '/admin/subjects', label: 'Manage Subjects', color: 'text-orange-600 bg-orange-50 hover:bg-orange-100' },
            { href: '/admin/timetable', label: 'View Timetable', color: 'text-green-600 bg-green-50 hover:bg-green-100' },
          ].map((link) => (
            <a key={link.href} href={link.href} className={`px-4 py-3 rounded-lg font-medium text-sm text-center transition-colors ${link.color}`}>
              {link.label}
            </a>
          ))}
        </div>
      </div>

      <div className="mt-6 p-4 bg-slate-800 rounded-xl text-white text-sm">
        <p className="font-semibold">SQAS — Smart Attendance System using QR Scanning</p>
        <p className="text-slate-300 text-xs mt-1">Sania Nawaz (BSIT51F22S064) • Sania Saeed (BSIT51F22S091) • Waqar Ali (BSIT51F21R051RE) · University of Sargodha</p>
      </div>
    </div>
  );
}
