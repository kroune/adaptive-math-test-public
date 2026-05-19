import { useState } from 'react';
import { compileAlgorithm } from '../../../../domain/mst';
import { parseItems } from '../../../../domain/mst-test-utils';
import type { PreviousAnswer } from '../../../../types';

const DEFAULT_PREV = JSON.stringify(
  [
    { itemId: 'a1', b: 0.2, se: 0.3, isCorrect: true },
    { itemId: 'a2', b: -0.1, se: 0.3, isCorrect: false },
  ],
  null,
  2,
);

const DEFAULT_REMAINING = JSON.stringify(
  [
    { id: 'r1', b: -1.5, se: 0.3 },
    { id: 'r2', b: -0.8, se: 0.3 },
    { id: 'r3', b: 0.0, se: 0.3 },
    { id: 'r4', b: 0.5, se: 0.3 },
    { id: 'r5', b: 1.2, se: 0.3 },
    { id: 'r6', b: 2.0, se: 0.3 },
  ],
  null,
  2,
);

interface Props {
  code: string;
}

export default function CustomTest({ code }: Props) {
  const [prevJson, setPrevJson] = useState(DEFAULT_PREV);
  const [remainingJson, setRemainingJson] = useState(DEFAULT_REMAINING);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const run = () => {
    setResult(null);
    const fn = code.trim() ? compileAlgorithm(code) : null;
    if (!fn) {
      setResult({ ok: false, message: code.trim() ? 'Ошибка компиляции' : 'Код пустой — вставьте алгоритм' });
      return;
    }

    let prevAnswers: PreviousAnswer[];
    try {
      prevAnswers = JSON.parse(prevJson);
    } catch {
      setResult({ ok: false, message: 'Невалидный JSON в previousAnswers' });
      return;
    }

    let remaining;
    try {
      remaining = parseItems(remainingJson);
    } catch {
      setResult({ ok: false, message: 'Невалидный JSON в remainingItems' });
      return;
    }

    try {
      const item = fn(prevAnswers, remaining);
      if (item === null || item === undefined) {
        setResult({ ok: true, message: 'Вернул null (тема завершена)' });
      } else if (!remaining.some((it) => it.id === item.id)) {
        setResult({ ok: false, message: `Вернул id="${item.id}", которого нет в remainingItems` });
      } else {
        setResult({ ok: true, message: `Выбрано: id="${item.id}", b=${item.b}, se=${item.se}` });
      }
    } catch (err) {
      setResult({ ok: false, message: `Ошибка: ${err instanceof Error ? err.message : String(err)}` });
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Введите свои данные в формате JSON и проверьте, что вернёт алгоритм
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            previousAnswers
            <span className="text-xs text-gray-400 ml-1">[{'{'}itemId, b, se, isCorrect{'}'}]</span>
          </label>
          <textarea
            value={prevJson}
            onChange={(e) => setPrevJson(e.target.value)}
            spellCheck={false}
            className="w-full h-48 font-mono text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            remainingItems
            <span className="text-xs text-gray-400 ml-1">[{'{'}id, b, se, ...{'}'}]</span>
          </label>
          <textarea
            value={remainingJson}
            onChange={(e) => setRemainingJson(e.target.value)}
            spellCheck={false}
            className="w-full h-48 font-mono text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={run}
          className="px-5 py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
        >
          Запустить
        </button>
        {result && (
          <span className={`text-sm ${result.ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {result.message}
          </span>
        )}
      </div>
    </div>
  );
}
