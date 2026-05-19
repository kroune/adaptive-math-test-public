interface Props {
  code: string;
  onChange: (code: string) => void;
  onTest: () => void;
  onSave: () => void;
  onInsertDefault: () => void;
  onClear: () => void;
  saving: boolean;
  hasChanges: boolean;
  testResult: { ok: boolean; message: string } | null;
  saveMessage: { ok: boolean; message: string } | null;
  defaultCode: string;
}

export default function AlgorithmEditor({
  code,
  onChange,
  onTest,
  onSave,
  onInsertDefault,
  onClear,
  saving,
  hasChanges,
  testResult,
  saveMessage,
  defaultCode,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Code textarea */}
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
        <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-2">
          function getNextItem(previousAnswers, remainingItems) &#123;
        </p>
        <textarea
          value={code}
          onChange={(e) => onChange(e.target.value)}
          placeholder={defaultCode}
          spellCheck={false}
          className="w-full h-80 font-mono text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-4 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
        <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-2">&#125;</p>
      </div>

      {/* Reference */}
      <details className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <summary className="cursor-pointer text-sm font-medium text-blue-700 dark:text-blue-300">
          Справка: типы данных
        </summary>
        <div className="mt-3 space-y-3 text-sm text-gray-700 dark:text-gray-300">
          <div>
            <p className="font-semibold mb-1">previousAnswers:</p>
            <pre className="bg-white dark:bg-gray-800 rounded p-2 text-xs overflow-x-auto">
{`[{ itemId: "uuid", b: 0.5, se: 0.3, isCorrect: true }, ...]`}
            </pre>
          </div>
          <div>
            <p className="font-semibold mb-1">remainingItems:</p>
            <pre className="bg-white dark:bg-gray-800 rounded p-2 text-xs overflow-x-auto">
{`[{ id: "uuid", topic_id: "uuid", b: 1.5, se: 0.3,
   text: "...", options: [...], correct_option: 0 }, ...]`}
            </pre>
          </div>
          <div>
            <p className="font-semibold mb-1">Группы сложности:</p>
            <div className="flex gap-3 text-xs">
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded text-green-700 dark:text-green-300">Easy: b &lt; -0.7</span>
              <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 rounded text-amber-700 dark:text-amber-300">Medium: -0.7 &le; b &le; 0.7</span>
              <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded text-red-700 dark:text-red-300">Hard: b &gt; 0.7</span>
            </div>
          </div>
        </div>
      </details>

      {/* Feedback messages */}
      {testResult && <FeedbackBanner ok={testResult.ok} message={testResult.message} />}
      {saveMessage && <FeedbackBanner ok={saveMessage.ok} message={saveMessage.message} />}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button onClick={onTest} className="px-5 py-2.5 text-sm font-medium bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors cursor-pointer">
          Быстрый тест
        </button>
        <button onClick={onSave} disabled={saving} className="px-5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed">
          {saving ? 'Сохраняю...' : 'Сохранить'}
        </button>
        <button onClick={onInsertDefault} className="px-5 py-2.5 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer">
          Вставить пример
        </button>
        <button onClick={onClear} className="px-5 py-2.5 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer">
          Очистить
        </button>
        {hasChanges && (
          <span className="self-center text-xs text-amber-600 dark:text-amber-400">
            Есть несохранённые изменения
          </span>
        )}
      </div>
    </div>
  );
}

function FeedbackBanner({ ok, message }: { ok: boolean; message: string }) {
  return (
    <div
      className={`rounded-xl p-4 text-sm ${
        ok
          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
          : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
      }`}
    >
      {message}
    </div>
  );
}
