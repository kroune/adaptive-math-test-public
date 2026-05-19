import { useState, useEffect } from 'react';
import { fetchTopics } from '../../../data/repositories/topicsRepo';
import { fetchMotivationQuestions } from '../../../data/repositories/motivationRepo';
import { loadCustomAlgorithm, resetAlgorithmCache } from '../../../domain/mst';
import { withRetry } from '../../../lib/retry';
import { logger } from '../../../lib/logger';
import type { Topic, MotivationQuestion } from '../../../types';

export interface AppData {
  topics: Topic[];
  motivationQuestions: MotivationQuestion[];
  loading: boolean;
  error: string | null;
}

export function useAppData(): AppData {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [motivationQuestions, setMotivationQuestions] = useState<MotivationQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Reset algorithm cache so fresh code is loaded each session
        resetAlgorithmCache();

        const [loadedTopics, loadedQuestions] = await Promise.all([
          withRetry(fetchTopics, { label: 'fetchTopics' }),
          withRetry(fetchMotivationQuestions, { label: 'fetchMotivationQuestions' }),
          loadCustomAlgorithm(),
        ]);

        if (cancelled) return;
        setTopics(loadedTopics);
        setMotivationQuestions(loadedQuestions);
        logger.info('App data loaded', {
          topics: loadedTopics.length,
          questions: loadedQuestions.length,
        });
      } catch (err) {
        if (cancelled) return;
        logger.error('Failed to load app data', err);
        setError(
          `Ошибка загрузки данных: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { topics, motivationQuestions, loading, error };
}
