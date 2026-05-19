import { useState } from 'react';
import { compileAlgorithm } from '../../../../domain/mst';
import { PRESET_SCENARIOS } from '../../../../domain/mst-test-scenarios';
import { difficultyBg } from '../../../../domain/mst-test-utils';
import type { Item } from '../../../../types';

interface PresetResult {
  ok: boolean;
  message: string;
  selectedId?: string;
}

interface Props {
  code: string;
}

export default function PresetTests({ code }: Props) {
  const [results, setResults] = useState<Map<number, PresetResult>>(new Map());

  const runOne = (index: number, next: Map<number, PresetResult>) => {
    const fn = code.trim() ? compileAlgorithm(code) : null;
    if (!fn) {
      next.set(index, {
        ok: false,
        message: code.trim() ? 'Ошибка компиляции' : 'Код пустой — вставьте алгоритм',
      });
      return;
    }

    const scenario = PRESET_SCENARIOS[index];
    try {
      const result = fn([...scenario.previousAnswers], [...scenario.remainingItems]);
      if (result === null || result === undefined) {
        next.set(index, { ok: true, message: 'Вернул null (тема завершена / нет заданий)' });
      } else if (!scenario.remainingItems.some((it) => it.id === result.id)) {
        next.set(index, { ok: false, message: `Вернул id="${result.id}", которого нет в remainingItems` });
      } else {
        next.set(index, {
          ok: true,
          message: `Выбрано: "${result.text ?? result.id}" (b=${result.b})`,
          selectedId: result.id,
        });
      }
    } catch (err) {
      next.set(index, {
        ok: false,
        message: `Ошибка: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  };

  const handleRunOne = (index: number) => {
    const next = new Map(results);
    runOne(index, next);
    setResults(next);
  };

  const handleRunAll = () => {
    const next = new Map<number, PresetResult>();
    for (let i = 0; i < PRESET_SCENARIOS.length; i++) {
      runOne(i, next);
    }
    setResults(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Проверьте алгоритм на типовых ситуациях
        </p>
        <button
          onClick={handleRunAll}
          className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
        >
          Запустить все
        </button>
      </div>

      {PRESET_SCENARIOS.map((scenario, i) => {
        const result = results.get(i);
        return (
          <ScenarioCard
            key={i}
            scenario={scenario}
            result={result}
            onRun={() => handleRunOne(i)}
          />
        );
      })}
    </div>
  );
}

function ScenarioCard({
  scenario,
  result,
  onRun,
}: {
  scenario: (typeof PRESET_SCENARIOS)[number];
  result?: PresetResult;
  onRun: () => void;
}) {
  return (
    <div
      className={`border rounded-xl p-4 transition-colors ${
        result
          ? result.ok
            ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10'
            : 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {scenario.name}
            </h3>
            {result && <StatusBadge ok={result.ok} />}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {scenario.description}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Ответов: {scenario.previousAnswers.length} | Осталось: {scenario.remainingItems.length}
          </p>

          <InputDataDetails
            previousAnswers={scenario.previousAnswers}
            remainingItems={scenario.remainingItems}
            selectedId={result?.selectedId}
          />

          <p className="text-xs mt-2 italic text-gray-500 dark:text-gray-400">
            Ожидание: {scenario.expectedBehavior}
          </p>

          {result && (
            <p className={`text-xs mt-1 font-medium ${result.ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              Результат: {result.message}
            </p>
          )}
        </div>
        <button
          onClick={onRun}
          className="shrink-0 px-3 py-1.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer"
        >
          Запустить
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full ${
        ok
          ? 'bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300'
          : 'bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-300'
      }`}
    >
      {ok ? 'OK' : 'FAIL'}
    </span>
  );
}

function InputDataDetails({
  previousAnswers,
  remainingItems,
  selectedId,
}: {
  previousAnswers: { itemId: string; b: number; isCorrect: boolean }[];
  remainingItems: Item[];
  selectedId?: string;
}) {
  return (
    <details className="mt-2">
      <summary className="text-xs text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300">
        Входные данные
      </summary>
      <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">previousAnswers:</p>
          <div className="flex flex-wrap gap-1">
            {previousAnswers.length === 0 ? (
              <span className="text-xs text-gray-400">[]</span>
            ) : (
              previousAnswers.map((a, j) => (
                <span key={j} className={`text-xs px-1.5 py-0.5 rounded border ${difficultyBg(a.b)}`}>
                  {a.itemId} b={a.b} {a.isCorrect ? '\u2713' : '\u2717'}
                </span>
              ))
            )}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">remainingItems:</p>
          <div className="flex flex-wrap gap-1">
            {remainingItems.map((it, j) => (
              <span
                key={j}
                className={`text-xs px-1.5 py-0.5 rounded border ${difficultyBg(it.b)} ${
                  selectedId === it.id ? 'ring-2 ring-blue-500 font-bold' : ''
                }`}
              >
                {it.text ?? it.id} b={it.b}
              </span>
            ))}
          </div>
        </div>
      </div>
    </details>
  );
}
