'use client';
import { useEffect, useState, useCallback } from 'react';
import { FaDownload, FaArrowsRotate } from 'react-icons/fa6';

interface AttendanceRecord {
  id: number;
  date: string;
  status: string;
  students?: { name: string; enrollment_no: string };
  subjects?: { name: string; code: string };
  teachers?: { name: string };
  timetable?: { day: string; start_time: string };
}

function exportCSV(records: AttendanceRecord[]) {
  const header = ['Date', 'Student Name', 'Enrollment', 'Subject', 'Subject Code', 'Teacher', 'Time', 'Status'];
  const rows = records.map(r => [
    r.date,
    r.students?.name || '',
    r.students?.enrollment_no || '',
    r.subjects?.name || '',
    r.subjects?.code || '',
    r.teachers?.name || '',
    r.timetable?.start_time || '',
    r.status || 'present',
  ]);
  const csv = [header, ...rows].map(row => row.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SQAS_Attendance_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ date: '', subject: '', student: '' });
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter.date) params.set('date', filter.date);
    const r = await fetch(`/api/attendance?${params}`);
    if (r.ok) { const d = await r.json(); setRecords(Array.isArray(d) ? d : []); }
    setLoading(false);
  }, [filter.date]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  // Auto-refresh every 10s when enabled
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(fetchRecords, 10000);
    return () => clearInterval(id);
  }, [autoRefresh, fetchRecords]);

  const filtered = records.filter(r => {
    const matchSubject = !filter.subject || r.subjects?.name?.toLowerCase().includes(filter.subject.toLowerCase()) || r.subjects?.code?.toLowerCase().includes(filter.subject.toLowerCase());
    const matchStudent = !filter.student || r.students?.name?.toLowerCase().includes(filter.student.toLowerCase()) || r.students?.enrollment_no?.includes(filter.student);
    return matchSubject && matchStudent;
  });

  // Stats by subject for today
  const subjectStats = filtered.reduce((acc, r) => {
    const k = r.subjects?.code || 'unknown';
    if (!acc[k]) acc[k] = { name: r.subjects?.name || 'Unknown', code: k, count: 0 };
    acc[k].count++;
    return acc;
  }, {} as Record<string, { name: string; code: string; count: number }>);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Attendance Records</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{filtered.length} records shown{records.length !== filtered.length ? ` (${records.length} total)` : ''}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setAutoRefresh(v => !v)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${autoRefresh ? 'bg-green-600 text-white border-green-600' : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <FaArrowsRotate className={autoRefresh ? 'animate-spin text-xs' : 'text-xs'} />
            {autoRefresh ? 'Live (10s)' : 'Auto-refresh'}
          </button>
          <button
            onClick={() => exportCSV(filtered)}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            <FaDownload className="text-xs" /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary chips */}
      {Object.keys(subjectStats).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.values(subjectStats).map(s => (
            <span key={s.code} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
              <span className="font-mono">{s.code}</span>
              <span className="bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full px-1.5 py-0.5 text-xs font-bold">{s.count}</span>
            </span>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="date"
          value={filter.date}
          onChange={e => setFilter({ ...filter, date: e.target.value })}
          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800"
        />
        <input
          type="text"
          placeholder="Filter by subject…"
          value={filter.subject}
          onChange={e => setFilter({ ...filter, subject: e.target.value })}
          className="flex-1 min-w-[140px] px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800"
        />
        <input
          type="text"
          placeholder="Filter by student / enrollment…"
          value={filter.student}
          onChange={e => setFilter({ ...filter, student: e.target.value })}
          className="flex-1 min-w-[160px] px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800"
        />
        {(filter.date || filter.subject || filter.student) && (
          <button
            onClick={() => setFilter({ date: '', subject: '', student: '' })}
            className="px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800"
          >
            Clear
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 uppercase text-xs">
                <tr>
                  {['Date', 'Student', 'Enrollment', 'Subject', 'Teacher', 'Time', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">{r.date}</td>
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-200 whitespace-nowrap">{r.students?.name}</td>
                    <td className="px-4 py-3 font-mono text-blue-600 dark:text-blue-400 text-xs whitespace-nowrap">{r.students?.enrollment_no}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {r.subjects?.name} <span className="text-slate-400 dark:text-slate-500 text-xs">({r.subjects?.code})</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs whitespace-nowrap">{r.teachers?.name}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{r.timetable?.start_time}</td>
                    <td className="px-4 py-3">
                      <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full text-xs font-medium capitalize">{r.status}</span>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr><td colSpan={7} className="text-center py-10 text-slate-400 dark:text-slate-500">No attendance records found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

