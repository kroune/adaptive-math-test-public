import { useState, useEffect } from 'react';
import type { ItemAnswer, Item, Topic } from '../../../types';
import { fetchAllItemBValues, fetchAllItems } from '../../../data/repositories/itemsRepo';
import { withRetry } from '../../../lib/retry';
import { logger } from '../../../lib/logger';
import { CelebrationIcon } from '../../../components/Icons';

interface TopicResult {
  topic: Topic;
  answers: ItemAnswer[];
  avgB: number;
  correctPercent: number;
}

interface Props {
  topics: Topic[];
  allAnswers: ItemAnswer[];
  itemBValues: Record<string, number>;
  isEarlyExit?: boolean;
  isForceTerminated?: boolean;
  onFinish: () => void;
}

export default function ResultsPage({
  topics,
  allAnswers,
  itemBValues,
  isEarlyExit,
  isForceTerminated,
  onFinish,
}: Props) {
  const [fetchedBValues, setFetchedBValues] = useState<Record<string, number>>({});
  const [itemMap, setItemMap] = useState<Map<string, Item>>(new Map());
  const [expandedAnswer, setExpandedAnswer] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [bValues, items] = await Promise.all([
          Object.keys(itemBValues).length > 0
            ? null
            : withRetry(fetchAllItemBValues, { label: 'fetchAllItemBValues' }),
          withRetry(fetchAllItems, { label: 'fetchAllItems' }),
        ]);
        if (cancelled) return;
        if (bValues) setFetchedBValues(bValues);
        setItemMap(new Map(items.map((it) => [it.id, it])));
      } catch (err) {
        logger.error('Failed to fetch item data for results', err);
      }
    })();
    return () => { cancelled = true; };
  }, [itemBValues]);

  const effectiveBValues = Object.keys(itemBValues).length > 0 ? itemBValues : fetchedBValues;

  const topicResults: TopicResult[] = topics.map((topic) => {
    const answers = allAnswers.filter((a) => a.topic_id === topic.id);
    const correct = answers.filter((a) => a.is_correct).length;
    const correctPercent = answers.length > 0 ? (correct / answers.length) * 100 : 0;
    const bValues = answers.map((a) => effectiveBValues[a.item_id] ?? 0);
    const avgB =
      bValues.length > 0
        ? bValues.reduce((sum, b) => sum + b, 0) / bValues.length
        : 0;
    return { topic, answers, avgB, correctPercent };
  });

  const totalAnswers = allAnswers.length;
  const totalCorrect = allAnswers.filter((a) => a.is_correct).length;

  const barColor = (pct: number) =>
    pct >= 70 ? 'bg-mint' : pct >= 40 ? 'bg-sunshine' : 'bg-rose';

  const getStudentAnswer = (a: ItemAnswer, item: Item | undefined): string => {
    if (a.text_answer_given != null) return a.text_answer_given;
    if (a.answer_given != null && item?.options?.[a.answer_given]?.text)
      return item.options[a.answer_given].text!;
    if (a.answer_given != null) return String.fromCharCode(1040 + a.answer_given); // А, Б, В, Г
    return '—';
  };

  const getCorrectAnswer = (item: Item | undefined): string => {
    if (!item) return '—';
    if (item.correct_text != null) return item.correct_text;
    if (item.correct_option != null && item.options?.[item.correct_option]?.text)
      return item.options[item.correct_option].text!;
    if (item.correct_option != null) return String.fromCharCode(1040 + item.correct_option);
    return '—';
  };

  return (
    <div
      className="min-h-screen bg-cream dark:bg-midnight p-4 font-child"
      style={{ backgroundImage: 'radial-gradient(ellipse 50% 40% at 30% -10%, var(--blob-mint), transparent), radial-gradient(ellipse 45% 45% at 105% 25%, var(--blob-sunshine), transparent)' }}
    >
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        {/* Header */}
        <div className="text-center animate-bounce-in">
          <div className="inline-flex w-16 h-16 rounded-[20px] bg-mint-bg dark:bg-mint/10 items-center justify-center mb-3">
            <CelebrationIcon className="w-10 h-10 text-mint dark:text-mint-light" />
          </div>
          <h1 className="text-3xl font-display font-bold text-charcoal dark:text-warm-white mb-1">
            {isForceTerminated ? 'Тест завершён' : isEarlyExit ? 'Тестирование завершено' : 'Молодец!'}
          </h1>
          <p className="text-charcoal/50 dark:text-warm-white/50">
            {isForceTerminated
              ? 'Учитель завершил тестирование. Вот твои результаты'
              : isEarlyExit
              ? 'Вот результаты по пройденным заданиям'
              : 'Вот твои результаты'}
          </p>
        </div>

        {/* Per-topic results */}
        <div className="space-y-4">
          {topicResults
            .filter((r) => r.answers.length > 0)
            .map((r, i) => (
              <div
                key={r.topic.id}
                className="bg-white dark:bg-surface-dark rounded-[20px] shadow-lg shadow-orange-900/6 dark:shadow-black/20 p-6 animate-slide-up"
                style={{ animationDelay: `${(i + 1) * 0.08}s` }}
              >
                <div className="mb-3">
                  <h3 className="font-display font-bold text-charcoal dark:text-warm-white">
                    {r.topic.name}
                  </h3>
                </div>
                <div className="w-full bg-charcoal/8 dark:bg-warm-white/8 rounded-full h-4 mb-1.5 overflow-hidden">
                  <div
                    className={`h-4 rounded-full transition-[width] duration-700 ease-in-out ${barColor(r.correctPercent)}`}
                    style={{ width: `${r.correctPercent}%`, animation: 'progress-fill 0.8s ease-out' }}
                  />
                </div>
                <div className="text-right text-sm text-charcoal/50 dark:text-warm-white/50 font-semibold mb-3">
                  {r.answers.filter((a) => a.is_correct).length} из{' '}
                  {r.answers.length}
                </div>

                {/* Per-item review indicators */}
                {itemMap.size > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {r.answers.map((a, j) => (
                      <button
                        key={a.id}
                        onClick={() => setExpandedAnswer(expandedAnswer === a.id ? null : a.id)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all cursor-pointer border-2 ${
                          a.is_correct
                            ? 'bg-mint/15 text-mint border-mint/30 dark:bg-mint/10 dark:text-mint-light dark:border-mint/20'
                            : 'bg-rose/15 text-rose border-rose/30 dark:bg-rose/10 dark:text-rose dark:border-rose/20'
                        } ${expandedAnswer === a.id ? 'ring-2 ring-offset-2 ring-coral dark:ring-offset-surface-dark' : ''}`}
                      >
                        {j + 1}
                      </button>
                    ))}
                  </div>
                )}

                {/* Expanded item detail */}
                {r.answers.map((a) => {
                  if (expandedAnswer !== a.id) return null;
                  const item = itemMap.get(a.item_id);
                  return (
                    <div
                      key={`detail-${a.id}`}
                      className="mt-3 p-4 bg-charcoal/4 dark:bg-warm-white/4 rounded-2xl animate-fade-in"
                    >
                      {item?.image_url && (
                        <img
                          src={item.image_url}
                          alt=""
                          className="max-h-40 rounded-xl mb-3 mx-auto"
                        />
                      )}
                      {item?.text && (
                        <p className="text-sm text-charcoal/70 dark:text-warm-white/70 mb-2">{item.text}</p>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className={`p-2 rounded-xl ${a.is_correct ? 'bg-mint/10' : 'bg-rose/10'}`}>
                          <span className="text-charcoal/50 dark:text-warm-white/50 text-xs">Твой ответ:</span>
                          <div className={`font-bold ${a.is_correct ? 'text-mint dark:text-mint-light' : 'text-rose'}`}>
                            {getStudentAnswer(a, item)}
                          </div>
                        </div>
                        <div className="p-2 rounded-xl bg-mint/10">
                          <span className="text-charcoal/50 dark:text-warm-white/50 text-xs">Правильный:</span>
                          <div className="font-bold text-mint dark:text-mint-light">
                            {getCorrectAnswer(item)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
        </div>

        {/* Total */}
        <div
          className="bg-white dark:bg-surface-dark rounded-[20px] shadow-xl shadow-orange-900/8 dark:shadow-black/30 p-6 text-center animate-slide-up"
          style={{ animationDelay: `${(topicResults.filter((r) => r.answers.length > 0).length + 1) * 0.08}s` }}
        >
          <h3 className="text-lg font-display font-bold text-charcoal dark:text-warm-white mb-2">
            Общий результат
          </h3>
          <div className="text-5xl font-display font-bold text-coral dark:text-coral-light mb-1">
            {totalCorrect} из {totalAnswers}
          </div>
          <p className="text-charcoal/50 dark:text-warm-white/50">
            правильных заданий
          </p>
        </div>

        <div className="text-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <button
            onClick={onFinish}
            className="px-10 py-4 bg-coral hover:bg-coral-hover text-white text-lg font-display font-bold rounded-2xl transition-all cursor-pointer shadow-lg shadow-coral/25 hover:shadow-xl hover:shadow-coral/30 dark:shadow-black/30 dark:hover:shadow-black/40 active:scale-[0.97]"
          >
            Завершить
          </button>
        </div>
      </div>
    </div>
  );
}
