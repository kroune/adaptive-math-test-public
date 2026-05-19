import { createSession } from '../../../data/repositories/testSessionRepo';
import { fetchLinearTestConfig } from '../../../data/remote/linearConfigApi';
import { supabase } from '../../../lib/supabase';
import { withRetry } from '../../../lib/retry';
import { logger } from '../../../lib/logger';
import { determineTopicOrder } from '../../../domain/topicProgression';
import { DEFAULT_TEST_DURATION_MINUTES } from '../../../config';
import type { LinearTestConfig, Topic } from '../../../types';

export interface StartupResult {
  sessionId: string;
  startedAt: string;
  topicOrder: string[];
  testDurationMinutes: number;
  linearConfig: LinearTestConfig[];
}

async function fetchTestDuration(): Promise<number> {
  try {
    const { data } = await supabase
      .from('test_settings')
      .select('value')
      .eq('key', 'test_duration_minutes')
      .single();
    if (data) {
      const parsed = parseInt(data.value, 10);
      if (!Number.isNaN(parsed)) return Math.max(0, parsed);
    }
  } catch {
    // fall through
  }
  return DEFAULT_TEST_DURATION_MINUTES;
}

async function fetchServerStartTime(): Promise<string> {
  try {
    const { data } = await supabase.rpc('get_server_time');
    if (data) return new Date(data).toISOString();
  } catch {
    // fall through
  }
  return new Date().toISOString();
}

/**
 * Run the pre-session network calls in parallel and create the session row.
 * The pre-refactor implementation awaited test_settings, then linear config,
 * then server time, then createSession serially; this version overlaps the
 * three reads.
 */
export async function startSession(opts: {
  mode: 'adaptive' | 'nonadaptive';
  topics: Topic[];
  name: string;
  surname: string;
  school: string;
  grade: string;
}): Promise<StartupResult> {
  const sessionId = crypto.randomUUID();

  const [testDurationMinutes, startedAt, linearConfig] = await Promise.all([
    fetchTestDuration(),
    fetchServerStartTime(),
    opts.mode === 'nonadaptive'
      ? fetchLinearTestConfig().catch(() => [] as LinearTestConfig[])
      : Promise.resolve([] as LinearTestConfig[]),
  ]);

  const topicOrder = determineTopicOrder(opts.mode, opts.topics, linearConfig);

  await withRetry(
    () => createSession({
      id: sessionId,
      name: opts.name,
      surname: opts.surname,
      school: opts.school,
      grade: opts.grade,
      mode: opts.mode,
      started_at: startedAt,
    }),
    { label: 'createSession' },
  );

  logger.info('Session started', { sessionId, mode: opts.mode, grade: opts.grade, school: opts.school });

  return { sessionId, startedAt, topicOrder, testDurationMinutes, linearConfig };
}
