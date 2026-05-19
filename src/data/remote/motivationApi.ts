import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import type { MotivationQuestion } from '../../types';

export async function fetchMotivationQuestions(): Promise<MotivationQuestion[]> {
  const { data, error } = await supabase.from('motivation_questions').select('*');
  if (error) {
    logger.error('fetchMotivationQuestions failed', error);
    throw error;
  }
  return data as MotivationQuestion[];
}
