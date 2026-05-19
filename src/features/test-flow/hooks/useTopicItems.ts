import { useState, useCallback } from 'react';
import { fetchItemsForTopic } from '../../../data/repositories/itemsRepo';
import { getNextItem } from '../../../domain/mst';
import { withRetry } from '../../../lib/retry';
import { logger } from '../../../lib/logger';
import type { Item, PreviousAnswer } from '../../../types';

export interface LoadItemsOpts {
  topicId: string;
  /** Raw grade string from session/preSession — parsed internally */
  grade: string;
  /** [] for a fresh topic, session.currentTopicAnswers when restoring */
  previousAnswers: PreviousAnswer[];
  /** [] for a fresh topic, session.shownItemIds when restoring */
  shownItemIds: string[];
  /** When provided, items are filtered and ordered by these IDs (linear test mode) */
  fixedItemIds?: string[];
}

export interface TopicItemsResult {
  topicItems: Item[];
  currentItem: Item | null;
  /** Accumulated b-values by item id (for ResultsPage when session is restored) */
  itemBValues: Record<string, number>;
  /** 'loaded' = next item ready, 'empty' = no items for this topic/grade, 'error' = fetch failed */
  loadItems: (opts: LoadItemsOpts) => Promise<'loaded' | 'empty' | 'error'>;
  isLoadingItems: boolean;
  itemLoadError: string | null;
  setCurrentItem: React.Dispatch<React.SetStateAction<Item | null>>;
  resetTopicState: () => void;
}

export function useTopicItems(): TopicItemsResult {
  const [topicItems, setTopicItems] = useState<Item[]>([]);
  const [currentItem, setCurrentItem] = useState<Item | null>(null);
  const [itemBValues, setItemBValues] = useState<Record<string, number>>({});
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [itemLoadError, setItemLoadError] = useState<string | null>(null);

  const loadItems = useCallback(async (opts: LoadItemsOpts): Promise<'loaded' | 'empty' | 'error'> => {
    const { topicId, grade, previousAnswers, shownItemIds, fixedItemIds } = opts;
    const studentGrade = parseInt(grade, 10);

    setIsLoadingItems(true);
    setItemLoadError(null);

    try {
      const items = await withRetry(
        () => fetchItemsForTopic({
          topicId,
          grade: Number.isNaN(studentGrade) ? undefined : studentGrade,
        }),
        { label: 'fetchItemsForTopic' },
      );

      // Accumulate b-values across topics for ResultsPage
      setItemBValues((prev) => {
        const updated = { ...prev };
        items.forEach((it) => { updated[it.id] = it.b; });
        return updated;
      });

      // Linear mode: filter and order by config
      let effectiveItems = items;
      if (fixedItemIds && fixedItemIds.length > 0) {
        const itemMap = new Map(items.map((it) => [it.id, it]));
        effectiveItems = fixedItemIds
          .map((id) => itemMap.get(id))
          .filter((it): it is Item => it !== undefined);
      }

      setTopicItems(effectiveItems);

      const shownSet = new Set(shownItemIds);
      const remaining = effectiveItems.filter((it) => !shownSet.has(it.id));

      let nextItem: Item | null;
      if (fixedItemIds && fixedItemIds.length > 0) {
        // Linear mode: pick first remaining in order
        nextItem = remaining[0] ?? null;
      } else {
        nextItem = getNextItem(previousAnswers, remaining);
      }

      if (!nextItem) {
        logger.warn('No next item after loading', {
          topicId,
          total: effectiveItems.length,
          remaining: remaining.length,
          mode: fixedItemIds ? 'linear' : 'mst',
        });
      }
      setCurrentItem(nextItem);
      return nextItem ? 'loaded' : 'empty';
    } catch (err) {
      logger.error('Failed to load topic items', err, { topicId });
      setItemLoadError(
        `Ошибка загрузки заданий: ${err instanceof Error ? err.message : String(err)}`
      );
      return 'error';
    } finally {
      setIsLoadingItems(false);
    }
  }, []);

  const resetTopicState = useCallback(() => {
    setTopicItems([]);
    setCurrentItem(null);
    setItemBValues({});
    setItemLoadError(null);
  }, []);

  return {
    topicItems,
    currentItem,
    itemBValues,
    loadItems,
    isLoadingItems,
    itemLoadError,
    setCurrentItem,
    resetTopicState,
  };
}
