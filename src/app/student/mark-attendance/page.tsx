'use client';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FaCamera, FaKeyboard, FaCircleCheck, FaCircleXmark, FaCalendarXmark } from 'react-icons/fa6';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function MarkAttendancePage() {
  const today = WEEKDAYS[new Date().getDay()];
  const isWeekend = today === 'Saturday' || today === 'Sunday';
  const scannerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html5QrRef = useRef<any>(null);
  const [scanning, setScanning] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [tab, setTab] = useState<'camera' | 'manual'>('camera');
  const processedRef = useRef(false);

  // Get location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => setLocation(null)
      );
    }
  }, []);

  // Start/stop camera scanner
  useEffect(() => {
    if (tab !== 'camera' || result) return;

    let scanner: any;
    const startScanner = async () => {
      const { Html5Qrcode } = await import('html5-qrcode');
      if (!scannerRef.current) return;
      scanner = new Html5Qrcode('qr-reader');
      html5QrRef.current = scanner;
      setScanning(true);
      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText: string) => {
            if (processedRef.current) return;
            processedRef.current = true;
            await scanner.stop();
            setScanning(false);
            await submitAttendance(decodedText);
          },
          undefined
        );
      } catch (err) {
        setScanning(false);
        console.error(err);
        toast.error('Camera not available. Use manual entry.');
        setTab('manual');
      }
    };

    startScanner();

    return () => {
      processedRef.current = false;
      if (scanner) {
        try { scanner.stop().catch(() => {}); } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, result]);

  const submitAttendance = async (token: string) => {
    setSubmitting(true);
    try {
      const r = await fetch('/api/qr/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, lat: location?.lat, lon: location?.lon }),
      });
      const data = await r.json();
      if (r.ok) {
        setResult({ success: true, message: data.message });
        toast.success(data.message);
      } else {
        setResult({ success: false, message: data.error });
        toast.error(data.error);
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setResult(null);
    setManualToken('');
    processedRef.current = false;
  };

  if (result) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-8 max-w-sm w-full text-center">
          {result.success ? (
            <FaCircleCheck className="text-green-500 text-6xl mx-auto mb-4" />
          ) : (
            <FaCircleXmark className="text-red-500 text-6xl mx-auto mb-4" />
          )}
          <h2 className={`text-xl font-bold mb-2 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
            {result.success ? 'Attendance Marked!' : 'Failed'}
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">{result.message}</p>
          <button onClick={reset} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700">
            {result.success ? 'Done' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  if (isWeekend) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-8 max-w-sm w-full text-center">
          <FaCalendarXmark className="text-amber-500 text-6xl mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">No Classes Today</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">It&apos;s {today} &mdash; university is off.</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm">Classes resume on Monday.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Mark Attendance</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Scan the QR code shown by your teacher</p>
        {!location && <p className="text-xs text-orange-500 mt-1">⚠️ Location not available — attendance may be rejected by proximity check</p>}
        {location && <p className="text-xs text-green-600 mt-1">✓ Location detected</p>}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-1 w-fit shadow-sm">
        <button onClick={() => setTab('camera')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'camera' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
          <FaCamera /> Scan QR
        </button>
        <button onClick={() => setTab('manual')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'manual' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
          <FaKeyboard /> Enter Code
        </button>
      </div>

      {tab === 'camera' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 max-w-md">
          <div
            id="qr-reader"
            ref={scannerRef}
            className="rounded-2xl overflow-hidden mb-4"
            style={{ minHeight: 280 }}
          />
          {scanning && (
            <div className="flex items-center justify-center gap-2 text-sm text-emerald-600">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Camera active — point at QR code
            </div>
          )}
          {submitting && <p className="text-center text-sm text-blue-600 mt-2">Verifying attendance…</p>}
        </div>
      )}

      {tab === 'manual' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 max-w-md">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Enter QR Code Manually</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Ask your teacher for the QR code text (format: SQAS-…)</p>
          <textarea
            value={manualToken}
            onChange={e => setManualToken(e.target.value.trim())}
            placeholder="Paste the QR code here…"
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100 dark:bg-slate-700 resize-none"
          />
          <button
            onClick={() => submitAttendance(manualToken)}
            disabled={!manualToken || submitting}
            className="mt-4 w-full bg-emerald-600 text-white py-3 rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? 'Verifying…' : 'Submit Attendance'}
          </button>
        </div>
      )}
    </div>
  );
}
