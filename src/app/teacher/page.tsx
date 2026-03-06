import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import Link from 'next/link';
import { FaCalendarDays, FaCircleCheck, FaQrcode, FaClipboardList } from 'react-icons/fa6';

async function getTeacherStats(teacherId: number) {
  const today = new Date().toISOString().split('T')[0];
  const [slotsRes, todayAtt, totalAtt] = await Promise.all([
    supabaseAdmin.from('timetable').select('id', { count: 'exact', head: true }).eq('teacher_id', teacherId),
    supabaseAdmin.from('attendance').select('id', { count: 'exact', head: true }).eq('teacher_id', teacherId).eq('date', today),
    supabaseAdmin.from('attendance').select('id', { count: 'exact', head: true }).eq('teacher_id', teacherId),
  ]);
  return { slots: slotsRes.count || 0, todayAttendance: todayAtt.count || 0, total: totalAtt.count || 0 };
}

export default async function TeacherDashboard() {
  const session = await getSession();
  const stats = await getTeacherStats(Number(session!.id));

  const statCards = [
    { label: 'Weekly Classes',      value: stats.slots,          bg: 'bg-blue-500',    icon: <FaCalendarDays className="text-white text-lg" /> },
    { label: "Today's Attendances", value: stats.todayAttendance, bg: 'bg-emerald-500', icon: <FaCircleCheck className="text-white text-lg" /> },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-100">Welcome, {session!.name}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-sm">University of Sargodha &ndash; Dept. of Information Technology</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        {statCards.map(c => (
          <div key={c.label} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4">
            <div className={`inline-flex items-center justify-center w-10 h-10 ${c.bg} rounded-xl mb-3`}>{c.icon}</div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{c.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5">
        <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-3 text-sm">Quick Actions</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/teacher/take-attendance" className="flex items-center gap-3 px-5 py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors">
            <FaQrcode className="text-lg" /> Generate QR Code
          </Link>
          <Link href="/teacher/view-attendance" className="flex items-center gap-3 px-5 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            <FaClipboardList className="text-lg" /> View Attendance Records
          </Link>
        </div>
      </div>
    </div>
  );
}