'use client';
import { useEffect, useState } from 'react';

interface AttendanceRecord {
  id: number;
  date: string;
  status: string;
  subjects?: { name: string; code: string };
  timetable?: { day: string; start_time: string; end_time: string };
}

interface SubjectTotal {
  subject_id: number;
  name: string;
  code: string;
  total: number; // total classes held
}

interface SubjectSummary {
  name: string;
  code: string;
  attended: number;
  total: number;
  percent: number;
}

function percentColor(p: number) {
  if (p >= 75) return 'text-green-600 bg-green-50';
  if (p >= 60) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
}

function ProgressBar({ percent }: { percent: number }) {
  const color = percent >= 75 ? 'bg-green-500' : percent >= 60 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
      <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${Math.min(percent, 100)}%` }} />
    </div>
  );
}

export default function StudentViewAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [totals, setTotals] = useState<SubjectTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/attendance').then(r => r.json()),
      fetch('/api/attendance?totals=1').then(r => r.json()),
    ]).then(([recs, tots]) => {
      setRecords(Array.isArray(recs) ? recs : []);
      setTotals(Array.isArray(tots) ? tots : []);
      setLoading(false);
    });
  }, []);

  // Build per-subject summary with percentage
  const summary: Record<string, SubjectSummary> = {};
  for (const r of records) {
    const key = r.subjects?.code || 'unknown';
    if (!summary[key]) summary[key] = { name: r.subjects?.name || 'Unknown', code: key, attended: 0, total: 0, percent: 0 };
    summary[key].attended++;
  }
  for (const t of totals) {
    if (summary[t.code]) {
      summary[t.code].total = t.total;
      summary[t.code].percent = t.total > 0 ? Math.round((summary[t.code].attended / t.total) * 100) : 0;
    }
  }

  const subjectCodes = Object.keys(summary);
  const filteredRecords = filterSubject
    ? records.filter(r => r.subjects?.code === filterSubject)
    : records;

  const overallPercent = subjectCodes.length > 0
    ? Math.round(subjectCodes.reduce((sum, k) => sum + summary[k].percent, 0) / subjectCodes.length)
    : 0;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Attendance</h1>
        <p className="text-gray-500 text-sm">{records.length} total records across {subjectCodes.length} subjects</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : (
        <>
          {/* Overall attendance badge */}
          {subjectCodes.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6 flex items-center gap-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold border-4 ${overallPercent >= 75 ? 'border-green-400 text-green-600 bg-green-50' : overallPercent >= 60 ? 'border-yellow-400 text-yellow-600 bg-yellow-50' : 'border-red-400 text-red-600 bg-red-50'}`}>
                {overallPercent}%
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-800">Overall Attendance</p>
                <p className="text-sm text-gray-500">Average across all subjects</p>
                <p className={`text-sm font-medium mt-1 ${overallPercent >= 75 ? 'text-green-600' : overallPercent >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {overallPercent >= 75 ? '✓ Good standing' : overallPercent >= 60 ? '⚠ Needs improvement' : '✗ Below minimum — attendance required'}
                </p>
              </div>
            </div>
          )}

          {/* Per-subject summary cards */}
          {subjectCodes.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {subjectCodes.map(code => {
                const s = summary[code];
                return (
                  <div
                    key={code}
                    onClick={() => setFilterSubject(filterSubject === code ? '' : code)}
                    className={`bg-white rounded-xl shadow-sm border cursor-pointer transition-all p-4 ${filterSubject === code ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-100 hover:border-gray-200'}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-xs text-gray-400 font-mono">{s.code}</p>
                        <p className="font-semibold text-gray-800 text-sm leading-tight">{s.name}</p>
                      </div>
                      <span className={`text-sm font-bold px-2 py-0.5 rounded-full ml-2 ${percentColor(s.percent)}`}>
                        {s.percent}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{s.attended} / {s.total || '?'} classes</p>
                    <ProgressBar percent={s.percent} />
                  </div>
                );
              })}
            </div>
          )}

          {/* Filter indicator */}
          {filterSubject && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-blue-600 font-medium">Showing: {summary[filterSubject]?.name}</span>
              <button onClick={() => setFilterSubject('')} className="text-xs text-gray-400 hover:text-gray-600 underline">Clear filter</button>
            </div>
          )}

          {/* Full records table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  {['Date', 'Subject', 'Code', 'Day & Time', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRecords.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{r.date}</td>
                    <td className="px-4 py-3 text-gray-700">{r.subjects?.name}</td>
                    <td className="px-4 py-3 font-mono text-gray-500 text-xs">{r.subjects?.code}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {r.timetable?.day} {r.timetable?.start_time}–{r.timetable?.end_time}
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">Present</span>
                    </td>
                  </tr>
                ))}
                {!filteredRecords.length && (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-400">No attendance records yet</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 75% rule note */}
          <p className="mt-4 text-xs text-gray-400 text-center">
            University of Sargodha requires minimum 75% attendance to appear in exams
          </p>
        </>
      )}
    </div>
  );
}

