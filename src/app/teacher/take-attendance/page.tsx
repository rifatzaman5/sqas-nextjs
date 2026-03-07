'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { FaQrcode, FaArrowsRotate, FaCopy, FaWhatsapp, FaUsers, FaCircleCheck, FaCalendarXmark } from 'react-icons/fa6';
import { RiTimerLine } from 'react-icons/ri';

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

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const CLASS_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function getTodayName() {
  return WEEKDAYS[new Date().getDay()];
}

function getCurrentTime() {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

function getSlotStatus(slot: TimetableSlot, today: string): 'past' | 'active' | 'upcoming' | 'other-day' {
  if (slot.day !== today) return 'other-day';
  const now = getCurrentTime();
  if (now < slot.start_time) return 'upcoming';
  if (now >= slot.start_time && now <= slot.end_time) return 'active';
  return 'past';
}

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
  const [currentTime, setCurrentTime] = useState(getCurrentTime());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const today = getTodayName();
  const isWeekend = today === 'Saturday' || today === 'Sunday';

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(getCurrentTime()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch('/api/timetable')
      .then(r => r.json())
      .then(data => {
        setSlots(data);
        // Auto-select first today's class (active or upcoming), or first slot if none today
        const todaySlots = data.filter((s: TimetableSlot) => s.day === today);
        const activeSlot = todaySlots.find((s: TimetableSlot) => getSlotStatus(s, today) === 'active');
        const upcomingSlot = todaySlots.find((s: TimetableSlot) => getSlotStatus(s, today) === 'upcoming');
        setSelected(activeSlot || upcomingSlot || todaySlots[0] || data[0] || null);
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
    const todayDate = new Date().toISOString().split('T')[0];
    const r = await fetch(`/api/attendance?date=${todayDate}`);
    if (r.ok) {
      const data: Attendee[] = await r.json();
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
    const msg = `\u{1F4F2} Attendance QR Code\n${selected?.subjects?.name} (${selected?.day} ${selected?.start_time}\u2013${selected?.end_time})\n\nCode: ${qrToken}\n\n\u23F0 Valid for ${windowMinutes} minutes\n\nUniversity of Sargodha`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
  };

  const qrImageUrl = qrToken
    ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrToken)}&bgcolor=ffffff&color=1e293b`
    : null;

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const urgency = secondsLeft < 60 ? 'text-red-600' : secondsLeft < 180 ? 'text-orange-500' : 'text-green-600';

  // Group: today's classes first, then rest of the week
  const todaySlots = slots.filter(s => s.day === today);
  const otherSlots = slots.filter(s => s.day !== today);
  const otherGrouped = CLASS_DAYS.filter(d => d !== today).reduce((acc, day) => {
    const daySlots = otherSlots.filter(s => s.day === day);
    if (daySlots.length) acc[day] = daySlots;
    return acc;
  }, {} as Record<string, TimetableSlot[]>);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Take Attendance</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          {today}, {new Date().toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}
          {!isWeekend && <span className="ml-2 text-slate-400 dark:text-slate-500">&middot; {currentTime}</span>}
        </p>
      </div>

      {/* Weekend banner */}
      {isWeekend && (
        <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 flex items-center gap-4">
          <FaCalendarXmark className="text-amber-500 text-2xl flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-300">No Classes Today</p>
            <p className="text-sm text-amber-600 dark:text-amber-400">It&apos;s {today} &mdash; university is off. Your next classes are on Monday.</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Timetable selector */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h2 className="font-semibold text-slate-700 dark:text-slate-200">Your Classes</h2>
            {!isWeekend && todaySlots.length > 0 && (
              <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full text-xs font-medium">
                {todaySlots.length} today
              </span>
            )}
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-700 max-h-[480px] overflow-y-auto">
            {/* Today's classes */}
            {!isWeekend && todaySlots.length > 0 && (
              <div>
                <p className="px-5 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase bg-blue-50 dark:bg-blue-900/20 sticky top-0 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  Today &mdash; {today}
                </p>
                {todaySlots.map(slot => {
                  const status = getSlotStatus(slot, today);
                  return (
                    <div
                      key={slot.id}
                      onClick={() => { setSelected(slot); setQrToken(''); setExpiresAt(null); setAttendees([]); stopPolling(); }}
                      className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors
                        ${selected?.id === slot.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : 'hover:bg-blue-50 dark:hover:bg-blue-900/20'}
                        ${status === 'past' ? 'opacity-50' : ''}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                            {slot.subjects?.name} <span className="text-xs text-slate-400 dark:text-slate-500">({slot.subjects?.code})</span>
                          </p>
                          {status === 'active' && (
                            <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase flex-shrink-0">Now</span>
                          )}
                          {status === 'upcoming' && (
                            <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase flex-shrink-0">Next</span>
                          )}
                          {status === 'past' && (
                            <span className="bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase flex-shrink-0">Done</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{slot.start_time}&ndash;{slot.end_time} &middot; {slot.room}</p>
                      </div>
                      {selected?.id === slot.id && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                    </div>
                  );
                })}
              </div>
            )}

            {/* No classes today message (weekday only) */}
            {!isWeekend && todaySlots.length === 0 && slots.length > 0 && (
              <div className="px-5 py-4 bg-slate-50 dark:bg-slate-700/30">
                <p className="text-sm text-slate-500 dark:text-slate-400">No classes scheduled for {today}</p>
              </div>
            )}

            {/* Other days */}
            {Object.entries(otherGrouped).map(([day, daySlots]) => (
              <div key={day}>
                <p className="px-5 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase bg-slate-50 dark:bg-slate-700/50 sticky top-0">{day}</p>
                {daySlots.map(slot => (
                  <div
                    key={slot.id}
                    onClick={() => { setSelected(slot); setQrToken(''); setExpiresAt(null); setAttendees([]); stopPolling(); }}
                    className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors opacity-60
                      ${selected?.id === slot.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 opacity-100' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{slot.subjects?.name} <span className="text-xs text-slate-400 dark:text-slate-500">({slot.subjects?.code})</span></p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{slot.start_time}&ndash;{slot.end_time} &middot; {slot.room}</p>
                    </div>
                    {selected?.id === slot.id && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                  </div>
                ))}
              </div>
            ))}
            {!slots.length && <p className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">No timetable assigned</p>}
          </div>
        </div>

        {/* Right: QR + live count */}
        <div className="flex flex-col gap-4">
          {/* QR Panel */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center p-6">
            {!qrToken ? (
              <div className="flex flex-col items-center justify-center gap-4 py-6 w-full">
                <div className="w-24 h-24 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center">
                  <FaQrcode className="text-5xl text-slate-300 dark:text-slate-500" />
                </div>
                {selected ? (
                  <>
                    <div className="text-center">
                      <p className="text-slate-700 dark:text-slate-200 font-medium">{selected.subjects?.name}</p>
                      <p className="text-slate-400 dark:text-slate-500 text-sm">{selected.day} &middot; {selected.start_time}&ndash;{selected.end_time} &middot; {selected.room}</p>
                      {selected.day !== today && (
                        <p className="text-amber-600 dark:text-amber-400 text-xs mt-1 font-medium">This class is on {selected.day}, not today</p>
                      )}
                    </div>
                    <button
                      onClick={generateQR}
                      disabled={generating}
                      className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium"
                    >
                      <FaQrcode />
                      {generating ? 'Generating\u2026' : 'Generate QR Code'}
                    </button>
                  </>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 text-sm text-center">Select a class first</p>
                )}
              </div>
            ) : (
              <div className="w-full flex flex-col items-center">
                <div className="text-center mb-3">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{selected?.subjects?.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{selected?.day} &middot; {selected?.start_time}&ndash;{selected?.end_time} &middot; {selected?.room}</p>
                </div>

                {/* Timer */}
                <div className={`flex items-center gap-2 mb-3 text-xl font-bold ${urgency}`}>
                  <RiTimerLine />
                  {formatTime(secondsLeft)}
                  <span className="text-sm font-normal text-slate-400">remaining</span>
                </div>

                {/* QR */}
                <div className="border-4 border-gray-100 dark:border-slate-600 rounded-2xl p-2 mb-4">
                  {qrImageUrl && <img src={qrImageUrl} alt="QR Code" className="w-56 h-56 md:w-64 md:h-64 rounded-xl" />}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 justify-center mb-3">
                  <button onClick={generateQR} disabled={generating} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 disabled:opacity-50">
                    <FaArrowsRotate className="text-xs" /> Refresh
                  </button>
                  <button onClick={copyToken} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm hover:bg-slate-200 dark:hover:bg-slate-600">
                    <FaCopy className="text-xs" /> Copy
                  </button>
                  <button onClick={shareWhatsApp} className="flex items-center gap-1.5 px-3 py-2 bg-green-500 text-white rounded-xl text-sm hover:bg-green-600">
                    <FaWhatsapp /> WhatsApp
                  </button>
                </div>

                {/* Manual code */}
                <div className="w-full bg-slate-50 dark:bg-slate-700 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Manual entry code:</p>
                  <p className="font-mono text-xs text-slate-700 dark:text-slate-300 break-all select-all">{qrToken}</p>
                </div>
              </div>
            )}
          </div>

          {/* Live Attendees Panel */}
          {qrToken && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Live Attendance</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                    <FaUsers className="text-xs" /> {liveCount} present
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">auto-refresh 5s</span>
                </div>
              </div>
              <div className="max-h-56 overflow-y-auto">
                {attendees.length === 0 ? (
                  <p className="text-center py-6 text-slate-400 dark:text-slate-500 text-sm">Waiting for students to scan&hellip;</p>
                ) : (
                  <div className="divide-y divide-slate-50 dark:divide-slate-700">
                    {attendees.map((a, i) => (
                      <div key={a.id} className="flex items-center gap-3 px-5 py-2.5">
                        <span className="text-xs text-slate-400 dark:text-slate-500 w-5">{i + 1}</span>
                        <FaCircleCheck className="text-green-500 text-sm flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{a.students?.name}</p>
                          <p className="text-xs font-mono text-slate-400 dark:text-slate-500">{a.students?.enrollment_no}</p>
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500">{new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
