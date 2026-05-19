import type { MotivationQuestion, MotivationTiming } from '../types';

export interface MotivationSegment {
  timing: MotivationTiming;
  topicId: string | null;
}

export type MotivationNextAction =
  | { type: 'topic-select' }
  | { type: 'start-topic'; topicId: string }
  | { type: 'finish-session' };

/**
 * Find the next unshown motivation question from the queue.
 * Advances past exhausted segments automatically.
 *
 * Returns the question and the updated queue, or null when all segments are exhausted.
 */
export function findNextMotivationQuestion(
  queue: MotivationSegment[],
  allQuestions: MotivationQuestion[],
  shownIds: Set<string>
): { question: MotivationQuestion; remainingQueue: MotivationSegment[] } | null {
  const q = [...queue];

  while (q.length > 0) {
    const { timing, topicId } = q[0];

    const candidates = allQuestions
      .filter((mq) => mq.timing === timing)
      .filter((mq) => {
        if (timing === 'before_topic' || timing === 'after_topic') {
          return mq.topic_id === topicId || mq.topic_id === null;
        }
        return true;
      })
      .filter((mq) => !shownIds.has(mq.id))
      .sort((a, b) => a.order_index - b.order_index);

    if (candidates.length > 0) {
      return { question: candidates[0], remainingQueue: q };
    }

    // No questions for this segment — skip it
    q.shift();
  }

  return null;
}

/**
 * Build motivation segments + next action for a given flow transition.
 */
export function buildMotivationSegments(
  transition:
    | 'after-mode-select-adaptive'
    | 'after-mode-select-nonadaptive'
    | 'after-topic-select'
    | 'after-topic-complete',
  ctx: {
    topicId?: string;
    completedTopicId?: string;
    topicOrder: string[];
    completedCount: number;
    totalTopics: number;
    mode: 'adaptive' | 'nonadaptive';
  }
): { segments: MotivationSegment[]; nextAction: MotivationNextAction } {
  switch (transition) {
    case 'after-mode-select-adaptive':
      return {
        segments: [{ timing: 'before_test', topicId: null }],
        nextAction: { type: 'topic-select' },
      };

    case 'after-mode-select-nonadaptive': {
      const firstTopicId = ctx.topicOrder[0];
      return {
        segments: [
          { timing: 'before_test', topicId: null },
          { timing: 'before_topic', topicId: firstTopicId },
        ],
        nextAction: { type: 'start-topic', topicId: firstTopicId },
      };
    }

    case 'after-topic-select':
      return {
        segments: [{ timing: 'before_topic', topicId: ctx.topicId! }],
        nextAction: { type: 'start-topic', topicId: ctx.topicId! },
      };

    case 'after-topic-complete': {
      const allDone = ctx.completedCount >= ctx.totalTopics;

      if (allDone) {
        return {
          segments: [
            { timing: 'after_topic', topicId: ctx.completedTopicId! },
            { timing: 'after_test', topicId: null },
          ],
          nextAction: { type: 'finish-session' },
        };
      }

      if (ctx.mode === 'adaptive') {
        return {
          segments: [{ timing: 'after_topic', topicId: ctx.completedTopicId! }],
          nextAction: { type: 'topic-select' },
        };
      }

      // Nonadaptive: go to next topic
      const nextIdx = ctx.completedCount;
      if (nextIdx < ctx.topicOrder.length) {
        const nextTopicId = ctx.topicOrder[nextIdx];
        return {
          segments: [
            { timing: 'after_topic', topicId: ctx.completedTopicId! },
            { timing: 'before_topic', topicId: nextTopicId },
          ],
          nextAction: { type: 'start-topic', topicId: nextTopicId },
        };
      }

      // Fallback: all done
      return {
        segments: [
          { timing: 'after_topic', topicId: ctx.completedTopicId! },
          { timing: 'after_test', topicId: null },
        ],
        nextAction: { type: 'finish-session' },
      };
    }
  }
}
