import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import type { PreviousAnswer, Item } from '../types';

/**
 * Возвращает следующее задание для ребёнка.
 *
 * Параметры IRT (Item Response Theory):
 * - `b` — сложность задания в логитах. Чем выше значение, тем сложнее задание.
 *   Типичный диапазон: от -3 (очень лёгкое) до +3 (очень сложное).
 * - `se` — стандартная ошибка измерения. Чем ниже значение, тем точнее
 *   оценка сложности задания.
 *
 * Алгоритм MST (Multi-Stage Testing) использует эти параметры для
 * адаптивного выбора заданий, подходящих по уровню сложности для конкретного
 * ребёнка, на основе его предыдущих ответов.
 *
 * @param previousAnswers - история ответов в текущей теме
 *   [{ itemId, b, se, isCorrect }, ...]
 * @param remainingItems - оставшиеся задания в теме (ещё не показанные)
 *   [{ id, b, se, ... }, ...]
 * @returns следующее задание или null если тема завершена
 */
function defaultGetNextItem(
  _previousAnswers: PreviousAnswer[],
  remainingItems: Item[]
): Item | null {
  if (remainingItems.length === 0) return null;

  // ===== ЗАГЛУШКА =====
  // Сейчас выбирает случайное задание.
  // Замените этот алгоритм через админку (раздел «Алгоритм»),
  // чтобы использовать реальный MST-алгоритм.
  // ====================
  const randomIndex = Math.floor(Math.random() * remainingItems.length);
  return remainingItems[randomIndex];
}

/** Cached custom algorithm function */
let cachedCustomFn: ((prev: PreviousAnswer[], remaining: Item[]) => Item | null) | null = null;
let cachedCode: string | null = null;

/**
 * Загружает кастомный алгоритм из Supabase.
 * Результат кэшируется — повторные вызовы не ходят в БД.
 * Вызовите resetAlgorithmCache() чтобы сбросить кэш.
 */
export async function loadCustomAlgorithm(): Promise<void> {
  if (cachedCode !== null) return; // already loaded

  try {
    const { data, error } = await supabase
      .from('algorithm_config')
      .select('code')
      .eq('id', 1)
      .single();

    if (error || !data?.code?.trim()) {
      logger.info('No custom algorithm found, using default (random)');
      cachedCode = '';
      cachedCustomFn = null;
      return;
    }

    cachedCode = data.code;
    cachedCustomFn = compileAlgorithm(data.code);
    if (cachedCustomFn) {
      logger.info('Custom MST algorithm loaded and compiled');
    }
  } catch (err) {
    logger.error('Failed to load custom algorithm from DB', err);
    cachedCode = '';
    cachedCustomFn = null;
  }
}

/**
 * Сбрасывает кэш алгоритма (при следующем вызове загрузится заново).
 */
export function resetAlgorithmCache(): void {
  cachedCode = null;
  cachedCustomFn = null;
}

/**
 * Компилирует строку с JS-кодом в функцию.
 * Код должен быть телом функции, которая принимает previousAnswers и remainingItems
 * и возвращает Item | null.
 */
export function compileAlgorithm(
  code: string
): ((prev: PreviousAnswer[], remaining: Item[]) => Item | null) | null {
  if (!code.trim()) return null;

  try {
    // The code is the function body. It receives previousAnswers and remainingItems.
    // eslint-disable-next-line no-new-func
    const fn = new Function('previousAnswers', 'remainingItems', code) as (
      prev: PreviousAnswer[],
      remaining: Item[]
    ) => Item | null;

    return fn;
  } catch (err) {
    logger.error('Failed to compile custom algorithm', err);
    return null;
  }
}

/**
 * Основная функция выбора следующего задания.
 * Использует кастомный алгоритм если он загружен и валиден,
 * иначе — дефолтный (случайный выбор).
 */
export function getNextItem(
  previousAnswers: PreviousAnswer[],
  remainingItems: Item[]
): Item | null {
  if (remainingItems.length === 0) return null;

  if (cachedCustomFn) {
    try {
      const result = cachedCustomFn(previousAnswers, remainingItems);
      // Validate that result is an item from remainingItems or null
      if (result === null || result === undefined) return null;
      if (remainingItems.some((it) => it.id === result.id)) {
        return result;
      }
      // Invalid result — fall through to default
      logger.warn('Custom algorithm returned item not in remainingItems, falling back to default', {
        returnedId: result.id,
        remaining: remainingItems.length,
      });
    } catch (err) {
      logger.error('Custom algorithm threw an error, falling back to default', err, {
        previousAnswers: previousAnswers.length,
        remaining: remainingItems.length,
      });
    }
  }

  return defaultGetNextItem(previousAnswers, remainingItems);
}
