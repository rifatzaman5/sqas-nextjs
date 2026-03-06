'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FaGear, FaLocationDot, FaClock, FaFloppyDisk, FaGraduationCap } from 'react-icons/fa6';

interface SettingsData {
  id: number;
  university_name: string;
  address: string;
  lat: number;
  lon: number;
  coverage: number;
  attendance_window: number;
}

export default function SettingsPage() {
  const [form, setForm] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(setForm);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const r = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (r.ok) {
      toast.success('Settings saved successfully');
    } else {
      const d = await r.json();
      toast.error(d.error || 'Error saving settings');
    }
    setLoading(false);
  };

  if (!form) return <div className="p-8 text-center text-slate-400 dark:text-slate-500">Loading settings…</div>;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <FaGear className="text-slate-600 dark:text-slate-400" /> System Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Configure university location, geofencing and attendance rules</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* University Info */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <FaGraduationCap className="text-indigo-500" /> University Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">University Name</label>
              <input
                type="text"
                value={form.university_name}
                onChange={e => setForm({ ...form, university_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 dark:bg-slate-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address</label>
              <input
                type="text"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 dark:bg-slate-700"
              />
            </div>
          </div>
        </div>

        {/* GPS Geofencing */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-2">
            <FaLocationDot className="text-red-500" /> GPS Geofencing
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Students must be within the coverage radius to mark attendance</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Latitude</label>
              <input
                type="number"
                step="0.0000001"
                value={form.lat}
                onChange={e => setForm({ ...form, lat: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 dark:bg-slate-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Longitude</label>
              <input
                type="number"
                step="0.0000001"
                value={form.lon}
                onChange={e => setForm({ ...form, lon: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 dark:bg-slate-700"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Coverage Radius (km) — current: <span className="text-blue-600 font-semibold">{form.coverage} km</span>
            </label>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={form.coverage}
              onChange={e => setForm({ ...form, coverage: parseFloat(e.target.value) })}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1">
              <span>0.1 km (strict)</span>
              <span>5 km (relaxed)</span>
            </div>
          </div>
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-300">
            <strong>Tip:</strong> Use Google Maps to find exact coordinates. Right-click on campus → click the coordinates to copy.
            <br />UoS Main Campus: <span className="font-mono">32.0740, 72.6861</span>
          </div>
        </div>

        {/* Attendance Window */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-2">
            <FaClock className="text-orange-500" /> Attendance Window
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">How long the QR code remains valid after generation</p>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              QR Valid Duration (minutes) — current: <span className="text-orange-600 font-semibold">{form.attendance_window} min</span>
            </label>
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={form.attendance_window}
              onChange={e => setForm({ ...form, attendance_window: parseInt(e.target.value) })}
              className="w-full accent-orange-600"
            />
            <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1">
              <span>5 min</span>
              <span>60 min</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-60 font-medium"
        >
          <FaFloppyDisk />
          {loading ? 'Saving…' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
