import { useState, useCallback, useEffect } from 'react';
import {
  loadSession,
  saveSession,
  clearSession,
} from '../../../data/local/sessionStorage';
import { setSupabaseSessionId } from '../../../lib/supabase';
import type { SessionState, ItemAnswer, PreviousAnswer } from '../../../types';

export { clearSession } from '../../../data/local/sessionStorage';

export function useSession() {
  const [session, setSession] = useState<SessionState | null>(loadSession);

  // Persist to localStorage on every state change
  useEffect(() => {
    if (session) {
      saveSession(session);
    }
  }, [session]);

  // Keep x-session-id header in sync so RLS policies can identify the session owner
  useEffect(() => {
    setSupabaseSessionId(session?.sessionId ?? null);
  }, [session?.sessionId]);

  const startSession = useCallback(
    (data: {
      sessionId: string;
      name: string;
      surname: string;
      school: string;
      grade: string;
      mode: 'adaptive' | 'nonadaptive';
      topicOrder: string[];
      startedAt: string;
      testDurationMinutes: number;
    }) => {
      const newSession: SessionState = {
        sessionId: data.sessionId,
        name: data.name,
        surname: data.surname,
        school: data.school,
        grade: data.grade,
        mode: data.mode,
        completedTopicIds: [],
        currentTopicId: null,
        topicOrder: data.topicOrder,
        currentTopicAnswers: [],
        shownItemIds: [],
        allAnswers: [],
        startedAt: data.startedAt,
        testDurationMinutes: data.testDurationMinutes,
      };
      setSession(newSession);
    },
    []
  );

  const selectTopic = useCallback((topicId: string) => {
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        currentTopicId: topicId,
        currentTopicAnswers: [],
        shownItemIds: [],
      };
    });
  }, []);

  const recordAnswer = useCallback(
    (answer: ItemAnswer, mstAnswer: PreviousAnswer) => {
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          currentTopicAnswers: [...prev.currentTopicAnswers, mstAnswer],
          shownItemIds: [...prev.shownItemIds, answer.item_id],
          allAnswers: [...prev.allAnswers, answer],
        };
      });
    },
    []
  );

  const completeTopic = useCallback(() => {
    setSession((prev) => {
      if (!prev || !prev.currentTopicId) return prev;
      return {
        ...prev,
        completedTopicIds: [...prev.completedTopicIds, prev.currentTopicId],
        currentTopicId: null,
        currentTopicAnswers: [],
        shownItemIds: [],
      };
    });
  }, []);

  const endSession = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const markForceTerminated = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      return { ...prev, isForceTerminated: true };
    });
  }, []);

  return {
    session,
    startSession,
    selectTopic,
    recordAnswer,
    completeTopic,
    endSession,
    markForceTerminated,
  };
}
