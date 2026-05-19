import { useState, useRef } from 'react';
import { insertMotivationAnswer } from '../../../data/repositories/testSessionRepo';
import {
  findNextMotivationQuestion,
  type MotivationSegment,
  type MotivationNextAction,
} from '../../../domain/motivationQueue';
import { withRetry } from '../../../lib/retry';
import { logger } from '../../../lib/logger';
import type { MotivationQuestion, MotivationTiming, SessionState } from '../../../types';
import type { FlowStep } from './useTestFlow';

export type { MotivationSegment, MotivationNextAction };

interface UseMotivationFlowDeps {
  session: SessionState | null;
  motivationQuestions: MotivationQuestion[];
  setStep: (step: FlowStep) => void;
  onQueueExhausted: (action: MotivationNextAction) => void;
}

export function useMotivationFlow({
  session,
  motivationQuestions,
  setStep,
  onQueueExhausted,
}: UseMotivationFlowDeps) {
  const [currentMotivation, setCurrentMotivation] = useState<MotivationQuestion | null>(null);
  const shownMotivationIdsRef = useRef<Set<string>>(new Set());
  const motivationQueueRef = useRef<MotivationSegment[]>([]);
  const motivationNextActionRef = useRef<MotivationNextAction>({ type: 'topic-select' });

  const advanceMotivationQueue = () => {
    const result = findNextMotivationQuestion(
      motivationQueueRef.current,
      motivationQuestions,
      shownMotivationIdsRef.current
    );

    if (result) {
      motivationQueueRef.current = result.remainingQueue;
      setCurrentMotivation(result.question);
      setStep('motivation');
    } else {
      motivationQueueRef.current = [];
      onQueueExhausted(motivationNextActionRef.current);
    }
  };

  const startMotivationSequence = (
    segments: { timing: MotivationTiming; topicId: string | null }[],
    nextAction: MotivationNextAction
  ) => {
    motivationQueueRef.current = [...segments];
    motivationNextActionRef.current = nextAction;
    advanceMotivationQueue();
  };

  const handleMotivationAnswer = async (answerIndex: number, shownAt: string, answeredAt: string) => {
    if (!session || !currentMotivation) return;

    const queueHead = motivationQueueRef.current[0] ?? null;

    try {
      await withRetry(
        () => insertMotivationAnswer({
          id: crypto.randomUUID(),
          session_id: session.sessionId,
          question_id: currentMotivation.id,
          answer_given: answerIndex,
          asked_before_topic_id: queueHead?.topicId ?? null,
          timing: currentMotivation.timing,
          shown_at: shownAt,
          answered_at: answeredAt,
        }),
        { label: 'insertMotivationAnswer' },
      );
      logger.debug('Motivation answer saved', {
        questionId: currentMotivation.id,
        answer: answerIndex,
        timing: currentMotivation.timing,
      });
    } catch {
      // Error already logged by DAL; don't block the flow
    }

    shownMotivationIdsRef.current.add(currentMotivation.id);
    setCurrentMotivation(null);

    advanceMotivationQueue();
  };

  const resetMotivationFlow = () => {
    shownMotivationIdsRef.current = new Set();
    motivationQueueRef.current = [];
    motivationNextActionRef.current = { type: 'topic-select' };
    setCurrentMotivation(null);
  };

  return {
    currentMotivation,
    handleMotivationAnswer,
    startMotivationSequence,
    resetMotivationFlow,
  };
}
