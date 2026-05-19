import { useState, useEffect } from 'react';
import { fetchAlgorithmCode, saveAlgorithmCode } from '../../../data/remote/algorithmApi';
import { compileAlgorithm } from '../../../domain/mst';
import { makeItem } from '../../../domain/mst-test-utils';
import { logger } from '../../../lib/logger';
import AdminLoadingSpinner from '../../../components/AdminLoadingSpinner';
import AdminFetchError from '../../../components/AdminFetchError';
import AlgorithmEditor from '../components/algorithm/AlgorithmEditor';
import PresetTests from '../components/algorithm/PresetTests';
import CustomTest from '../components/algorithm/CustomTest';
import SimulationTest from '../components/algorithm/SimulationTest';

const DEFAULT_CODE = `// previousAnswers — массив предыдущих ответов в текущей теме:
//   [{ itemId: string, b: number, se: number, isCorrect: boolean }, ...]
//
// remainingItems — оставшиеся задания (ещё не показанные):
//   [{ id, topic_id, b, se, description, options, correct_option, ... }, ...]
//
// Верните один элемент из remainingItems или null.

// Пример: случайный выбор
const randomIndex = Math.floor(Math.random() * remainingItems.length);
return remainingItems[randomIndex];`;

type TestTab = 'presets' | 'custom' | 'simulation';

const TABS: { key: TestTab; label: string }[] = [
  { key: 'presets', label: 'Готовые сценарии' },
  { key: 'custom', label: 'Свои данные' },
  { key: 'simulation', label: 'Симуляция темы' },
];

export default function AlgorithmPage() {
  const [code, setCode] = useState('');
  const [savedCode, setSavedCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ ok: boolean; message: string } | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TestTab>('presets');

  useEffect(() => {
    loadAlgorithm();
  }, []);

  const loadAlgorithm = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const loaded = await fetchAlgorithmCode();
      setCode(loaded);
      setSavedCode(loaded);
    } catch (err) {
      logger.error('Failed to load algorithm from DB', err);
      setFetchError('Не удалось загрузить алгоритм');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTest = () => {
    setTestResult(null);
    const trimmed = code.trim();
    if (!trimmed) {
      setTestResult({ ok: true, message: 'Код пустой — будет использоваться алгоритм по умолчанию (случайный выбор).' });
      return;
    }
    const fn = compileAlgorithm(trimmed);
    if (!fn) {
      setTestResult({ ok: false, message: 'Ошибка компиляции: код содержит синтаксическую ошибку.' });
      return;
    }
    const mockPrev = [
      { itemId: 'test-1', b: 0.5, se: 0.3, isCorrect: true },
      { itemId: 'test-2', b: 1.0, se: 0.4, isCorrect: false },
    ];
    const mockRemaining = [
      makeItem('test-3', -0.5, 'Задание 3'),
      makeItem('test-4', 1.5, 'Задание 4'),
      makeItem('test-5', 0.0, 'Задание 5'),
    ];
    try {
      const result = fn(mockPrev, mockRemaining);
      if (result === null || result === undefined) {
        setTestResult({ ok: true, message: 'Тест пройден. Функция вернула null (тема завершена).' });
      } else if (!mockRemaining.some((it) => it.id === result.id)) {
        setTestResult({ ok: false, message: `Функция вернула id="${result.id}", которого нет в remainingItems.` });
      } else {
        setTestResult({ ok: true, message: `Тест пройден! Выбрано: "${result.text}" (b=${result.b})` });
      }
    } catch (err) {
      setTestResult({ ok: false, message: `Ошибка выполнения: ${err instanceof Error ? err.message : String(err)}` });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      await saveAlgorithmCode(code);
      setSavedCode(code);
      setSaveMessage({ ok: true, message: 'Алгоритм сохранён. Новые сессии будут использовать обновлённый код.' });
    } catch (err) {
      logger.error('Failed to save algorithm', err);
      setSaveMessage({ ok: false, message: `Ошибка сохранения: ${err instanceof Error ? err.message : String(err)}` });
    } finally {
      setSaving(false);
    }
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    setTestResult(null);
    setSaveMessage(null);
  };

  if (loading) return <AdminLoadingSpinner />;

  if (fetchError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Алгоритм выбора заданий</h1>
        <AdminFetchError message={fetchError} onRetry={loadAlgorithm} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Алгоритм выбора заданий</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          JavaScript-код, который выбирает следующее задание. Параметры:{' '}
          <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">previousAnswers</code> и{' '}
          <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">remainingItems</code>.
        </p>
      </div>

      <AlgorithmEditor
        code={code}
        onChange={handleCodeChange}
        onTest={handleQuickTest}
        onSave={handleSave}
        onInsertDefault={() => { setCode(DEFAULT_CODE); setTestResult(null); setSaveMessage(null); }}
        onClear={() => { setCode(''); setTestResult(null); setSaveMessage(null); }}
        saving={saving}
        hasChanges={code !== savedCode}
        testResult={testResult}
        saveMessage={saveMessage}
        defaultCode={DEFAULT_CODE}
      />

      {/* Testing section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Тестирование алгоритма</h2>

        <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === key
                  ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'presets' && <PresetTests code={code} />}
        {activeTab === 'custom' && <CustomTest code={code} />}
        {activeTab === 'simulation' && <SimulationTest code={code} />}
      </div>

      <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1">
        <p>Если код пустой, используется алгоритм по умолчанию (случайный выбор задания).</p>
        <p>Изменения вступают в силу для новых сессий (текущие активные сессии не затрагиваются).</p>
      </div>
    </div>
  );
}
