'use client';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { FaCamera, FaKeyboard, FaCircleCheck, FaCircleXmark, FaCalendarXmark } from 'react-icons/fa6';
import { getOrCreateDeviceId } from '@/lib/deviceId';

// Accepts a raw token string OR a full URL containing ?token=XXX
function extractToken(input: string): string {
  if (!input) return input;
  try {
    const url = new URL(input);
    const t = url.searchParams.get('token');
    if (t) return t;
  } catch { /* not a URL — treat as raw token */ }
  return input.trim();
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function MarkAttendancePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading…</div>}>
      <MarkAttendancePageInner />
    </Suspense>
  );
}

function MarkAttendancePageInner() {
  const today = WEEKDAYS[new Date().getDay()];
  const isWeekend = today === 'Saturday' || today === 'Sunday';
  const searchParams = useSearchParams();
  const urlToken = searchParams.get('token');
  const scannerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html5QrRef = useRef<any>(null);
  const [scanning, setScanning] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [tab, setTab] = useState<'camera' | 'manual'>('camera');
  const processedRef = useRef(false);
  const autoSubmittedRef = useRef(false);

  // Resolve a stable device id for device-binding
  useEffect(() => {
    setDeviceId(getOrCreateDeviceId());
  }, []);

  // Get location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => setLocation(null)
      );
    }
  }, []);

  const submitAttendance = useCallback(async (token: string) => {
    setSubmitting(true);
    try {
      const r = await fetch('/api/qr/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, lat: location?.lat, lon: location?.lon, deviceId }),
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
  }, [location, deviceId]);

  // Auto-submit if URL contains ?token=XXX (deep-link from QR scan via any scanner)
  useEffect(() => {
    if (!urlToken || autoSubmittedRef.current || result) return;
    autoSubmittedRef.current = true;
    // Tiny delay so location/deviceId have a chance to resolve
    const t = setTimeout(() => {
      submitAttendance(extractToken(urlToken));
    }, 600);
    return () => clearTimeout(t);
  }, [urlToken, result, submitAttendance]);

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
            await submitAttendance(extractToken(decodedText));
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

  const reset = () => {
    setResult(null);
    setManualToken('');
    processedRef.current = false;
  };

  if (result) {
    return (
      <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 md:p-8 max-w-sm w-full text-center">
          {result.success ? (
            <FaCircleCheck className="text-[#448843] text-6xl mx-auto mb-4" />
          ) : (
            <FaCircleXmark className="text-red-500 text-6xl mx-auto mb-4" />
          )}
          <h2 className={`text-xl font-bold mb-2 ${result.success ? 'text-[#3a7438]' : 'text-red-700'}`}>
            {result.success ? 'Attendance Marked!' : 'Failed'}
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">{result.message}</p>
          <button onClick={reset} className="px-6 py-3 bg-[#448843] text-white rounded-xl font-medium hover:bg-[#3a7438]">
            {result.success ? 'Done' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  if (isWeekend) {
    return (
      <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 md:p-8 max-w-sm w-full text-center">
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
        {location && <p className="text-xs text-[#3a7438] mt-1">✓ Location detected</p>}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-1 w-fit shadow-sm">
        <button onClick={() => setTab('camera')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'camera' ? 'bg-[#448843] text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
          <FaCamera /> Scan QR
        </button>
        <button onClick={() => setTab('manual')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'manual' ? 'bg-[#448843] text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
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
            <div className="flex items-center justify-center gap-2 text-sm text-[#3a7438]">
              <div className="w-2 h-2 bg-[#448843] rounded-full animate-pulse" />
              Camera active — point at QR code
            </div>
          )}
          {submitting && <p className="text-center text-sm text-[#007b8f] mt-2">Verifying attendance…</p>}
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
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#448843] text-slate-800 dark:text-slate-100 dark:bg-slate-700 resize-none"
          />
          <button
            onClick={() => submitAttendance(extractToken(manualToken))}
            disabled={!manualToken || submitting}
            className="mt-4 w-full bg-[#448843] text-white py-3 rounded-xl font-medium hover:bg-[#3a7438] disabled:opacity-50"
          >
            {submitting ? 'Verifying…' : 'Submit Attendance'}
          </button>
        </div>
      )}
    </div>
  );
}
