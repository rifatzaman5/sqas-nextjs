'use client';
import { useEffect, useState, useCallback } from 'react';
import { FaDownload, FaFilter } from 'react-icons/fa6';

interface AttendanceRecord {
  id: number;
  date: string;
  timetable_id?: number;
  students?: { name: string; enrollment_no: string };
  subjects?: { name: string; code: string };
  timetable?: { day: string; start_time: string; end_time: string; batch: string };
}

interface SubjectOption { id: number; name: string; code: string }

export default function TeacherViewAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [searchStudent, setSearchStudent] = useState('');

  useEffect(() => {
    fetch('/api/subjects').then(r => r.json()).then(setSubjects).catch(() => {});
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDate) params.set('date', filterDate);
      if (filterSubject) params.set('subject_id', filterSubject);
      const r = await fetch(`/api/attendance?${params}`);
      if (r.ok) {
        const data = await r.json();
        setRecords(Array.isArray(data) ? data : []);
      }
    } catch {
      // network error — keep existing records
    } finally {
      setLoading(false);
    }
  }, [filterDate, filterSubject]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const filtered = records.filter(r => {
    if (!searchStudent) return true;
    const q = searchStudent.toLowerCase();
    return r.students?.name?.toLowerCase().includes(q) || r.students?.enrollment_no?.toLowerCase().includes(q);
  });

  const grouped = filtered.reduce((acc, r) => {
    const key = `${r.date}__${r.subjects?.code}__${r.timetable?.start_time}`;
    if (!acc[key]) acc[key] = { date: r.date, subject: r.subjects, slot: r.timetable, records: [] };
    acc[key].records.push(r);
    return acc;
  }, {} as Record<string, { date: string; subject?: { name: string; code: string }; slot?: { day: string; start_time: string; end_time: string; batch: string }; records: AttendanceRecord[] }>);

  const uniqueDates = [...new Set(filtered.map(r => r.date))].length;
  const uniqueStudents = [...new Set(filtered.map(r => r.students?.enrollment_no))].length;

  const exportCSV = () => {
    const header = ['Date', 'Subject', 'Code', 'Day', 'Time', 'Student Name', 'Enrollment No'];
    const rows = filtered.map(r => [r.date, r.subjects?.name || '', r.subjects?.code || '', r.timetable?.day || '', r.timetable?.start_time || '', r.students?.name || '', r.students?.enrollment_no || '']);
    const csv = [header, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Attendance_${filterDate || 'All'}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Attendance Records</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{filtered.length} records · {uniqueDates} dates · {uniqueStudents} students</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm hover:bg-emerald-700">
          <FaDownload className="text-xs" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 mb-6">
        <div className="flex items-center gap-2 mb-3 text-sm text-slate-500 dark:text-slate-400 font-medium">
          <FaFilter className="text-xs" /> Filters
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 dark:bg-slate-700" />
          <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700">
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
          </select>
          <input type="text" placeholder="Search student name / enrollment…" value={searchStudent} onChange={e => setSearchStudent(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 dark:bg-slate-700" />
        </div>
        {(filterDate || filterSubject || searchStudent) && (
          <button onClick={() => { setFilterDate(''); setFilterSubject(''); setSearchStudent(''); }} className="mt-2 text-xs text-red-500 hover:underline">
            × Clear all filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 dark:text-slate-500">Loading…</div>
      ) : (
        <div className="space-y-4">
          {Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date)).map((group, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{group.subject?.name}</span>
                  <span className="text-xs bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-mono">{group.subject?.code}</span>
                  {group.slot && <span className="text-xs text-slate-500 dark:text-slate-400">{group.slot.day} · {group.slot.start_time}–{group.slot.end_time} · Batch {group.slot.batch}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500 dark:text-slate-400">{group.date}</span>
                  <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-2.5 py-0.5 rounded-full text-xs font-semibold">{group.records.length} present</span>
                </div>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-slate-700">
                {group.records.map((r, ri) => (
                  <div key={r.id} className="flex items-center gap-3 px-5 py-2.5">
                    <span className="text-xs text-slate-300 dark:text-slate-600 w-5">{ri + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{r.students?.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">{r.students?.enrollment_no}</p>
                    </div>
                    <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-2 py-0.5 rounded text-xs">Present</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!Object.keys(grouped).length && (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">
              <FaFilter className="text-4xl mx-auto mb-3 opacity-30" />
              <p>No attendance records found</p>
              {(filterDate || filterSubject || searchStudent) && <p className="text-sm mt-1">Try clearing the filters</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}