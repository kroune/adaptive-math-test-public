import type { Item, PreviousAnswer } from '../types';

export function makeItem(id: string, b: number, label?: string): Item {
  return {
    id,
    topic_id: 't1',
    image_url: null,
    text: label ?? `Задание ${id}`,
    description: null,
    answer_type: 'choice',
    options: [{ text: 'A' }, { text: 'B' }, { text: 'C' }, { text: 'D' }],
    correct_option: 0,
    correct_text: null,
    b,
    se: 0.3,
    grade_min: 1,
    grade_max: 11,
  };
}

export function makeAnswer(itemId: string, b: number, isCorrect: boolean): PreviousAnswer {
  return { itemId, b, se: 0.3, isCorrect };
}

/** Parse a JSON array of partial items into full Item objects (filling defaults). */
export function parseItems(json: string): Item[] {
  const raw: Record<string, unknown>[] = JSON.parse(json);
  return raw.map((it) => ({
    ...makeItem(String(it.id ?? ''), Number(it.b ?? 0)),
    ...it,
    se: Number(it.se ?? 0.3),
  }));
}

export function difficultyLabel(b: number): string {
  if (b < -0.7) return 'easy';
  if (b > 0.7) return 'hard';
  return 'medium';
}

export function difficultyColor(b: number): string {
  if (b < -0.7) return 'text-green-600 dark:text-green-400';
  if (b > 0.7) return 'text-red-600 dark:text-red-400';
  return 'text-amber-600 dark:text-amber-400';
}

export function difficultyBg(b: number): string {
  if (b < -0.7) return 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700';
  if (b > 0.7) return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700';
  return 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700';
}
