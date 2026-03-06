import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

async function getTeacherStats(teacherId: number) {
  const today = new Date().toISOString().split('T')[0];
  const [slotsRes, todayAtt] = await Promise.all([
    supabaseAdmin.from('timetable').select('id', { count: 'exact', head: true }).eq('teacher_id', teacherId),
    supabaseAdmin.from('attendance').select('id', { count: 'exact', head: true }).eq('teacher_id', teacherId).eq('date', today),
  ]);
  return { slots: slotsRes.count || 0, todayAttendance: todayAtt.count || 0 };
}

export default async function TeacherDashboard() {
  const session = await getSession();
  const stats = await getTeacherStats(Number(session!.id));

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Welcome, {session!.name}</h1>
        <p className="text-gray-500 mt-1">University of Sargodha — Dept. of Information Technology</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-500 rounded-lg mb-3 text-xl">📅</div>
          <p className="text-3xl font-bold text-gray-800">{stats.slots}</p>
          <p className="text-sm text-gray-500 mt-1">Weekly Classes</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-green-500 rounded-lg mb-3 text-xl">✅</div>
          <p className="text-3xl font-bold text-gray-800">{stats.todayAttendance}</p>
          <p className="text-sm text-gray-500 mt-1">Today's Attendances</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-700 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <a href="/teacher/take-attendance" className="px-5 py-3 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors">📷 Take Attendance (Generate QR)</a>
          <a href="/teacher/view-attendance" className="px-5 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors">📋 View Attendance Records</a>
        </div>
      </div>
    </div>
  );
}
