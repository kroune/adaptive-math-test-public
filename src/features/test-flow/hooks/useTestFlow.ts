import { useState, useEffect, useRef } from 'react';
import { finishSession as finishSessionDB } from '../../../data/repositories/testSessionRepo';
import {
  loadPreSession,
  savePreSession,
  clearPreSession,
  type PreSessionData,
} from '../../../data/local/sessionStorage';
import { getLinearItemIds } from '../../../domain/topicProgression';
import { useSession } from './useSession';
import { useAppData } from './useAppData';
import { useTopicItems } from './useTopicItems';
import { useEarlyExit } from './useEarlyExit';
import { useMotivationFlow, type MotivationNextAction } from './useMotivationFlow';
import { useQuestionFlow } from './useQuestionFlow';
import { useSessionRestoration } from './useSessionRestoration';
import { useForceTerminationPolling } from './useForceTerminationPolling';
import { startSession as runStartup } from './sessionStartup';
import { ITEMS_PER_TOPIC, DEFAULT_TEST_DURATION_MINUTES } from '../../../config';
import { logger } from '../../../lib/logger';
import type {
  AnswerPayload,
  Item,
  LinearTestConfig,
  MotivationQuestion,
  SessionState,
  Topic,
} from '../../../types';

export type FlowStep =
  | 'auth'
  | 'mode'
  | 'motivation'
  | 'topic-select'
  | 'question'
  | 'results';

export interface UseTestFlowResult {
  step: FlowStep;
  session: SessionState | null;
  topics: Topic[];
  currentItem: Item | null;
  currentMotivation: MotivationQuestion | null;
  itemBValues: Record<string, number>;
  isEarlyExit: boolean;
  isForceTerminated: boolean;
  showExitConfirm: boolean;

  totalQuestionsInTopic: number;
  testDurationMinutes: number;

  loading: boolean;
  isLoadingItems: boolean;
  error: string | null;

  handleAuth: (data: { name: string; surname: string; school: string; grade: string }) => void;
  handleModeSelect: (mode: 'adaptive' | 'nonadaptive') => Promise<void>;
  handleMotivationAnswer: (answerIndex: number, shownAt: string, answeredAt: string) => Promise<void>;
  handleTopicSelect: (topicId: string) => Promise<void>;
  handleAnswer: (payload: AnswerPayload, timeSpentMs: number, shownAt: string, answeredAt: string) => Promise<void>;
  handleEarlyExit: () => void;
  confirmEarlyExit: () => Promise<void>;
  dismissExitConfirm: () => void;
  handleTimerExpired: () => Promise<void>;
  handleFinish: () => void;
}

export function useTestFlow(): UseTestFlowResult {
  const {
    session, startSession, selectTopic, recordAnswer, completeTopic, endSession, markForceTerminated,
  } = useSession();

  const { topics, motivationQuestions, loading, error: appError } = useAppData();
  const {
    topicItems, currentItem, itemBValues, loadItems, isLoadingItems, itemLoadError, setCurrentItem,
    resetTopicState,
  } = useTopicItems();

  const [step, setStep] = useState<FlowStep>('auth');
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [linearConfig, setLinearConfig] = useState<LinearTestConfig[]>([]);

  const [preSession, setPreSession] = useState<PreSessionData | null>(loadPreSession);

  useEffect(() => {
    if (preSession) savePreSession(preSession);
    else clearPreSession();
  }, [preSession]);

  const earlyExit = useEarlyExit({
    sessionId: session?.sessionId ?? null,
    setStep,
  });

  // Forward ref for startNonadaptiveTopic — needed because motivation queue calls it
  const questionFlowRef = useRef<{ startNonadaptiveTopic: (topicId: string) => Promise<void> }>(null);

  const doFinishSession = async () => {
    if (!session) return;
    try {
      await finishSessionDB(session.sessionId);
      logger.info('Session finished', { sessionId: session.sessionId, topics: session.completedTopicIds.length });
    } catch {
      // Error already logged by DAL; show results anyway
    }
    setStep('results');
  };

  const motivationFlow = useMotivationFlow({
    session,
    motivationQuestions,
    setStep,
    onQueueExhausted: (action: MotivationNextAction) => {
      switch (action.type) {
        case 'topic-select':
          setStep('topic-select');
          break;
        case 'start-topic':
          void questionFlowRef.current?.startNonadaptiveTopic(action.topicId);
          break;
        case 'finish-session':
          void doFinishSession();
          break;
      }
    },
  });

  const questionFlow = useQuestionFlow({
    session,
    topics,
    topicItems,
    currentItem,
    setCurrentItem,
    selectTopic,
    recordAnswer,
    completeTopic,
    loadItems,
    linearConfig,
    startMotivationSequence: motivationFlow.startMotivationSequence,
    setStep,
    setSessionError,
    markForceTerminated,
    preSessionGrade: preSession?.grade ?? null,
  });

  useEffect(() => {
    questionFlowRef.current = questionFlow;
  });

  const error = appError || itemLoadError || sessionError;

  const { restored } = useSessionRestoration({
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
  });

  useForceTerminationPolling({
    sessionId: session?.sessionId ?? null,
    step,
    markForceTerminated,
    setStep,
  });

  const handleAuth = (data: { name: string; surname: string; school: string; grade: string }) => {
    const ps: PreSessionData = {
      name: data.name.trim(),
      surname: data.surname.trim(),
      school: data.school.trim(),
      grade: data.grade.trim(),
    };
    setPreSession(ps);
    setStep('mode');
    logger.debug('Auth form submitted', { name: data.name, school: data.school, grade: data.grade });
  };

  const handleModeSelect = async (mode: 'adaptive' | 'nonadaptive') => {
    if (!preSession) return;

    let result;
    try {
      result = await runStartup({
        mode,
        topics,
        name: preSession.name,
        surname: preSession.surname,
        school: preSession.school,
        grade: preSession.grade,
      });
    } catch (err) {
      setSessionError(
        `Ошибка создания сессии: ${err instanceof Error ? err.message : String(err)}`,
      );
      return;
    }

    setLinearConfig(result.linearConfig);

    startSession({
      sessionId: result.sessionId,
      name: preSession.name,
      surname: preSession.surname,
      school: preSession.school,
      grade: preSession.grade,
      mode,
      topicOrder: result.topicOrder,
      startedAt: result.startedAt,
      testDurationMinutes: result.testDurationMinutes,
    });

    setPreSession(null);

    if (mode === 'adaptive') {
      motivationFlow.startMotivationSequence(
        [{ timing: 'before_test', topicId: null }],
        { type: 'topic-select' },
      );
    } else {
      const firstTopicId = result.topicOrder[0];
      if (!firstTopicId) {
        setSessionError('Нет доступных тем для тестирования.');
        return;
      }
      motivationFlow.startMotivationSequence(
        [
          { timing: 'before_test', topicId: null },
          { timing: 'before_topic', topicId: firstTopicId },
        ],
        { type: 'start-topic', topicId: firstTopicId },
      );
    }
  };

  const handleTimerExpired = async () => {
    if (!session) return;
    markForceTerminated();
    try {
      await finishSessionDB(session.sessionId);
    } catch {
      // Server trigger may have already finished the session
    }
    setStep('results');
  };

  const handleFinish = () => {
    endSession();
    motivationFlow.resetMotivationFlow();
    resetTopicState();
    setLinearConfig([]);
    setSessionError(null);
    earlyExit.setIsEarlyExit(false);
    setStep('auth');
  };

  return {
    step,
    session,
    topics,
    currentItem,
    currentMotivation: motivationFlow.currentMotivation,
    itemBValues,
    isEarlyExit: earlyExit.isEarlyExit,
    isForceTerminated: session?.isForceTerminated ?? false,
    totalQuestionsInTopic: (() => {
      if (topicItems.length === 0) return ITEMS_PER_TOPIC;
      const isLinear = session?.currentTopicId
        ? getLinearItemIds(session.currentTopicId, linearConfig) !== undefined
        : false;
      return isLinear ? topicItems.length : Math.min(topicItems.length, ITEMS_PER_TOPIC);
    })(),
    testDurationMinutes: session?.testDurationMinutes ?? DEFAULT_TEST_DURATION_MINUTES,
    showExitConfirm: earlyExit.showExitConfirm,
    loading: loading || !restored,
    isLoadingItems,
    error,
    handleAuth,
    handleModeSelect,
    handleMotivationAnswer: motivationFlow.handleMotivationAnswer,
    handleTopicSelect: questionFlow.handleTopicSelect,
    handleAnswer: questionFlow.handleAnswer,
    handleEarlyExit: earlyExit.handleEarlyExit,
    confirmEarlyExit: earlyExit.confirmEarlyExit,
    dismissExitConfirm: earlyExit.dismissExitConfirm,
    handleTimerExpired,
    handleFinish,
  };
}
