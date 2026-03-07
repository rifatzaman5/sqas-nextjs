'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FaPlus, FaTrash, FaXmark } from 'react-icons/fa6';

interface TimetableSlot { id: number; day: string; start_time: string; end_time: string; room: string; batch: string; academic_year: string; subjects?: { name: string; code: string }; teachers?: { name: string }; }
interface Subject { id: number; name: string; code: string; }
interface Teacher { id: number; name: string; }

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const empty = { subject_id: '', teacher_id: '', day: 'Monday', start_time: '08:00', end_time: '09:00', room: 'MAB CR-168', batch: 'BSIT-R0-2022', branch: 'Information Technology', academic_year: '2025-26' };

export default function TimetablePage() {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [filterBatch, setFilterBatch] = useState('BSIT-R0-2022');

  const fetchAll = async () => {
    const [sr, tr, rr] = await Promise.all([
      fetch('/api/subjects'), fetch('/api/teachers'),
      fetch(`/api/timetable?batch=${filterBatch}&academic_year=2025-26`),
    ]);
    if (sr.ok) setSubjects(await sr.json());
    if (tr.ok) { const t = await tr.json(); setTeachers(t); setForm(f => ({ ...f, teacher_id: t[0]?.id?.toString() || '' })); }
    if (rr.ok) setSlots(await rr.json());
  };
  useEffect(() => { fetchAll(); }, [filterBatch]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const r = await fetch('/api/timetable', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, subject_id: parseInt(form.subject_id as string), teacher_id: parseInt(form.teacher_id as string) }) });
    if (r.ok) { toast.success('Slot added'); setModal(false); fetchAll(); }
    else { const d = await r.json(); toast.error(d.error || 'Error'); }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete slot?')) return;
    const r = await fetch('/api/timetable', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    if (r.ok) { toast.success('Deleted'); fetchAll(); } else toast.error('Error');
  };

  const grouped = DAYS.reduce((acc, day) => ({ ...acc, [day]: slots.filter(s => s.day === day) }), {} as Record<string, TimetableSlot[]>);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Timetable</h1><p className="text-slate-500 dark:text-slate-400 text-sm">Academic Year 2025-26</p></div>
        <div className="flex gap-3">
          <select value={filterBatch} onChange={e => setFilterBatch(e.target.value)} className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800">
            {['BSIT-R0-2022', 'BSIT-R0-2021', 'BSIT-R0-2023', 'BSIT-R0-2020'].map(b => <option key={b}>{b}</option>)}
          </select>
          <button onClick={() => { setForm({ ...empty, subject_id: subjects[0]?.id?.toString() || '', teacher_id: teachers[0]?.id?.toString() || '' }); setModal(true); }} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 text-sm font-medium"><FaPlus className="text-xs" />Add Slot</button>
        </div>
      </div>

      <div className="space-y-4">
        {DAYS.map(day => (
          <div key={day} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-semibold text-slate-700 dark:text-slate-200">{day}</h3>
              <span className="text-sm text-slate-400 dark:text-slate-500">{grouped[day]?.length || 0} classes</span>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-700">
              {(grouped[day] || []).map(slot => (
                <div key={slot.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-mono text-blue-600 w-24">{slot.start_time} – {slot.end_time}</span>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{slot.subjects?.name} <span className="text-slate-400 dark:text-slate-500 font-normal text-xs">({slot.subjects?.code})</span></p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{slot.teachers?.name} • {slot.room}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(slot.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><FaTrash className="text-xs" /></button>
                </div>
              ))}
              {!grouped[day]?.length && <p className="px-5 py-3 text-sm text-slate-400 dark:text-slate-500">No classes</p>}
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b dark:border-slate-700">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">Add Timetable Slot</h2>
              <button onClick={() => setModal(false)}><FaXmark className="text-slate-400 dark:text-slate-500" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Day</label>
                  <select value={form.day} onChange={e => setForm({ ...form, day: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-800 dark:text-slate-100 dark:bg-slate-700">
                    {DAYS.map(d => <option key={d}>{d}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Batch</label>
                  <select value={form.batch} onChange={e => setForm({ ...form, batch: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-800 dark:text-slate-100 dark:bg-slate-700">
                    {['BSIT-R0-2022', 'BSIT-R0-2021', 'BSIT-R0-2023', 'BSIT-R0-2020'].map(b => <option key={b}>{b}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Time</label>
                  <input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-800 dark:text-slate-100 dark:bg-slate-700" /></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Time</label>
                  <input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-800 dark:text-slate-100 dark:bg-slate-700" /></div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                <select value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-800 dark:text-slate-100 dark:bg-slate-700">
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}</select></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teacher</label>
                <select value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-800 dark:text-slate-100 dark:bg-slate-700">
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Room</label>
                <input type="text" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-800 dark:text-slate-100 dark:bg-slate-700" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">{loading ? 'Saving…' : 'Add Slot'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
