import type { Item, Topic, LinearTestConfig } from '../../../types';

interface BuildMdOpts {
  items: Item[];
  topics: Topic[];
  linearConfig?: LinearTestConfig[];
  itemIds?: string[];
}

export function buildItemConditionsMd(opts: BuildMdOpts): string {
  const { items, topics, linearConfig, itemIds } = opts;
  const topicMap = new Map(topics.map((t) => [t.id, t]));
  const itemMap = new Map(items.map((it) => [it.id, it]));

  let orderedItems: Item[];

  if (itemIds) {
    orderedItems = itemIds.map((id) => itemMap.get(id)).filter((it): it is Item => !!it);
  } else if (linearConfig && linearConfig.length > 0) {
    const sorted = [...linearConfig].sort((a, b) => a.topic_order - b.topic_order || a.item_order - b.item_order);
    orderedItems = sorted.map((c) => itemMap.get(c.item_id)).filter((it): it is Item => !!it);
  } else {
    orderedItems = [...items].sort((a, b) => {
      const tA = topicMap.get(a.topic_id)?.order_index ?? 999;
      const tB = topicMap.get(b.topic_id)?.order_index ?? 999;
      return tA !== tB ? tA - tB : a.b - b.b;
    });
  }

  const lines: string[] = ['# Условия заданий', ''];

  let currentTopicId = '';
  for (const item of orderedItems) {
    const topic = topicMap.get(item.topic_id);
    if (item.topic_id !== currentTopicId) {
      currentTopicId = item.topic_id;
      lines.push(`## ${topic?.name ?? 'Тема'}`, '');
    }

    const label = item.description || item.id.slice(0, 8);
    lines.push(`### ${label}`);
    if (item.text) lines.push(`**Текст:** ${item.text}`);
    if (item.image_url) lines.push(`**Изображение:** ![](${item.image_url})`);

    if (item.answer_type === 'choice' && item.options.length > 0) {
      lines.push('**Варианты ответа:**');
      item.options.forEach((opt, i) => {
        const marker = i === item.correct_option ? ' ✓' : '';
        const text = opt.text ?? (opt.image_url ? `![](${opt.image_url})` : '—');
        lines.push(`- ${String.fromCharCode(65 + i)}) ${text}${marker}`);
      });
    }

    if (item.answer_type === 'text_input' && item.correct_text) {
      lines.push(`**Правильный ответ:** ${item.correct_text}`);
    }

    lines.push(`**IRT:** b=${item.b}, se=${item.se}`);
    lines.push(`**Классы:** ${item.grade_min}–${item.grade_max}`);
    lines.push('');
  }

  return lines.join('\n');
}

export function downloadMd(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
