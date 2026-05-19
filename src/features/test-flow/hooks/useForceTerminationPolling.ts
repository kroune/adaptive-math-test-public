import { useEffect } from 'react';
import { checkSessionForceTerminated } from '../../../data/remote/sessionsApi';
import { finishSession as finishSessionDB } from '../../../data/repositories/testSessionRepo';
import type { FlowStep } from './useTestFlow';

interface Deps {
  sessionId: string | null;
  step: FlowStep;
  markForceTerminated: () => void;
  setStep: (step: FlowStep) => void;
}

/**
 * Polls every 2s while the test is active to detect when the admin force-
 * terminates all sessions. Independent of the timer because force-termination
 * is initiated server-side and the client wouldn't otherwise notice.
 */
export function useForceTerminationPolling({
  sessionId,
  step,
  markForceTerminated,
  setStep,
}: Deps) {
  useEffect(() => {
    if (!sessionId || step === 'results' || step === 'auth' || step === 'mode') return;

    const intervalId = setInterval(async () => {
      try {
        const terminated = await checkSessionForceTerminated(sessionId);
        if (terminated) {
          markForceTerminated();
          try { await finishSessionDB(sessionId); } catch { /* already finished by admin */ }
          setStep('results');
        }
      } catch {
        // Silently ignore polling errors — session will be checked again next tick
      }
    }, 2_000);

    return () => clearInterval(intervalId);
  }, [sessionId, step, markForceTerminated, setStep]);
}
