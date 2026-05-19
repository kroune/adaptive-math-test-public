import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';

export async function fetchAlgorithmCode(): Promise<string> {
  const { data, error } = await supabase
    .from('algorithm_config')
    .select('code')
    .eq('id', 1)
    .single();
  if (error) {
    // PGRST116 = row not found — no custom algorithm yet
    if ((error as { code?: string }).code === 'PGRST116') return '';
    logger.error('fetchAlgorithmCode failed', error);
    throw error;
  }
  return data?.code ?? '';
}

export async function saveAlgorithmCode(code: string): Promise<void> {
  const { error } = await supabase
    .from('algorithm_config')
    .upsert({ id: 1, code, updated_at: new Date().toISOString() });
  if (error) {
    logger.error('saveAlgorithmCode failed', error);
    throw error;
  }
}
