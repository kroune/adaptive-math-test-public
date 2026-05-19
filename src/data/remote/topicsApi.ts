import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import type { Topic } from '../../types';

export async function fetchTopics(): Promise<Topic[]> {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .order('order_index');
  if (error) {
    logger.error('fetchTopics failed', error);
    throw error;
  }
  return data as Topic[];
}
