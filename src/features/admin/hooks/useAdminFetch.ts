import { useState, useEffect, useCallback } from 'react';

export interface UseAdminFetchResult<T> {
  data: T;
  loading: boolean;
  fetchError: string | null;
  reload: () => void;
}

/**
 * Generic hook for admin pages that need to fetch data on mount and support reload.
 * Replaces the identical useEffect + reloadKey + cancelled + loading + fetchError
 * pattern used across all admin pages.
 */
export function useAdminFetch<T>(
  fetcher: () => Promise<T>,
  initialValue: T,
  errorMessage: string
): UseAdminFetchResult<T> {
  const [data, setData] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFetchError(null);

    (async () => {
      try {
        const result = await fetcher();
        if (cancelled) return;
        setData(result);
      } catch {
        if (!cancelled) setFetchError(errorMessage);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  return { data, loading, fetchError, reload };
}
