import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../../lib/supabase';
import { logger } from '../../../../lib/logger';

export interface UseTestDurationResult {
  /** null while loading; otherwise the persisted value. */
  testDuration: number | null;
  setTestDuration: (v: number) => void;
  saveTestDuration: (v: number) => Promise<void>;
  saving: boolean;
  /** User-facing error message from the last read or save attempt. */
  error: string | null;
  clearError: () => void;
}

/**
 * Read/write the global test-duration setting. The pre-refactor inline version
 * swallowed save failures via `try/finally` with no `catch`; this hook surfaces
 * both read and save failures on `error`.
 */
export function useTestDuration(): UseTestDurationResult {
  const [testDuration, setTestDuration] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('test_settings')
      .select('value')
      .eq('key', 'test_duration_minutes')
      .single()
      .then(({ data, error: readErr }) => {
        if (readErr) {
          logger.error('Failed to read test duration', readErr);
          setError(readErr.message || 'Не удалось загрузить настройку');
          return;
        }
        if (data) setTestDuration(parseInt(data.value, 10) || 0);
      });
  }, []);

  const saveTestDuration = useCallback(async (minutes: number) => {
    setSaving(true);
    setError(null);
    try {
      const { error: upsertErr } = await supabase
        .from('test_settings')
        .upsert({ key: 'test_duration_minutes', value: String(minutes) });
      if (upsertErr) throw upsertErr;
      setTestDuration(minutes);
    } catch (err) {
      logger.error('Failed to save test duration', err);
      setError(err instanceof Error ? err.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    testDuration,
    setTestDuration,
    saveTestDuration,
    saving,
    error,
    clearError: () => setError(null),
  };
}
