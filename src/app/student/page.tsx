import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import Link from 'next/link';
import { FaCircleCheck, FaCalendarDays, FaLayerGroup, FaGraduationCap, FaCamera, FaChartBar, FaCalendarXmark } from 'react-icons/fa6';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default async function StudentDashboard() {
  const session = await getSession();
  const dayName = WEEKDAYS[new Date().getDay()];
  const isWeekend = dayName === 'Saturday' || dayName === 'Sunday';
  const todayFormatted = new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const { data: student } = await supabaseAdmin.from('students').select('name, enrollment_no, batch, semester, branch').eq('id', session!.id).single();

  const [{ count: totalAtt }, { count: todayAtt }, { data: recentRecs }, { data: todayClasses }] = await Promise.all([
    supabaseAdmin.from('attendance').select('id', { count: 'exact', head: true }).eq('student_id', session!.id),
    supabaseAdmin.from('attendance').select('id', { count: 'exact', head: true }).eq('student_id', session!.id).eq('date', new Date().toISOString().split('T')[0]),
    supabaseAdmin.from('attendance').select('id, date, subjects(name, code), timetable(start_time, day)').eq('student_id', session!.id).order('date', { ascending: false }).limit(5),
    supabaseAdmin.from('timetable').select('id, start_time, end_time, room, subjects(name, code)').eq('batch', student?.batch || 'BSIT-R0-2022').eq('day', dayName).order('start_time'),
  ]);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-100">Welcome, {student?.name}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          {todayFormatted} &middot; {student?.enrollment_no}
        </p>
      </div>

      {/* Weekend banner */}
      {isWeekend && (
        <div className="mb-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 flex items-center gap-4">
          <FaCalendarXmark className="text-amber-500 text-2xl flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-300">No Classes Today</p>
            <p className="text-sm text-amber-600 dark:text-amber-400">It&apos;s {dayName} &mdash; enjoy your weekend! Classes resume on Monday.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { icon: <FaCircleCheck className="text-white text-lg" />, value: totalAtt || 0, label: 'Total Present', bg: 'bg-emerald-500' },
          { icon: <FaCalendarDays className="text-white text-lg" />, value: todayAtt || 0, label: "Today's Classes", bg: 'bg-blue-500' },
          { icon: <FaLayerGroup className="text-white text-lg" />, value: student?.semester || '\u2014', label: 'Semester', bg: 'bg-violet-500' },
          { icon: <FaGraduationCap className="text-white text-lg" />, value: student?.batch || '\u2014', label: 'Batch', bg: 'bg-orange-500' },
        ].map(item => (
          <div key={item.label} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4">
            <div className={`inline-flex items-center justify-center w-10 h-10 ${item.bg} rounded-xl mb-3`}>{item.icon}</div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{item.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 mb-5">
        <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-3 text-sm">Quick Actions</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/student/mark-attendance" className={`flex items-center gap-3 px-5 py-3 rounded-xl font-medium text-sm transition-colors ${isWeekend ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
            <FaCamera className="text-lg" /> {isWeekend ? 'No Classes Today' : 'Scan QR to Attend'}
          </Link>
          <Link href="/student/view-attendance" className="flex items-center gap-3 px-5 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            <FaChartBar className="text-lg" /> View My Attendance
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Today's Schedule */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h2 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
              {isWeekend ? 'No Schedule Today' : "Today's Schedule"}
            </h2>
            {!isWeekend && <span className="text-xs text-slate-400 dark:text-slate-500">{todayClasses?.length || 0} classes</span>}
          </div>
          {!isWeekend && todayClasses && todayClasses.length > 0 ? (
            <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {todayClasses.map((cls) => {
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
            <div className="px-5 py-8 text-center">
              {isWeekend ? (
                <p className="text-slate-400 dark:text-slate-500 text-sm">It&apos;s {dayName} &mdash; no classes scheduled</p>
              ) : (
                <p className="text-slate-400 dark:text-slate-500 text-sm">No classes scheduled for {dayName}</p>
              )}
            </div>
          )}
        </div>

        {/* Recent Attendance */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h2 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Recent Attendance</h2>
            <Link href="/student/view-attendance" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {recentRecs?.length ? recentRecs.map((r) => {
              const rec = r as unknown as { id: number; date: string; subjects?: { name: string; code: string }; timetable?: { start_time: string; day: string } };
              return (
                <div key={rec.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{rec.subjects?.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{rec.timetable?.day} &middot; {rec.timetable?.start_time}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <span className="inline-block bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full text-xs">Present</span>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{rec.date}</p>
                  </div>
                </div>
              );
            }) : (
              <p className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">No attendance records yet</p>
            )}
          </div>
        </div>
      </div>

      {/* 75% Rule reminder */}
      <div className="mt-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-5 py-4 text-sm text-amber-800 dark:text-amber-300">
        <span className="font-semibold">UoS Attendance Rule:</span> Minimum 75% attendance is required per subject to be eligible for final exams.{' '}
        <Link href="/student/view-attendance" className="underline font-medium">Check your attendance</Link>
      </div>
    </div>
  );
}
