import { useState, useRef, useEffect } from 'react';
import { fetchLinearTestConfig } from '../../../data/remote/linearConfigApi';
import { withRetry } from '../../../lib/retry';
import { getLinearItemIds } from '../../../domain/topicProgression';
import type { LinearTestConfig, SessionState, Topic } from '../../../types';
import type { PreSessionData } from '../../../data/local/sessionStorage';
import type { FlowStep } from './useTestFlow';

interface Deps {
  loading: boolean;
  appError: string | null;
  preSession: PreSessionData | null;
  session: SessionState | null;
  topics: Topic[];
  linearConfig: LinearTestConfig[];
  setLinearConfig: (cfg: LinearTestConfig[]) => void;
  loadItems: (opts: {
    topicId: string;
    grade: string;
    previousAnswers: SessionState['currentTopicAnswers'];
    shownItemIds: string[];
    fixedItemIds?: string[];
  }) => Promise<'loaded' | 'empty' | 'error'>;
  selectTopic: (topicId: string) => void;
  setStep: (step: FlowStep) => void;
}

/**
 * One-shot restoration of a persisted session on app mount. Decides the
 * initial flow step based on what was saved in localStorage; re-fetches the
 * linear test config when the saved session is nonadaptive (the ref is reset
 * on every mount, so without this items would degrade to random order).
 */
export function useSessionRestoration({
  loading,
  appError,
  preSession,
  session,
  topics,
  linearConfig,
  setLinearConfig,
  loadItems,
  selectTopic,
  setStep,
}: Deps): { restored: boolean } {
  const restoredRef = useRef(false);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    if (loading || restoredRef.current) return;
    if (topics.length === 0 && !appError) return;
    restoredRef.current = true;
    setRestored(true);

    if (!session) {
      setStep(preSession ? 'mode' : 'auth');
      return;
    }

    // Restore force-terminated sessions directly to results
    if (session.isForceTerminated) {
      setStep('results');
      return;
    }

    const doRestore = async () => {
      let restoredLinearConfig = linearConfig;
      if (session.mode === 'nonadaptive' && restoredLinearConfig.length === 0) {
        try {
          restoredLinearConfig = await withRetry(
            () => fetchLinearTestConfig(),
            { label: 'restoreLinearConfig' },
          );
          setLinearConfig(restoredLinearConfig);
        } catch {
          // Fallback: empty config → degraded (random order), log already handled
        }
      }

      if (session.currentTopicId) {
        const fixedIds = getLinearItemIds(session.currentTopicId, restoredLinearConfig);
        void loadItems({
          topicId: session.currentTopicId,
          grade: session.grade,
          previousAnswers: session.currentTopicAnswers ?? [],
          shownItemIds: session.shownItemIds ?? [],
          fixedItemIds: fixedIds,
        }).then((result) => { if (result === 'loaded') setStep('question'); });
        return;
      }

      if (session.completedTopicIds.length >= topics.length && topics.length > 0) {
        setStep('results');
        return;
      }

      if (session.mode === 'adaptive') {
        setStep('topic-select');
      } else {
        const nextIdx = session.completedTopicIds.length;
        if (nextIdx < session.topicOrder.length) {
          const nextTopicId = session.topicOrder[nextIdx];
          selectTopic(nextTopicId);
          const fixedIds = getLinearItemIds(nextTopicId, restoredLinearConfig);
          void loadItems({
            topicId: nextTopicId,
            grade: session.grade,
            previousAnswers: [],
            shownItemIds: [],
            fixedItemIds: fixedIds,
          }).then((result) => { if (result === 'loaded') setStep('question'); });
        } else {
          setStep('results');
        }
      }
    };

    void doRestore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, topics.length]);

  return { restored };
}
