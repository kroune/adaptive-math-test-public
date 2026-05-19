import { insertItemAnswer } from '../../../data/repositories/testSessionRepo';
import { getNextItem } from '../../../domain/mst';
import { getLinearItemIds } from '../../../domain/topicProgression';
import { buildMotivationSegments } from '../../../domain/motivationQueue';
import { ITEMS_PER_TOPIC } from '../../../config';
import { withRetry } from '../../../lib/retry';
import { logger } from '../../../lib/logger';
import type React from 'react';
import type {
  AnswerPayload,
  Item,
  ItemAnswer,
  LinearTestConfig,
  PreviousAnswer,
  SessionState,
  Topic,
  MotivationTiming,
} from '../../../types';
import type { FlowStep } from './useTestFlow';
import type { MotivationNextAction } from './useMotivationFlow';

interface UseQuestionFlowDeps {
  session: SessionState | null;
  topics: Topic[];
  topicItems: Item[];
  currentItem: Item | null;
  setCurrentItem: React.Dispatch<React.SetStateAction<Item | null>>;
  selectTopic: (topicId: string) => void;
  recordAnswer: (answer: ItemAnswer, mstAnswer: PreviousAnswer) => void;
  completeTopic: () => void;
  loadItems: (opts: {
    topicId: string;
    grade: string;
    previousAnswers: PreviousAnswer[];
    shownItemIds: string[];
    fixedItemIds?: string[];
  }) => Promise<'loaded' | 'empty' | 'error'>;
  linearConfig: LinearTestConfig[];
  startMotivationSequence: (
    segments: { timing: MotivationTiming; topicId: string | null }[],
    nextAction: MotivationNextAction
  ) => void;
  setStep: (step: FlowStep) => void;
  setSessionError: (error: string | null) => void;
  markForceTerminated: () => void;
  preSessionGrade: string | null;
}

export function useQuestionFlow(deps: UseQuestionFlowDeps) {
  const {
    session, topics, topicItems, currentItem, setCurrentItem,
    selectTopic, recordAnswer, completeTopic, loadItems,
    linearConfig, startMotivationSequence, setStep, setSessionError,
    markForceTerminated, preSessionGrade,
  } = deps;

  const startNonadaptiveTopic = async (topicId: string) => {
    selectTopic(topicId);

    const fixedIds = getLinearItemIds(topicId, linearConfig);
    const result = await loadItems({
      topicId,
      grade: session?.grade ?? preSessionGrade ?? '0',
      previousAnswers: [],
      shownItemIds: [],
      fixedItemIds: fixedIds,
    });
    if (result === 'loaded') {
      setStep('question');
    } else if (result === 'empty') {
      handleTopicComplete();
    }
  };

  const handleTopicSelect = async (topicId: string) => {
    selectTopic(topicId);
    startMotivationSequence(
      [{ timing: 'before_topic', topicId }],
      { type: 'start-topic', topicId }
    );
  };

  const handleAnswer = async (
    payload: AnswerPayload,
    timeSpentMs: number,
    shownAt: string,
    answeredAt: string
  ) => {
    if (!session || !currentItem) return;

    let isCorrect: boolean;
    let answerGiven: number | null;
    let textAnswerGiven: string | null;

    if (payload.kind === 'choice') {
      isCorrect = payload.index === currentItem.correct_option;
      answerGiven = payload.index;
      textAnswerGiven = null;
    } else {
      const typed = payload.text.trim().toLowerCase();
      const correct = (currentItem.correct_text ?? '').trim().toLowerCase();
      isCorrect = typed === correct;
      answerGiven = null;
      textAnswerGiven = payload.text;
    }

    const answer: ItemAnswer = {
      id: crypto.randomUUID(),
      session_id: session.sessionId,
      item_id: currentItem.id,
      topic_id: session.currentTopicId!,
      answer_given: answerGiven,
      text_answer_given: textAnswerGiven,
      is_correct: isCorrect,
      time_spent_ms: timeSpentMs,
      shown_at: shownAt,
      answered_at: answeredAt,
    };

    const mstAnswer: PreviousAnswer = {
      itemId: currentItem.id,
      b: currentItem.b,
      se: currentItem.se,
      isCorrect,
    };

    logger.debug('Answer submitted', {
      itemId: currentItem.id,
      isCorrect,
      timeMs: timeSpentMs,
      topicId: session.currentTopicId,
    });

    try {
      await withRetry(() => insertItemAnswer(answer), { label: 'insertItemAnswer' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('time limit exceeded') || msg.includes('already finished')) {
        markForceTerminated();
        setStep('results');
        return;
      }
      setSessionError('Не удалось сохранить ответ. Попробуй ещё раз.');
      return;
    }

    recordAnswer(answer, mstAnswer);

    const updatedAnswers = [...(session.currentTopicAnswers ?? []), mstAnswer];
    const shownIds = new Set([...(session.shownItemIds ?? []), currentItem.id]);
    const remaining = topicItems.filter((it) => !shownIds.has(it.id));

    const isLinearMode = getLinearItemIds(session.currentTopicId!, linearConfig) !== undefined;
    const answeredInTopic = updatedAnswers.length;
    const itemLimit = isLinearMode ? remaining.length + answeredInTopic : ITEMS_PER_TOPIC;

    if (answeredInTopic >= itemLimit || remaining.length === 0) {
      handleTopicComplete(updatedAnswers);
      return;
    }

    const nextItem = isLinearMode ? (remaining[0] ?? null) : getNextItem(updatedAnswers, remaining);
    if (!nextItem) {
      handleTopicComplete(updatedAnswers);
      return;
    }

    setCurrentItem(nextItem);
  };

  const handleTopicComplete = (finalAnswers?: PreviousAnswer[]) => {
    if (!session) return;

    const topicAnswers = finalAnswers ?? session.currentTopicAnswers ?? [];
    const correct = topicAnswers.filter((a) => a.isCorrect).length;
    const completedTopicId = session.currentTopicId!;
    logger.info('Topic completed', {
      topicId: completedTopicId,
      answered: topicAnswers.length,
      correct,
    });

    const newCompletedCount = session.completedTopicIds.length + 1;
    completeTopic();

    const { segments, nextAction } = buildMotivationSegments(
      'after-topic-complete',
      {
        mode: session.mode,
        completedTopicId,
        topicOrder: session.topicOrder,
        completedCount: newCompletedCount,
        totalTopics: topics.length,
      }
    );

    startMotivationSequence(segments, nextAction);
  };

  return {
    handleAnswer,
    handleTopicSelect,
    startNonadaptiveTopic,
  };
}
