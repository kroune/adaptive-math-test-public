import { useState, useEffect } from 'react';
import { fetchTopics } from '../../../data/repositories/topicsRepo';
import { fetchAllItems } from '../../../data/repositories/itemsRepo';
import { fetchLinearTestConfig, saveLinearTestConfig } from '../../../data/remote/linearConfigApi';
import type { Topic, Item, LinearTestConfig } from '../../../types';
import { logger } from '../../../lib/logger';
import AdminLoadingSpinner from '../../../components/AdminLoadingSpinner';
import AdminFetchError from '../../../components/AdminFetchError';

interface TopicEntry {
  topicId: string;
  topicOrder: number;
  selectedItemIds: string[]; // ordered
}

export default function LinearTestPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [entries, setEntries] = useState<TopicEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFetchError(null);
    (async () => {
      try {
        const [loadedTopics, loadedItems, loadedConfig] = await Promise.all([
          fetchTopics(),
          fetchAllItems(),
          fetchLinearTestConfig(),
        ]);
        if (cancelled) return;
        setTopics(loadedTopics);
        setItems(loadedItems);

        // Build entries from config or initialize empty
        if (loadedConfig.length > 0) {
          const byTopic = new Map<string, { topicOrder: number; itemIds: { id: string; order: number }[] }>();
          for (const c of loadedConfig) {
            const existing = byTopic.get(c.topic_id) ?? { topicOrder: c.topic_order, itemIds: [] };
            existing.itemIds.push({ id: c.item_id, order: c.item_order });
            byTopic.set(c.topic_id, existing);
          }
          const built: TopicEntry[] = [];
          for (const [topicId, data] of byTopic) {
            data.itemIds.sort((a, b) => a.order - b.order);
            built.push({
              topicId,
              topicOrder: data.topicOrder,
              selectedItemIds: data.itemIds.map((i) => i.id),
            });
          }
          built.sort((a, b) => a.topicOrder - b.topicOrder);
          setEntries(built);
        } else {
          setEntries(
            loadedTopics.map((t, i) => ({
              topicId: t.id,
              topicOrder: i + 1,
              selectedItemIds: [],
            }))
          );
        }
      } catch {
        if (!cancelled) setFetchError('Не удалось загрузить данные');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);

    const configEntries: Omit<LinearTestConfig, 'id'>[] = [];
    for (const entry of entries) {
      for (let i = 0; i < entry.selectedItemIds.length; i++) {
        configEntries.push({
          topic_id: entry.topicId,
          item_id: entry.selectedItemIds[i],
          topic_order: entry.topicOrder,
          item_order: i + 1,
        });
      }
    }

    try {
      await saveLinearTestConfig(configEntries);
      logger.info('Linear test config saved', { entries: configEntries.length });
      setSaveMsg('Сохранено');
      setTimeout(() => setSaveMsg(null), 2000);
    } catch (err) {
      setSaveMsg(`Ошибка: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const moveTopicUp = (idx: number) => {
    if (idx === 0) return;
    setEntries((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next.map((e, i) => ({ ...e, topicOrder: i + 1 }));
    });
  };

  const moveTopicDown = (idx: number) => {
    setEntries((prev) => {
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next.map((e, i) => ({ ...e, topicOrder: i + 1 }));
    });
  };

  const toggleItem = (topicIdx: number, itemId: string) => {
    setEntries((prev) => {
      const next = [...prev];
      const entry = { ...next[topicIdx] };
      if (entry.selectedItemIds.includes(itemId)) {
        entry.selectedItemIds = entry.selectedItemIds.filter((id) => id !== itemId);
      } else {
        entry.selectedItemIds = [...entry.selectedItemIds, itemId];
      }
      next[topicIdx] = entry;
      return next;
    });
  };

  const moveItemUp = (topicIdx: number, itemIdx: number) => {
    if (itemIdx === 0) return;
    setEntries((prev) => {
      const next = [...prev];
      const entry = { ...next[topicIdx] };
      const ids = [...entry.selectedItemIds];
      [ids[itemIdx - 1], ids[itemIdx]] = [ids[itemIdx], ids[itemIdx - 1]];
      entry.selectedItemIds = ids;
      next[topicIdx] = entry;
      return next;
    });
  };

  const moveItemDown = (topicIdx: number, itemIdx: number) => {
    setEntries((prev) => {
      const next = [...prev];
      const entry = { ...next[topicIdx] };
      if (itemIdx >= entry.selectedItemIds.length - 1) return prev;
      const ids = [...entry.selectedItemIds];
      [ids[itemIdx], ids[itemIdx + 1]] = [ids[itemIdx + 1], ids[itemIdx]];
      entry.selectedItemIds = ids;
      next[topicIdx] = entry;
      return next;
    });
  };

  if (loading) return <AdminLoadingSpinner />;
  if (fetchError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Линейный тест</h1>
        <AdminFetchError message={fetchError} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const topicMap = new Map(topics.map((t) => [t.id, t]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Линейный тест</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Настройте порядок тем и заданий для неадаптивного режима
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saveMsg && (
            <span className={`text-sm ${saveMsg.startsWith('Ошибка') ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
              {saveMsg}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors cursor-pointer"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500">
        Если конфигурация пуста (нет выбранных заданий), используется случайный порядок тем и MST-алгоритм.
      </p>

      <div className="space-y-4">
        {entries.map((entry, topicIdx) => {
          const topic = topicMap.get(entry.topicId);
          const topicItems = items.filter((it) => it.topic_id === entry.topicId);
          return (
            <div key={entry.topicId} className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-gray-400 dark:text-gray-500 w-6 text-center">
                    {entry.topicOrder}
                  </span>
                  <h3 className="font-bold text-gray-800 dark:text-gray-100">
                    {topic?.name ?? entry.topicId.slice(0, 8)}
                  </h3>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    ({entry.selectedItemIds.length} из {topicItems.length})
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => moveTopicUp(topicIdx)}
                    disabled={topicIdx === 0}
                    className="px-2 py-1 text-xs text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 disabled:opacity-30 cursor-pointer"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveTopicDown(topicIdx)}
                    disabled={topicIdx === entries.length - 1}
                    className="px-2 py-1 text-xs text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 disabled:opacity-30 cursor-pointer"
                  >
                    ↓
                  </button>
                </div>
              </div>

              {/* Available items */}
              <div className="space-y-1">
                {topicItems.length === 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">Нет заданий в этой теме</p>
                )}

                {/* Selected items (ordered) */}
                {entry.selectedItemIds.map((itemId, itemIdx) => {
                  const item = topicItems.find((it) => it.id === itemId);
                  if (!item) return null;
                  return (
                    <div key={itemId} className="flex items-center gap-2 py-1 px-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                      <input
                        type="checkbox"
                        checked
                        onChange={() => toggleItem(topicIdx, itemId)}
                        className="cursor-pointer"
                      />
                      <span className="text-xs font-mono text-gray-400 dark:text-gray-500 w-4">{itemIdx + 1}</span>
                      <span className="flex-1 text-gray-800 dark:text-gray-100 truncate">
                        {item.text || item.description || `b=${item.b}`}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">b={item.b}</span>
                      <button onClick={() => moveItemUp(topicIdx, itemIdx)} disabled={itemIdx === 0}
                        className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 cursor-pointer">↑</button>
                      <button onClick={() => moveItemDown(topicIdx, itemIdx)} disabled={itemIdx === entry.selectedItemIds.length - 1}
                        className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 cursor-pointer">↓</button>
                    </div>
                  );
                })}

                {/* Unselected items */}
                {topicItems
                  .filter((it) => !entry.selectedItemIds.includes(it.id))
                  .map((item) => (
                    <div key={item.id} className="flex items-center gap-2 py-1 px-2 rounded text-sm">
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={() => toggleItem(topicIdx, item.id)}
                        className="cursor-pointer"
                      />
                      <span className="w-4" />
                      <span className="flex-1 text-gray-500 dark:text-gray-400 truncate">
                        {item.text || item.description || `b=${item.b}`}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">b={item.b}</span>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
