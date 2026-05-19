import { useState } from 'react';
import { compileAlgorithm } from '../../../../domain/mst';
import { runSimulation, type SimulationStep } from '../../../../domain/mst-test-scenarios';
import { parseItems, difficultyLabel, difficultyColor, difficultyBg } from '../../../../domain/mst-test-utils';
import type { Item } from '../../../../types';

const DEFAULT_ITEMS = JSON.stringify(
  [
    { id: 'e1', b: -1.5 },
    { id: 'e2', b: -1.0 },
    { id: 'e3', b: -0.8 },
    { id: 'm1', b: -0.3 },
    { id: 'm2', b: 0.0 },
    { id: 'm3', b: 0.4 },
    { id: 'm4', b: 0.6 },
    { id: 'h1', b: 1.0 },
    { id: 'h2', b: 1.5 },
    { id: 'h3', b: 2.2 },
  ],
  null,
  2,
);

const QUICK_PATTERNS: { label: string; pattern: string }[] = [
  { label: 'Все верно', pattern: '111111' },
  { label: 'Все неверно', pattern: '000000' },
  { label: 'Чередование', pattern: '101010' },
  { label: '2 верно, потом нет', pattern: '110000' },
  { label: '2 неверно, потом да', pattern: '001111' },
  { label: '1/1, потом верно', pattern: '101111' },
];

interface Props {
  code: string;
}

export default function SimulationTest({ code }: Props) {
  const [itemsJson, setItemsJson] = useState(DEFAULT_ITEMS);
  const [pattern, setPattern] = useState('110100');
  const [steps, setSteps] = useState<SimulationStep[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    setSteps(null);
    setError(null);

    const fn = code.trim() ? compileAlgorithm(code) : null;
    if (!fn) {
      setError(code.trim() ? 'Ошибка компиляции' : 'Код пустой — вставьте алгоритм');
      return;
    }

    let items: Item[];
    try {
      items = parseItems(itemsJson);
    } catch {
      setError('Невалидный JSON заданий');
      return;
    }

    const bools = pattern.split('').map((c) => c === '1');
    while (bools.length < 6) bools.push(false);

    try {
      setSteps(runSimulation(fn, items, bools));
    } catch (err) {
      setError(`Ошибка: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Полная симуляция прохождения одной темы: алгоритм последовательно выбирает 6 заданий.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Items input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Задания темы (JSON)
            <span className="text-xs text-gray-400 ml-1">[{'{'}id, b{'}'}]</span>
          </label>
          <textarea
            value={itemsJson}
            onChange={(e) => setItemsJson(e.target.value)}
            spellCheck={false}
            className="w-full h-52 font-mono text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          />
        </div>

        {/* Pattern input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Паттерн ответов (6 символов: 1 = верно, 0 = неверно)
          </label>
          <PatternToggle pattern={pattern} onChange={setPattern} />

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 mb-2">Быстрые паттерны:</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_PATTERNS.map(({ label, pattern: p }) => (
              <button
                key={p}
                onClick={() => setPattern(p)}
                className={`px-2 py-1 text-xs rounded-lg border transition-colors cursor-pointer ${
                  pattern === p
                    ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={run}
        className="px-5 py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
      >
        Запустить симуляцию
      </button>

      {error && (
        <div className="rounded-xl p-4 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {steps && <SimulationResults steps={steps} itemsJson={itemsJson} />}
    </div>
  );
}

function PatternToggle({ pattern, onChange }: { pattern: string; onChange: (p: string) => void }) {
  return (
    <>
      <div className="flex gap-1 mb-1">
        {Array.from({ length: 6 }).map((_, i) => {
          const val = pattern[i] === '1';
          return (
            <button
              key={i}
              onClick={() => {
                const arr = pattern.padEnd(6, '0').split('');
                arr[i] = arr[i] === '1' ? '0' : '1';
                onChange(arr.join(''));
              }}
              className={`w-12 h-12 rounded-lg text-sm font-bold border-2 transition-colors cursor-pointer ${
                val
                  ? 'bg-green-100 dark:bg-green-900/40 border-green-400 dark:border-green-600 text-green-700 dark:text-green-300'
                  : 'bg-red-100 dark:bg-red-900/40 border-red-400 dark:border-red-600 text-red-700 dark:text-red-300'
              }`}
            >
              {val ? '\u2713' : '\u2717'}
            </button>
          );
        })}
      </div>
      <div className="flex gap-1 text-xs text-gray-400">
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="w-12 text-center">{i + 1}</span>
        ))}
      </div>
    </>
  );
}

function SimulationResults({ steps, itemsJson }: { steps: SimulationStep[]; itemsJson: string }) {
  let allItems: Item[] = [];
  try {
    allItems = parseItems(itemsJson);
  } catch { /* empty */ }

  const selectedIds = steps.map((s) => s.selectedItem?.id).filter(Boolean);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Результаты симуляции</h3>

      {/* Items map */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Все задания темы:</p>
        <div className="flex flex-wrap gap-1">
          {allItems.map((it) => {
            const stepIdx = selectedIds.indexOf(it.id);
            const wasSelected = stepIdx !== -1;
            return (
              <span
                key={it.id}
                className={`text-xs px-2 py-1 rounded border ${difficultyBg(it.b)} ${wasSelected ? 'ring-2 ring-blue-500' : 'opacity-50'}`}
              >
                {it.id} <span className={difficultyColor(it.b)}>b={it.b}</span>
                {' '}
                <span className="text-gray-400">[{difficultyLabel(it.b)}]</span>
                {wasSelected && (
                  <span className="ml-1 text-blue-600 dark:text-blue-400 font-bold">#{stepIdx + 1}</span>
                )}
              </span>
            );
          })}
        </div>
      </div>

      {/* Steps timeline */}
      <div className="space-y-1">
        {steps.map((step) => (
          <div
            key={step.step}
            className={`flex items-center gap-3 rounded-lg p-3 border ${
              step.selectedItem
                ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                : 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900'
            }`}
          >
            <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400">
              {step.step}
            </div>
            <div className="shrink-0 w-20">
              <span className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                Этап {step.stage}
              </span>
            </div>
            {step.selectedItem ? (
              <>
                <div className={`text-sm font-medium ${difficultyColor(step.selectedItem.b)}`}>
                  {step.selectedItem.id}
                  <span className="text-gray-400 font-normal ml-1">b={step.selectedItem.b}</span>
                  <span className="text-gray-400 font-normal ml-1">[{difficultyLabel(step.selectedItem.b)}]</span>
                </div>
                <div className="ml-auto">
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-medium ${
                      step.isCorrect
                        ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                    }`}
                  >
                    {step.isCorrect ? 'Верно' : 'Неверно'}
                  </span>
                </div>
              </>
            ) : (
              <span className="text-sm text-gray-400 italic">null (тема завершена)</span>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-3 text-sm">
        <p className="font-medium text-indigo-700 dark:text-indigo-300 mb-1">Итог:</p>
        <p className="text-indigo-600 dark:text-indigo-400 text-xs">
          Выдано заданий: {steps.filter((s) => s.selectedItem).length} из 6
          {' | '}
          Верных: {steps.filter((s) => s.isCorrect).length}
          {' | '}
          Этапы:{' '}
          {[1, 2, 3].map((stage) => {
            const stageSteps = steps.filter((s) => s.stage === stage && s.selectedItem);
            if (stageSteps.length === 0) return `${stage}: -`;
            const items = stageSteps.map((s) => `${s.selectedItem!.id}(b=${s.selectedItem!.b})`).join(', ');
            return `${stage}: [${items}]`;
          }).join(' | ')}
        </p>
      </div>
    </div>
  );
}
