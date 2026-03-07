import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import Link from 'next/link';
import { FaCalendarDays, FaCircleCheck, FaQrcode, FaClipboardList, FaCalendarXmark } from 'react-icons/fa6';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

async function getTeacherData(teacherId: number) {
  const today = new Date().toISOString().split('T')[0];
  const dayName = WEEKDAYS[new Date().getDay()];

  const [slotsRes, todayAtt, totalAtt, todayClasses] = await Promise.all([
    supabaseAdmin.from('timetable').select('id', { count: 'exact', head: true }).eq('teacher_id', teacherId),
    supabaseAdmin.from('attendance').select('id', { count: 'exact', head: true }).eq('teacher_id', teacherId).eq('date', today),
    supabaseAdmin.from('attendance').select('id', { count: 'exact', head: true }).eq('teacher_id', teacherId),
    supabaseAdmin.from('timetable').select('id, day, start_time, end_time, room, subjects(name, code)').eq('teacher_id', teacherId).eq('day', dayName).order('start_time'),
  ]);
  return {
    slots: slotsRes.count || 0,
    todayAttendance: todayAtt.count || 0,
    total: totalAtt.count || 0,
    todayClasses: todayClasses.data || [],
    dayName,
  };
}

export default async function TeacherDashboard() {
  const session = await getSession();
  const stats = await getTeacherData(Number(session!.id));

  const isWeekend = stats.dayName === 'Saturday' || stats.dayName === 'Sunday';
  const todayFormatted = new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const statCards = [
    { label: 'Weekly Classes',      value: stats.slots,           bg: 'bg-blue-500',    icon: <FaCalendarDays className="text-white text-lg" /> },
    { label: "Today's Attendances", value: stats.todayAttendance, bg: 'bg-emerald-500', icon: <FaCircleCheck className="text-white text-lg" /> },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-100">Welcome, {session!.name}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-sm">{todayFormatted} &middot; University of Sargodha</p>
      </div>

      {/* Weekend banner */}
      {isWeekend && (
        <div className="mb-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 flex items-center gap-4">
          <FaCalendarXmark className="text-amber-500 text-2xl flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-300">University is Off Today</p>
            <p className="text-sm text-amber-600 dark:text-amber-400">It&apos;s {stats.dayName}. Your next classes resume on Monday.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-5">
        {statCards.map(c => (
          <div key={c.label} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4">
            <div className={`inline-flex items-center justify-center w-10 h-10 ${c.bg} rounded-xl mb-3`}>{c.icon}</div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{c.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Today's Schedule */}
      {!isWeekend && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden mb-5">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h2 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Today&apos;s Schedule</h2>
            <span className="text-xs text-slate-400 dark:text-slate-500">{stats.todayClasses.length} classes</span>
          </div>
          {stats.todayClasses.length > 0 ? (
            <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {stats.todayClasses.map((cls) => {
                const c = cls as unknown as { id: number; start_time: string; end_time: string; room: string; subjects?: { name: string; code: string } };
                return (
                  <div key={c.id} className="flex items-center gap-4 px-5 py-3">
                    <span className="text-sm font-mono text-blue-600 dark:text-blue-400 w-24 flex-shrink-0">{c.start_time}&ndash;{c.end_time}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{c.subjects?.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{c.subjects?.code} &middot; {c.room}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="px-5 py-6 text-center text-slate-400 dark:text-slate-500 text-sm">No classes scheduled for today</p>
          )}
        </div>
      )}

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
