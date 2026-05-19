import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import type { ItemAnswer } from '../../types';

export interface CreateSessionPayload {
  id: string;
  name: string;
  surname: string;
  school: string;
  grade: string;
  mode: 'adaptive' | 'nonadaptive';
  started_at: string;
}

export async function createSession(payload: CreateSessionPayload): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .insert({ ...payload, finished_at: null, is_early_exit: false });
  if (error) {
    logger.error('createSession failed', error, { mode: payload.mode });
    throw error;
  }
}

export async function finishSession(sessionId: string): Promise<void> {
  const { error } = await supabase.rpc('finish_session', { p_session_id: sessionId });
  if (error) {
    logger.error('finishSession failed', error, { sessionId });
    throw error;
  }
}

export async function abandonSession(sessionId: string): Promise<void> {
  const { error } = await supabase.rpc('abandon_session', { p_session_id: sessionId });
  if (error) {
    logger.error('abandonSession failed', error, { sessionId });
    throw error;
  }
}

export async function insertItemAnswer(answer: ItemAnswer): Promise<void> {
  const { error } = await supabase.from('item_answers').insert(answer);
  if (error) {
    logger.error('insertItemAnswer failed', error, { itemId: answer.item_id });
    throw error;
  }
}

export interface InsertMotivationAnswerPayload {
  id: string;
  session_id: string;
  question_id: string;
  answer_given: number;
  asked_before_topic_id: string | null;
  timing: string | null;
  shown_at: string | null;
  answered_at: string | null;
}

export async function checkSessionForceTerminated(sessionId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_session_force_terminated', {
    p_session_id: sessionId,
  });
  if (error) {
    logger.error('checkSessionForceTerminated failed', error, { sessionId });
    return false;
  }
  return data === true;
}

export async function insertMotivationAnswer(
  payload: InsertMotivationAnswerPayload
): Promise<void> {
  const { error } = await supabase.from('motivation_answers').insert(payload);
  if (error) {
    logger.error('insertMotivationAnswer failed', error, { questionId: payload.question_id });
    throw error;
  }
}
