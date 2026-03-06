'use client';
import { useEffect, useState, useCallback } from 'react';
import { Download, Filter } from 'lucide-react';

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
    const params = new URLSearchParams();
    if (filterDate) params.set('date', filterDate);
    if (filterSubject) params.set('subject_id', filterSubject);
    const r = await fetch(`/api/attendance?${params}`);
    if (r.ok) {
      const data = await r.json();
      setRecords(data);
    }
    setLoading(false);
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
          <h1 className="text-2xl font-bold text-gray-800">Attendance Records</h1>
          <p className="text-gray-500 text-sm">{filtered.length} records · {uniqueDates} dates · {uniqueStudents} students</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex items-center gap-2 mb-3 text-sm text-gray-500 font-medium">
          <Filter size={14} /> Filters
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800" />
          <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white">
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
          </select>
          <input type="text" placeholder="Search student name / enrollment…" value={searchStudent} onChange={e => setSearchStudent(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800" />
        </div>
        {(filterDate || filterSubject || searchStudent) && (
          <button onClick={() => { setFilterDate(''); setFilterSubject(''); setSearchStudent(''); }} className="mt-2 text-xs text-red-500 hover:underline">
            × Clear all filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : (
        <div className="space-y-4">
          {Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date)).map((group, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-gray-800">{group.subject?.name}</span>
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-mono">{group.subject?.code}</span>
                  {group.slot && <span className="text-xs text-gray-500">{group.slot.day} · {group.slot.start_time}–{group.slot.end_time} · Batch {group.slot.batch}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{group.date}</span>
                  <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">{group.records.length} present</span>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {group.records.map((r, ri) => (
                  <div key={r.id} className="flex items-center gap-3 px-5 py-2.5">
                    <span className="text-xs text-gray-300 w-5">{ri + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{r.students?.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{r.students?.enrollment_no}</p>
                    </div>
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">Present</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!Object.keys(grouped).length && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">📋</p>
              <p>No attendance records found</p>
              {(filterDate || filterSubject || searchStudent) && <p className="text-sm mt-1">Try clearing the filters</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}