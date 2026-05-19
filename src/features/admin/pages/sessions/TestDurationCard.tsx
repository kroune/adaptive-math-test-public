import type { UseTestDurationResult } from './useTestDuration';

interface Props {
  state: UseTestDurationResult;
}

export default function TestDurationCard({ state }: Props) {
  if (state.testDuration === null && !state.error) return null;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 px-4 py-3 flex items-center gap-3 text-sm flex-wrap">
      <label className="text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">
        Время на тест (мин):
      </label>
      <input
        type="number"
        min={0}
        value={state.testDuration ?? 0}
        onChange={(e) => state.setTestDuration(Math.max(0, parseInt(e.target.value, 10) || 0))}
        disabled={state.testDuration === null}
        className="w-20 px-2 py-1 border rounded-lg text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
      />
      <button
        onClick={() => state.testDuration !== null && void state.saveTestDuration(state.testDuration)}
        disabled={state.saving || state.testDuration === null}
        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50"
      >
        {state.saving ? '...' : 'Сохранить'}
      </button>
      <span className="text-gray-400 dark:text-gray-500 text-xs">0 = без ограничений</span>
      {state.error && (
        <span className="text-red-600 dark:text-red-400 text-xs flex items-center gap-1">
          {state.error}
          <button onClick={state.clearError} className="font-bold hover:underline cursor-pointer">✕</button>
        </span>
      )}
    </div>
  );
}
