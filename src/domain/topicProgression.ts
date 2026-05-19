import type { Topic, LinearTestConfig } from '../types';

export function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Determine topic order based on mode and linear config.
 * - Adaptive: original DB order
 * - Nonadaptive with config: config-defined order (deduplicated)
 * - Nonadaptive without config: shuffled
 */
export function determineTopicOrder(
  mode: 'adaptive' | 'nonadaptive',
  topics: Topic[],
  linearConfig: LinearTestConfig[]
): string[] {
  if (mode === 'adaptive') {
    return topics.map((t) => t.id);
  }

  if (linearConfig.length > 0) {
    const seen = new Set<string>();
    const order: string[] = [];
    for (const c of linearConfig) {
      if (!seen.has(c.topic_id)) {
        seen.add(c.topic_id);
        order.push(c.topic_id);
      }
    }
    return order;
  }

  return shuffleArray(topics.map((t) => t.id));
}

/**
 * Get linear item IDs for a topic from the config.
 * Returns undefined if no config exists for this topic.
 */
export function getLinearItemIds(
  topicId: string,
  linearConfig: LinearTestConfig[]
): string[] | undefined {
  if (linearConfig.length === 0) return undefined;
  const topicItems = linearConfig
    .filter((c) => c.topic_id === topicId)
    .sort((a, b) => a.item_order - b.item_order)
    .map((c) => c.item_id);
  return topicItems.length > 0 ? topicItems : undefined;
}

