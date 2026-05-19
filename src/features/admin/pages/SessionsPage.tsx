import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchAllSessions,
  fetchAllItemAnswers,
  forceTerminateAllActiveSessions,
} from '../../../data/remote/adminSessionsApi';
import { useAdminFetch } from '../hooks/useAdminFetch';
import { logger } from '../../../lib/logger';
import AdminLoadingSpinner from '../../../components/AdminLoadingSpinner';
import AdminFetchError from '../../../components/AdminFetchError';
import SessionsFilters from './sessions/SessionsFilters';
import ForceTerminateModal from './sessions/ForceTerminateModal';
import TestDurationCard from './sessions/TestDurationCard';
import { useTestDuration } from './sessions/useTestDuration';
import { useSessionsExports } from './sessions/useSessionsExports';
import type { Session } from '../../../types';

interface SessionWithStats extends Session {
  total_answers: number;
  correct_answers: number;
}

export default function SessionsPage() {
  const { data: sessions, loading, fetchError, reload } = useAdminFetch(
    async () => {
      const [allSessions, allAnswers] = await Promise.all([
        fetchAllSessions(),
        fetchAllItemAnswers(),
      ]);

      logger.info('Sessions page loaded', { sessions: allSessions.length });

      const answersBySession = new Map<string, { total: number; correct: number }>();
      for (const a of allAnswers) {
        const entry = answersBySession.get(a.session_id) ?? { total: 0, correct: 0 };
        entry.total++;
        if (a.is_correct) entry.correct++;
        answersBySession.set(a.session_id, entry);
      }

      return allSessions.map((s) => {
        const stats = answersBySession.get(s.id) ?? { total: 0, correct: 0 };
        return { ...s, total_answers: stats.total, correct_answers: stats.correct } as SessionWithStats;
      });
    },
    [] as SessionWithStats[],
    'Не удалось загрузить данные сессий',
  );

  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showTerminateConfirm, setShowTerminateConfirm] = useState(false);
  const [terminating, setTerminating] = useState(false);
  const [terminateResult, setTerminateResult] = useState<{ count: number } | null>(null);
  const [terminateError, setTerminateError] = useState<string | null>(null);
  const navigate = useNavigate();

  const testDuration = useTestDuration();
  const exports = useSessionsExports();

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return sessions.filter((s) => {
      if (q) {
        const haystack = `${s.name} ${s.surname} ${s.school} ${s.grade} ${s.id}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (modeFilter && s.mode !== modeFilter) return false;
      if (statusFilter === 'finished' && !s.finished_at) return false;
      if (statusFilter === 'active' && s.finished_at) return false;
      if (statusFilter === 'early_exit' && !s.is_early_exit) return false;
      if (statusFilter === 'force_terminated' && !s.is_force_terminated) return false;
      if (dateFrom && s.started_at) {
        if (new Date(s.started_at) < new Date(dateFrom)) return false;
      }
      if (dateTo && s.started_at) {
        const to = new Date(dateTo);
        to.setDate(to.getDate() + 1); // include the end day
        if (new Date(s.started_at) >= to) return false;
      }
      return true;
    });
  }, [sessions, search, modeFilter, statusFilter, dateFrom, dateTo]);

  const stripStats = (rows: SessionWithStats[]): Session[] =>
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      surname: row.surname,
      school: row.school,
      grade: row.grade,
      mode: row.mode,
      started_at: row.started_at,
      finished_at: row.finished_at,
      is_early_exit: row.is_early_exit,
      is_force_terminated: row.is_force_terminated,
    }));

  const handleForceTerminate = async () => {
    setTerminating(true);
    setTerminateError(null);
    try {
      const count = await forceTerminateAllActiveSessions();
      setTerminateResult({ count });
      setShowTerminateConfirm(false);
      reload();
    } catch (err) {
      setTerminateError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setTerminating(false);
    }
  };

  if (loading) return <AdminLoadingSpinner />;

  if (fetchError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Результаты</h1>
        <AdminFetchError message={fetchError} onRetry={reload} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showTerminateConfirm && (
        <ForceTerminateModal
          terminating={terminating}
          error={terminateError}
          onCancel={() => { setShowTerminateConfirm(false); setTerminateError(null); }}
          onConfirm={handleForceTerminate}
        />
      )}

      {terminateResult !== null && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 flex items-center justify-between text-sm">
          <span className="text-red-700 dark:text-red-300">
            Принудительно завершено сессий: <strong>{terminateResult.count}</strong>
          </span>
          <button
            onClick={() => setTerminateResult(null)}
            className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-200 cursor-pointer ml-4"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Результаты</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTerminateConfirm(true)}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
          >
            Завершить все тесты
          </button>
          <button
            onClick={() => void exports.exportCsv(stripStats(filtered))}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
          >
            Экспорт CSV
          </button>
          <button
            onClick={() => void exports.exportBulkZip(stripStats(filtered))}
            disabled={!!exports.bulkProgress}
            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            {exports.bulkProgress
              ? `Генерация ${exports.bulkProgress.current}/${exports.bulkProgress.total}...`
              : 'Все отчёты (ZIP)'}
          </button>
          <button
            onClick={() => void exports.exportLinearConditionsMd()}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Условия (MD)
          </button>
        </div>
      </div>

      <TestDurationCard state={testDuration} />

      <SessionsFilters
        search={search} setSearch={setSearch}
        modeFilter={modeFilter} setModeFilter={setModeFilter}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
        dateFrom={dateFrom} setDateFrom={setDateFrom}
        dateTo={dateTo} setDateTo={setDateTo}
        filteredCount={filtered.length}
        totalCount={sessions.length}
      />

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
            <tr>
              <th className="text-left px-4 py-3">Имя</th>
              <th className="text-left px-4 py-3">Фамилия</th>
              <th className="text-left px-4 py-3">Школа</th>
              <th className="text-center px-4 py-3">Класс</th>
              <th className="text-center px-4 py-3">Режим</th>
              <th className="text-center px-4 py-3">Правильных</th>
              <th className="text-center px-4 py-3">Дата</th>
              <th className="text-center px-4 py-3">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map((s) => (
              <tr
                key={s.id}
                onClick={() => navigate(`/admin/sessions/${s.id}`)}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              >
                <td className="px-4 py-3 text-gray-800 dark:text-gray-100">{s.name}</td>
                <td className="px-4 py-3 text-gray-800 dark:text-gray-100">{s.surname}</td>
                <td className="px-4 py-3 text-gray-800 dark:text-gray-100">{s.school}</td>
                <td className="px-4 py-3 text-center text-gray-800 dark:text-gray-100">{s.grade || '—'}</td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      s.mode === 'adaptive'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    }`}
                  >
                    {s.mode === 'adaptive' ? 'Адаптивный' : 'Автоматический'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400 font-medium">
                  {s.total_answers > 0
                    ? `${s.correct_answers}/${s.total_answers}`
                    : '—'}
                </td>
                <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                  {s.started_at
                    ? new Date(s.started_at).toLocaleDateString('ru-RU')
                    : '—'}
                </td>
                <td className="px-4 py-3 text-center">
                  {s.is_force_terminated ? (
                    <span className="text-red-600 dark:text-red-400 text-xs font-medium">
                      Принуд. завершён
                    </span>
                  ) : s.is_early_exit ? (
                    <span className="text-orange-600 dark:text-orange-400 text-xs font-medium">
                      Досрочный
                    </span>
                  ) : s.finished_at ? (
                    <span className="text-green-600 dark:text-green-400 text-xs font-medium">
                      Завершён
                    </span>
                  ) : (
                    <span className="text-yellow-600 dark:text-yellow-400 text-xs font-medium">
                      В процессе
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                  {sessions.length === 0 ? 'Нет сессий' : 'Ничего не найдено'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
