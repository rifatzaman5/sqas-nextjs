'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FaPlus, FaPen, FaTrash, FaXmark } from 'react-icons/fa6';

interface Teacher { id: number; name: string; email: string; phone: string; designation: string; department: string; subject: string; }
const empty = { name: '', email: '', phone: '', designation: 'Lecturer', department: 'Information Technology', subject: '', password: '' };

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);

  const fetch_ = async () => { const r = await fetch('/api/teachers'); if (r.ok) setTeachers(await r.json()); };
  useEffect(() => { fetch_(); }, []);

  const openAdd = () => { setEditing(null); setForm(empty); setModal(true); };
  const openEdit = (t: Teacher) => { setEditing(t); setForm({ ...t, password: '' }); setModal(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const body = editing ? { ...form, id: editing.id } : form;
    const r = await fetch('/api/teachers', { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (r.ok) { toast.success(editing ? 'Updated' : 'Added'); setModal(false); fetch_(); }
    else { const d = await r.json(); toast.error(d.error || 'Error'); }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete?')) return;
    const r = await fetch('/api/teachers', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    if (r.ok) { toast.success('Deleted'); fetch_(); } else toast.error('Error');
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Teachers</h1><p className="text-slate-500 dark:text-slate-400 text-sm">{teachers.length} total</p></div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 text-sm font-medium"><FaPlus className="text-xs" />Add Teacher</button>
      </div>

      {/* Mobile card view */}
      <div className="sm:hidden bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 mb-4">
        {teachers.map(t => (
          <div key={t.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">{t.name}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{t.designation} · {t.department}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(t)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><FaPen className="text-xs" /></button>
                <button onClick={() => handleDelete(t.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><FaTrash className="text-xs" /></button>
              </div>
            </div>
            {t.email && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t.email}</p>}
          </div>
        ))}
        {!teachers.length && <p className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">No teachers</p>}
      </div>

      <div className="hidden sm:block bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 uppercase text-xs">
            <tr>{['ID', 'Name', 'Designation', 'Department', 'Subject', 'Email', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {teachers.map(t => (
              <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="px-4 py-3 font-mono text-indigo-600 dark:text-indigo-400 font-medium">{t.id}</td>
                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{t.name}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{t.designation}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{t.department}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{t.subject || '—'}</td>
                <td className="px-4 py-3 text-slate-400 dark:text-slate-500">{t.email || '—'}</td>
                <td className="px-4 py-3"><div className="flex gap-2">
                  <button onClick={() => openEdit(t)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><FaPen className="text-xs" /></button>
                  <button onClick={() => handleDelete(t.id)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><FaTrash className="text-xs" /></button>
                </div></td>
              </tr>
            ))}
            {!teachers.length && <tr><td colSpan={7} className="text-center py-8 text-slate-400 dark:text-slate-500">No teachers</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b dark:border-slate-700">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">{editing ? 'Edit Teacher' : 'Add Teacher'}</h2>
              <button onClick={() => setModal(false)}><FaXmark className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {[
                { label: 'Full Name', key: 'name', required: true },
                { label: 'Email', key: 'email', required: false },
                { label: 'Phone', key: 'phone', required: false },
                { label: 'Designation', key: 'designation', required: false },
                { label: 'Subject', key: 'subject', required: false },
                { label: editing ? 'New Password' : 'Password', key: 'password', required: !editing },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{f.label}</label>
                  <input
                    type={f.key === 'password' ? 'password' : 'text'}
                    value={(form as Record<string, unknown>)[f.key] as string || ''}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    required={f.required}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-slate-100 dark:bg-slate-700"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-60">
                  {loading ? 'Saving…' : editing ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
