import { useState } from 'react';
import { abandonSession as abandonSessionDB } from '../../../data/repositories/testSessionRepo';
import { logger } from '../../../lib/logger';
import type { FlowStep } from './useTestFlow';

interface UseEarlyExitDeps {
  sessionId: string | null;
  setStep: (step: FlowStep) => void;
}

export function useEarlyExit({ sessionId, setStep }: UseEarlyExitDeps) {
  const [isEarlyExit, setIsEarlyExit] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const handleEarlyExit = () => {
    setShowExitConfirm(true);
  };

  const confirmEarlyExit = async () => {
    if (!sessionId) return;
    setShowExitConfirm(false);
    setIsEarlyExit(true);
    logger.info('Early exit confirmed', { sessionId });
    try {
      await abandonSessionDB(sessionId);
    } catch {
      // Error already logged by DAL
    }
    setStep('results');
  };

  const dismissExitConfirm = () => {
    setShowExitConfirm(false);
  };

  return {
    isEarlyExit,
    setIsEarlyExit,
    showExitConfirm,
    handleEarlyExit,
    confirmEarlyExit,
    dismissExitConfirm,
  };
}
