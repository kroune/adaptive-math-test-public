import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface Props {
  startedAt: string;
  durationMinutes: number;
  onExpired: () => void;
}

const SYNC_INTERVAL_MS = 30_000;
const WARNING_THRESHOLD_MS = 5 * 60_000;

export default function SessionTimer({ startedAt, durationMinutes, onExpired }: Props) {
  const [remainingMs, setRemainingMs] = useState<number>(() => {
    const deadline = new Date(startedAt).getTime() + durationMinutes * 60_000;
    return Math.max(0, deadline - Date.now());
  });

  const clockOffsetRef = useRef(0);
  const expiredRef = useRef(false);

  const calcRemaining = useCallback(() => {
    const deadline = new Date(startedAt).getTime() + durationMinutes * 60_000;
    const correctedNow = Date.now() + clockOffsetRef.current;
    return Math.max(0, deadline - correctedNow);
  }, [startedAt, durationMinutes]);

  // Server time sync
  useEffect(() => {
    const syncTime = async () => {
      try {
        const before = Date.now();
        const { data } = await supabase.rpc('get_server_time');
        const after = Date.now();
        if (data) {
          const serverMs = new Date(data).getTime();
          const clientMs = (before + after) / 2;
          clockOffsetRef.current = serverMs - clientMs;
        }
      } catch {
        // keep existing offset
      }
    };

    void syncTime();
    const id = setInterval(syncTime, SYNC_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  // Countdown tick
  useEffect(() => {
    const id = setInterval(() => {
      const ms = calcRemaining();
      setRemainingMs(ms);
      if (ms <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpired();
      }
    }, 1_000);
    return () => clearInterval(id);
  }, [calcRemaining, onExpired]);

  const totalSec = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  const isWarning = remainingMs <= WARNING_THRESHOLD_MS;

  return (
    <div
      className={`fixed top-4 left-4 z-50 px-3 py-1.5 rounded-xl font-mono text-sm font-bold shadow-lg select-none transition-colors ${
        isWarning
          ? 'bg-rose text-white animate-pulse'
          : 'bg-white/90 dark:bg-surface-dark/90 text-charcoal dark:text-warm-white'
      }`}
    >
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  );
}
