import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import type { AnswerOption, Item } from '../../types';

export interface FetchItemsOptions {
  topicId: string;
  /** If provided and in range 1-11, filters by grade_min <= grade <= grade_max */
  grade?: number;
}

/**
 * Normalises a raw DB options value to AnswerOption[].
 * Handles legacy string[] format (before the AnswerOption migration was applied).
 */
function normalizeOptions(raw: unknown): AnswerOption[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((opt) =>
    typeof opt === 'string' ? { text: opt } : (opt as AnswerOption)
  );
}

function normalizeItem(raw: Record<string, unknown>): Item {
  return {
    ...(raw as unknown as Item),
    answer_type: (raw.answer_type as Item['answer_type']) ?? 'choice',
    options: normalizeOptions(raw.options),
    correct_option: raw.correct_option != null ? (raw.correct_option as number) : null,
    correct_text: (raw.correct_text as string | null) ?? null,
  };
}

export async function fetchItemsForTopic(opts: FetchItemsOptions): Promise<Item[]> {
  let query = supabase.from('items').select('*').eq('topic_id', opts.topicId);
  if (opts.grade !== undefined && opts.grade >= 1 && opts.grade <= 11) {
    query = query.lte('grade_min', opts.grade).gte('grade_max', opts.grade);
  }
  const { data, error } = await query;
  if (error) {
    logger.error('fetchItemsForTopic failed', error, { topicId: opts.topicId });
    throw error;
  }
  return (data as Record<string, unknown>[]).map(normalizeItem);
}

export async function fetchAllItems(): Promise<Item[]> {
  const { data, error } = await supabase.from('items').select('*');
  if (error) {
    logger.error('fetchAllItems failed', error);
    throw error;
  }
  return (data as Record<string, unknown>[]).map(normalizeItem);
}

export async function fetchAllItemBValues(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from('items').select('id, b');
  if (error) {
    logger.error('fetchAllItemBValues failed', error);
    throw error;
  }
  const map: Record<string, number> = {};
  (data as Array<{ id: string; b: number }>).forEach((it) => { map[it.id] = it.b; });
  return map;
}
