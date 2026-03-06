'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FaPlus, FaPen, FaTrash, FaXmark, FaMagnifyingGlass } from 'react-icons/fa6';

interface Student { id: number; enrollment_no: string; name: string; batch: string; semester: number; branch: string; email: string; phone: string; }

const empty = { enrollment_no: '', name: '', batch: 'F22', semester: 5, branch: 'Information Technology', email: '', phone: '', password: '' };

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchStudents = async () => {
    const res = await fetch('/api/students');
    if (res.ok) setStudents(await res.json());
  };

  useEffect(() => { fetchStudents(); }, []);

  const openAdd = () => { setEditing(null); setForm(empty); setModal(true); };
  const openEdit = (s: Student) => { setEditing(s); setForm({ ...s, password: '' } as typeof empty); setModal(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const method = editing ? 'PUT' : 'POST';
    const body = editing ? { ...form, id: editing.id } : form;
    const res = await fetch('/api/students', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) { toast.success(editing ? 'Student updated' : 'Student added'); setModal(false); fetchStudents(); }
    else { const d = await res.json(); toast.error(d.error || 'Error'); }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this student?')) return;
    const res = await fetch('/api/students', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    if (res.ok) { toast.success('Deleted'); fetchStudents(); } else toast.error('Error deleting');
  };

  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.enrollment_no.includes(search));

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Students</h1>
          <p className="text-slate-500 text-sm">{students.length} total students</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 text-sm font-medium">
          <FaPlus className="text-xs" /> Add Student
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-xs">
            <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or enrollment…" className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        {/* Mobile card view */}
        <div className="sm:hidden divide-y divide-slate-100">
          {filtered.map(s => (
            <div key={s.id} className="p-4">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="font-semibold text-slate-800">{s.name}</p>
                  <p className="text-xs font-mono text-indigo-600">{s.enrollment_no}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><FaPen className="text-xs" /></button>
                  <button onClick={() => handleDelete(s.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><FaTrash className="text-xs" /></button>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap mt-1.5">
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">{s.batch}</span>
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">Sem {s.semester}</span>
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">{s.branch}</span>
              </div>
              {s.email && <p className="text-xs text-slate-400 mt-1">{s.email}</p>}
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center py-8 text-slate-400 text-sm">No students found</p>}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                {['Enrollment', 'Name', 'Batch', 'Semester', 'Branch', 'Email', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-medium text-indigo-600">{s.enrollment_no}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                  <td className="px-4 py-3"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">{s.batch}</span></td>
                  <td className="px-4 py-3 text-slate-600">{s.semester}</td>
                  <td className="px-4 py-3 text-slate-500">{s.branch}</td>
                  <td className="px-4 py-3 text-slate-400">{s.email || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(s)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><FaPen className="text-xs" /></button>
                      <button onClick={() => handleDelete(s.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><FaTrash className="text-xs" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-slate-400">No students found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-semibold text-slate-800">{editing ? 'Edit Student' : 'Add Student'}</h2>
              <button onClick={() => setModal(false)} className="text-slate-400 hover:text-slate-600"><FaXmark /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {[
                { label: 'Enrollment No.', key: 'enrollment_no', type: 'text', required: true },
                { label: 'Full Name', key: 'name', type: 'text', required: true },
                { label: 'Email', key: 'email', type: 'email', required: false },
                { label: 'Phone', key: 'phone', type: 'text', required: false },
                { label: editing ? 'New Password (leave blank to keep)' : 'Password', key: 'password', type: 'password', required: !editing },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    value={(form as Record<string, unknown>)[f.key] as string || ''}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    required={f.required}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                  <select value={form.batch} onChange={e => setForm({ ...form, batch: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800">
                    {['F22', 'F21', 'F20', 'F23'].map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                  <select value={form.semester} onChange={e => setForm({ ...form, semester: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800">
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60">
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
