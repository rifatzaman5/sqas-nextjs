import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import Link from 'next/link';

export default async function StudentDashboard() {
  const session = await getSession();

  const [{ data: student }, { count: totalAtt }, { count: todayAtt }, { data: recentRecs }] = await Promise.all([
    supabaseAdmin.from('students').select('name, enrollment_no, batch, semester, branch').eq('id', session!.id).single(),
    supabaseAdmin.from('attendance').select('id', { count: 'exact', head: true }).eq('student_id', session!.id),
    supabaseAdmin.from('attendance').select('id', { count: 'exact', head: true }).eq('student_id', session!.id).eq('date', new Date().toISOString().split('T')[0]),
    supabaseAdmin.from('attendance').select('id, date, subjects(name, code), timetable(start_time, day)').eq('student_id', session!.id).order('date', { ascending: false }).limit(5),
  ]);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Welcome, {student?.name} 👋</h1>
        <p className="text-gray-500 text-sm mt-1">
          {student?.enrollment_no} · Batch {student?.batch} · Sem {student?.semester} · University of Sargodha
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: '✅', value: totalAtt || 0, label: 'Total Present', bg: 'bg-emerald-500' },
          { icon: '📅', value: todayAtt || 0, label: "Today's Classes", bg: 'bg-blue-500' },
          { icon: '📚', value: student?.semester || '—', label: 'Semester', bg: 'bg-purple-500' },
          { icon: '🎓', value: student?.batch || '—', label: 'Batch', bg: 'bg-orange-500' },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className={`inline-flex items-center justify-center w-9 h-9 ${item.bg} rounded-lg mb-2 text-lg`}>{item.icon}</div>
            <p className="text-2xl font-bold text-gray-800">{item.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <h2 className="font-semibold text-gray-700 mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/student/mark-attendance" className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-700 transition-colors">
            📷 Scan QR to Attend
          </Link>
          <Link href="/student/view-attendance" className="flex items-center gap-2 px-5 py-3 bg-blue-50 text-blue-700 rounded-lg font-medium text-sm hover:bg-blue-100 transition-colors">
            📊 View My Attendance
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-700 mb-4">My Profile</h2>
          <div className="space-y-3">
            {[
              { label: 'Full Name', value: student?.name },
              { label: 'Enrollment No.', value: student?.enrollment_no },
              { label: 'Department / Branch', value: student?.branch },
              { label: 'Batch', value: `Batch ${student?.batch}` },
              { label: 'Semester', value: `Semester ${student?.semester}` },
              { label: 'University', value: 'University of Sargodha' },
            ].map(item => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-gray-400">{item.label}</span>
                <span className="font-medium text-gray-700 text-right">{item.value || '—'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">Recent Attendance</h2>
            <Link href="/student/view-attendance" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentRecs?.length ? recentRecs.map((r) => {
              const rec = r as { id: number; date: string; subjects?: { name: string; code: string }; timetable?: { start_time: string; day: string } };
              return (
              <div key={rec.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{rec.subjects?.name}</p>
                  <p className="text-xs text-gray-400">{rec.timetable?.day} · {rec.timetable?.start_time}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">Present</span>
                  <p className="text-xs text-gray-400 mt-1">{rec.date}</p>
                </div>
              </div>
            )}) : (
              <p className="text-center py-8 text-gray-400 text-sm">No attendance records yet</p>
            )}
          </div>
        </div>
      </div>

      {/* UoS 75% Rule reminder */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-sm text-amber-800">
        <span className="font-semibold">📌 UoS Attendance Rule:</span> Minimum 75% attendance is required per subject to be eligible for final exams. Check your attendance percentage in <Link href="/student/view-attendance" className="underline font-medium">View Attendance</Link>.
      </div>
    </div>
  );
}

  const { data: student } = await supabaseAdmin
    .from('students')
    .select('name, enrollment_no, batch, semester, branch')
    .eq('id', session!.id)
    .single();

  const { count: totalAtt } = await supabaseAdmin
    .from('attendance')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', session!.id);

  const today = new Date().toISOString().split('T')[0];
  const { count: todayAtt } = await supabaseAdmin
    .from('attendance')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', session!.id)
    .eq('date', today);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Welcome, {student?.name}</h1>
        <p className="text-gray-500 text-sm mt-1">{student?.enrollment_no} • Batch {student?.batch} • Semester {student?.semester}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-emerald-500 rounded-lg mb-3 text-xl">✅</div>
          <p className="text-3xl font-bold text-gray-800">{totalAtt || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Total Attendances</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-500 rounded-lg mb-3 text-xl">📅</div>
          <p className="text-3xl font-bold text-gray-800">{todayAtt || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Today's Attendance</p>
        </div>
      </div>

      {/* Student info card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="font-semibold text-gray-700 mb-4">My Profile</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { label: 'Enrollment', value: student?.enrollment_no },
            { label: 'Branch', value: student?.branch },
            { label: 'Batch', value: student?.batch },
            { label: 'Semester', value: student?.semester },
          ].map(item => (
            <div key={item.label}>
              <p className="text-gray-400 text-xs">{item.label}</p>
              <p className="font-medium text-gray-700">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-700 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <a href="/student/mark-attendance" className="px-5 py-3 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-700 transition-colors">📷 Mark Attendance (Scan QR)</a>
          <a href="/student/view-attendance" className="px-5 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors">📋 View My Attendance</a>
        </div>
      </div>
    </div>
  );
}
