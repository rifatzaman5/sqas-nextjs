'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FaPlus, FaPen, FaTrash, FaXmark } from 'react-icons/fa6';

interface Subject { id: number; name: string; code: string; branch: string; semester: number; teacher_id: number; teachers?: { name: string }; }
interface Teacher { id: number; name: string; }
const empty = { name: '', code: '', branch: 'Information Technology', semester: 5, teacher_id: '' };

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [form, setForm] = useState<typeof empty & { teacher_id: string | number }>(empty);
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    const [sr, tr] = await Promise.all([fetch('/api/subjects'), fetch('/api/teachers')]);
    if (sr.ok) setSubjects(await sr.json());
    if (tr.ok) setTeachers(await tr.json());
  };
  useEffect(() => { fetchAll(); }, []);

  const openAdd = () => { setEditing(null); setForm({ ...empty, teacher_id: teachers[0]?.id?.toString() || '' }); setModal(true); };
  const openEdit = (s: Subject) => { setEditing(s); setForm({ name: s.name, code: s.code, branch: s.branch, semester: s.semester, teacher_id: s.teacher_id?.toString() || '' }); setModal(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const body = editing ? { ...form, id: editing.id } : form;
    const r = await fetch('/api/subjects', { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (r.ok) { toast.success(editing ? 'Updated' : 'Added'); setModal(false); fetchAll(); }
    else { const d = await r.json(); toast.error(d.error || 'Error'); }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete?')) return;
    const r = await fetch('/api/subjects', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    if (r.ok) { toast.success('Deleted'); fetchAll(); } else toast.error('Error');
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-2xl font-bold text-slate-800">Subjects</h1><p className="text-slate-500 text-sm">{subjects.length} total</p></div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 text-sm font-medium"><FaPlus className="text-xs" />Add Subject</button>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-100 mb-4">
        {subjects.map(s => (
          <div key={s.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono font-semibold text-indigo-600 text-sm">{s.code}</p>
                <p className="font-semibold text-slate-800">{s.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.branch} · Sem {s.semester} · {s.teachers?.name || '—'}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><FaPen className="text-xs" /></button>
                <button onClick={() => handleDelete(s.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><FaTrash className="text-xs" /></button>
              </div>
            </div>
          </div>
        ))}
        {!subjects.length && <p className="text-center py-8 text-slate-400 text-sm">No subjects</p>}
      </div>

      <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
            <tr>{['Code', 'Name', 'Branch', 'Semester', 'Teacher', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {subjects.map(s => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono font-medium text-indigo-600">{s.code}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                <td className="px-4 py-3 text-slate-600">{s.branch}</td>
                <td className="px-4 py-3 text-slate-600">{s.semester}</td>
                <td className="px-4 py-3 text-slate-600">{s.teachers?.name || '—'}</td>
                <td className="px-4 py-3"><div className="flex gap-2">
                  <button onClick={() => openEdit(s)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><FaPen className="text-xs" /></button>
                  <button onClick={() => handleDelete(s.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><FaTrash className="text-xs" /></button>
                </div></td>
              </tr>
            ))}
            {!subjects.length && <tr><td colSpan={6} className="text-center py-8 text-slate-400">No subjects</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-semibold text-slate-800">{editing ? 'Edit Subject' : 'Add Subject'}</h2>
              <button onClick={() => setModal(false)}><FaXmark className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Subject Code</label>
                <input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                  <select value={form.semester} onChange={e => setForm({ ...form, semester: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800">
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s}>{s}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
                  <select value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800">
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 disabled:opacity-60">{loading ? 'Saving…' : editing ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
