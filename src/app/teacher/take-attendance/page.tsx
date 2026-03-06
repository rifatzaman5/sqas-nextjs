'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { QrCode, RefreshCw, Copy, Timer, Users, CheckCircle } from 'lucide-react';

interface TimetableSlot {
  id: number;
  day: string;
  start_time: string;
  end_time: string;
  room: string;
  batch: string;
  subjects?: { name: string; code: string };
}

interface Attendee {
  id: number;
  date: string;
  students?: { name: string; enrollment_no: string };
  created_at: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function TakeAttendancePage() {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [selected, setSelected] = useState<TimetableSlot | null>(null);
  const [qrToken, setQrToken] = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [windowMinutes, setWindowMinutes] = useState(15);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [liveCount, setLiveCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch('/api/timetable')
      .then(r => r.json())
      .then(data => {
        setSlots(data);
        if (data.length > 0) setSelected(data[0]);
      });
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const secs = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setSecondsLeft(secs);
      if (secs === 0) {
        setQrToken('');
        setExpiresAt(null);
        stopPolling();
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // Live attendees polling
  const fetchAttendees = useCallback(async (timetableId: number) => {
    const today = new Date().toISOString().split('T')[0];
    const r = await fetch(`/api/attendance?date=${today}`);
    if (r.ok) {
      const data: Attendee[] = await r.json();
      const forSlot = data.filter((a: Attendee & { timetable_id?: number }) => a.timetable_id === timetableId || true);
      // Filter by timetable_id via the timetable relation
      const filtered = data.filter((a) => {
        const rec = a as Attendee & { timetable_id?: number };
        return rec.timetable_id === timetableId;
      });
      setAttendees(filtered);
      setLiveCount(filtered.length);
    }
  }, []);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const startPolling = (timetableId: number) => {
    stopPolling();
    fetchAttendees(timetableId);
    pollRef.current = setInterval(() => fetchAttendees(timetableId), 5000);
  };

  useEffect(() => () => stopPolling(), []);

  const generateQR = useCallback(async () => {
    if (!selected) return;
    setGenerating(true);
    const r = await fetch('/api/qr/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timetable_id: selected.id }),
    });
    if (r.ok) {
      const data = await r.json();
      setQrToken(data.token);
      setExpiresAt(new Date(data.expires_at));
      setWindowMinutes(data.window_minutes || 15);
      setAttendees([]);
      setLiveCount(0);
      startPolling(selected.id);
      toast.success(`QR code generated (valid ${data.window_minutes || 15} min)`);
    } else {
      const d = await r.json();
      toast.error(d.error || 'Error generating QR');
    }
    setGenerating(false);
  }, [selected]);

  const copyToken = () => { navigator.clipboard.writeText(qrToken); toast.success('Code copied!'); };
  const shareWhatsApp = () => {
    const msg = `📲 Attendance QR Code\n${selected?.subjects?.name} (${selected?.day} ${selected?.start_time}–${selected?.end_time})\n\nCode: ${qrToken}\n\n⏰ Valid for ${windowMinutes} minutes\n\nUniversity of Sargodha`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
  };

  const qrImageUrl = qrToken
    ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrToken)}&bgcolor=ffffff&color=1e293b`
    : null;

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const urgency = secondsLeft < 60 ? 'text-red-600' : secondsLeft < 180 ? 'text-orange-500' : 'text-green-600';
  const grouped = DAYS.reduce((acc, day) => ({ ...acc, [day]: slots.filter(s => s.day === day) }), {} as Record<string, TimetableSlot[]>);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Take Attendance</h1>
        <p className="text-gray-500 text-sm">Select a class, generate QR — students scan to mark attendance</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Timetable selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-700">Your Classes</h2>
          </div>
          <div className="divide-y divide-gray-50 max-h-[440px] overflow-y-auto">
            {DAYS.map(day => (
              grouped[day]?.length ? (
                <div key={day}>
                  <p className="px-5 py-2 text-xs font-semibold text-gray-400 uppercase bg-gray-50 sticky top-0">{day}</p>
                  {grouped[day].map(slot => (
                    <div
                      key={slot.id}
                      onClick={() => { setSelected(slot); setQrToken(''); setExpiresAt(null); setAttendees([]); stopPolling(); }}
                      className={`flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-blue-50 transition-colors ${selected?.id === slot.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{slot.subjects?.name} <span className="text-xs text-gray-400">({slot.subjects?.code})</span></p>
                        <p className="text-xs text-gray-500">{slot.start_time}–{slot.end_time} · {slot.room} · Batch {slot.batch}</p>
                      </div>
                      {selected?.id === slot.id && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                    </div>
                  ))}
                </div>
              ) : null
            ))}
            {!slots.length && <p className="text-center py-8 text-gray-400 text-sm">No timetable assigned</p>}
          </div>
        </div>

        {/* Right: QR + live count */}
        <div className="flex flex-col gap-4">
          {/* QR Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center p-6">
            {!qrToken ? (
              <div className="flex flex-col items-center justify-center gap-4 py-6 w-full">
                <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center">
                  <QrCode size={48} className="text-gray-300" />
                </div>
                <p className="text-gray-500 text-sm text-center">
                  {selected ? `Ready for ${selected.subjects?.name}` : 'Select a class first'}
                </p>
                <button
                  onClick={generateQR}
                  disabled={!selected || generating}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  <QrCode size={18} />
                  {generating ? 'Generating…' : 'Generate QR Code'}
                </button>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center">
                <div className="text-center mb-3">
                  <p className="font-semibold text-gray-800">{selected?.subjects?.name}</p>
                  <p className="text-sm text-gray-500">{selected?.day} · {selected?.start_time}–{selected?.end_time} · {selected?.room}</p>
                </div>

                {/* Timer */}
                <div className={`flex items-center gap-2 mb-3 text-xl font-bold ${urgency}`}>
                  <Timer size={20} />
                  {formatTime(secondsLeft)}
                  <span className="text-sm font-normal text-gray-400">remaining</span>
                </div>

                {/* QR */}
                <div className="border-4 border-gray-100 rounded-2xl p-2 mb-4">
                  {qrImageUrl && <img src={qrImageUrl} alt="QR Code" className="w-56 h-56 md:w-64 md:h-64 rounded-xl" />}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 justify-center mb-3">
                  <button onClick={generateQR} disabled={generating} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                    <RefreshCw size={13} /> Refresh
                  </button>
                  <button onClick={copyToken} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
                    <Copy size={13} /> Copy
                  </button>
                  <button onClick={shareWhatsApp} className="flex items-center gap-1.5 px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600">
                    📲 WhatsApp
                  </button>
                </div>

                {/* Manual code */}
                <div className="w-full bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">Manual entry code:</p>
                  <p className="font-mono text-xs text-gray-700 break-all select-all">{qrToken}</p>
                </div>
              </div>
            )}
          </div>

          {/* Live Attendees Panel */}
          {qrToken && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <h3 className="font-semibold text-gray-700 text-sm">Live Attendance</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                    <Users size={11} /> {liveCount} present
                  </span>
                  <span className="text-xs text-gray-400">auto-refresh 5s</span>
                </div>
              </div>
              <div className="max-h-56 overflow-y-auto">
                {attendees.length === 0 ? (
                  <p className="text-center py-6 text-gray-400 text-sm">Waiting for students to scan…</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {attendees.map((a, i) => (
                      <div key={a.id} className="flex items-center gap-3 px-5 py-2.5">
                        <span className="text-xs text-gray-400 w-5">{i + 1}</span>
                        <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{a.students?.name}</p>
                          <p className="text-xs font-mono text-gray-400">{a.students?.enrollment_no}</p>
                        </div>
                        <span className="text-xs text-gray-400">{new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}