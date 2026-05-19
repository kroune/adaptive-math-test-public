import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import type { Session, ItemAnswer, MotivationAnswer } from '../../types';

const PAGE_SIZE = 1000;

async function fetchAllPaginated<T>(
  table: string,
  query: { select: string; order?: { column: string; ascending: boolean }; filter?: { column: string; op: 'eq'; value: string } }
): Promise<T[]> {
  const results: T[] = [];
  let from = 0;

  while (true) {
    let q = supabase.from(table).select(query.select).range(from, from + PAGE_SIZE - 1);
    if (query.order) q = q.order(query.order.column, { ascending: query.order.ascending });
    if (query.filter) q = q.eq(query.filter.column, query.filter.value);
    const { data, error } = await q;
    if (error) throw error;
    results.push(...(data as T[]));
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return results;
}

export async function fetchAllSessions(): Promise<Session[]> {
  try {
    return await fetchAllPaginated<Session>('sessions', {
      select: '*',
      order: { column: 'started_at', ascending: false },
    });
  } catch (error) {
    logger.error('fetchAllSessions failed', error);
    throw error;
  }
}

export async function fetchSessionById(id: string): Promise<Session> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    logger.error('fetchSessionById failed', error, { id });
    throw error;
  }
  return data as Session;
}

export async function fetchItemAnswersBySession(sessionId: string): Promise<ItemAnswer[]> {
  const { data, error } = await supabase
    .from('item_answers')
    .select('*')
    .eq('session_id', sessionId);
  if (error) {
    logger.error('fetchItemAnswersBySession failed', error, { sessionId });
    throw error;
  }
  return data as ItemAnswer[];
}

export async function fetchMotivationAnswersBySession(
  sessionId: string
): Promise<MotivationAnswer[]> {
  const { data, error } = await supabase
    .from('motivation_answers')
    .select('*')
    .eq('session_id', sessionId);
  if (error) {
    logger.error('fetchMotivationAnswersBySession failed', error, { sessionId });
    throw error;
  }
  return data as MotivationAnswer[];
}

export async function fetchAllItemAnswers(): Promise<
  Pick<ItemAnswer, 'session_id' | 'is_correct'>[]
> {
  try {
    return await fetchAllPaginated<Pick<ItemAnswer, 'session_id' | 'is_correct'>>('item_answers', {
      select: 'session_id, is_correct',
    });
  } catch (error) {
    logger.error('fetchAllItemAnswers failed', error);
    throw error;
  }
}

export async function fetchAllItemAnswersFull(): Promise<ItemAnswer[]> {
  try {
    return await fetchAllPaginated<ItemAnswer>('item_answers', { select: '*' });
  } catch (error) {
    logger.error('fetchAllItemAnswersFull failed', error);
    throw error;
  }
}

/**
 * Force-terminates all active (not yet finished) sessions.
 * Returns the number of sessions terminated.
 */
export async function forceTerminateAllActiveSessions(): Promise<number> {
  const { data, error } = await supabase
    .from('sessions')
    .update({ is_force_terminated: true, finished_at: new Date().toISOString() })
    .is('finished_at', null)
    .select('id');
  if (error) {
    logger.error('forceTerminateAllActiveSessions failed', error);
    throw error;
  }
  const count = (data as { id: string }[]).length;
  logger.info('Force terminated all active sessions', { count });
  return count;
}

export async function fetchAllMotivationAnswers(): Promise<MotivationAnswer[]> {
  try {
    return await fetchAllPaginated<MotivationAnswer>('motivation_answers', { select: '*' });
  } catch (error) {
    logger.error('fetchAllMotivationAnswers failed', error);
    throw error;
  }
}
