'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FaPlus, FaTrash, FaXmark } from 'react-icons/fa6';

interface TimetableSlot { id: number; day: string; start_time: string; end_time: string; room: string; batch: string; academic_year: string; subjects?: { name: string; code: string }; teachers?: { name: string }; }
interface Subject { id: number; name: string; code: string; }
interface Teacher { id: number; name: string; }

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const empty = { subject_id: '', teacher_id: '', day: 'Monday', start_time: '08:00', end_time: '09:00', room: 'Lab-1', batch: 'F22', branch: 'Information Technology', academic_year: '2025-26' };

export default function TimetablePage() {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [filterBatch, setFilterBatch] = useState('F22');

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
        <div><h1 className="text-2xl font-bold text-slate-800">Timetable</h1><p className="text-slate-500 text-sm">Academic Year 2025-26</p></div>
        <div className="flex gap-3">
          <select value={filterBatch} onChange={e => setFilterBatch(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-white">
            {['F22', 'F21', 'F20', 'F23'].map(b => <option key={b}>{b}</option>)}
          </select>
          <button onClick={() => { setForm({ ...empty, subject_id: subjects[0]?.id?.toString() || '', teacher_id: teachers[0]?.id?.toString() || '' }); setModal(true); }} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 text-sm font-medium"><FaPlus className="text-xs" />Add Slot</button>
        </div>
      </div>

      <div className="space-y-4">
        {DAYS.map(day => (
          <div key={day} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-700">{day}</h3>
              <span className="text-sm text-slate-400">{grouped[day]?.length || 0} classes</span>
            </div>
            <div className="divide-y divide-slate-50">
              {(grouped[day] || []).map(slot => (
                <div key={slot.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-mono text-blue-600 w-24">{slot.start_time} – {slot.end_time}</span>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{slot.subjects?.name} <span className="text-slate-400 font-normal text-xs">({slot.subjects?.code})</span></p>
                      <p className="text-xs text-slate-500">{slot.teachers?.name} • {slot.room}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(slot.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><FaTrash className="text-xs" /></button>
                </div>
              ))}
              {!grouped[day]?.length && <p className="px-5 py-3 text-sm text-gray-400">No classes</p>}
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-semibold text-slate-800">Add Timetable Slot</h2>
              <button onClick={() => setModal(false)}><FaXmark className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                  <select value={form.day} onChange={e => setForm({ ...form, day: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800">
                    {DAYS.map(d => <option key={d}>{d}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                  <select value={form.batch} onChange={e => setForm({ ...form, batch: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800">
                    {['F22', 'F21', 'F20', 'F23'].map(b => <option key={b}>{b}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800">
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
                <select value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800">
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                <input type="text" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-60">{loading ? 'Saving…' : 'Add Slot'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
