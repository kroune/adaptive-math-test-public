import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import type { LinearTestConfig } from '../../types';

export async function fetchLinearTestConfig(): Promise<LinearTestConfig[]> {
  const { data, error } = await supabase
    .from('linear_test_config')
    .select('*')
    .order('topic_order')
    .order('item_order');
  if (error) {
    logger.error('fetchLinearTestConfig failed', error);
    throw error;
  }
  return data as LinearTestConfig[];
}

export async function saveLinearTestConfig(
  entries: Omit<LinearTestConfig, 'id'>[]
): Promise<void> {
  // Fetch existing row IDs so we can delete them AFTER a successful insert.
  // This avoids the window where config is missing if the insert fails.
  const { data: existing, error: fetchErr } = await supabase
    .from('linear_test_config')
    .select('id');
  if (fetchErr) {
    logger.error('fetchLinearTestConfig (pre-save) failed', fetchErr);
    throw fetchErr;
  }

  const oldIds = (existing ?? []).map((r: { id: string }) => r.id);

  // Insert new rows first
  if (entries.length > 0) {
    const rows = entries.map((e) => ({
      id: crypto.randomUUID(),
      ...e,
    }));

    const { error: insertErr } = await supabase
      .from('linear_test_config')
      .insert(rows);
    if (insertErr) {
      logger.error('insertLinearTestConfig failed', insertErr);
      throw insertErr;
    }
  }

  // Delete old rows only after successful insert
  if (oldIds.length > 0) {
    const { error: deleteErr } = await supabase
      .from('linear_test_config')
      .delete()
      .in('id', oldIds);
    if (deleteErr) {
      logger.error('deleteOldLinearTestConfig failed', deleteErr);
      // New rows are already in place — log but don't throw
    }
  }
}
