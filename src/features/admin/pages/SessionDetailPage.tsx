import { useParams, Link } from 'react-router-dom';
import { fetchSessionById, fetchItemAnswersBySession, fetchMotivationAnswersBySession } from '../../../data/remote/adminSessionsApi';
import { fetchTopics } from '../../../data/repositories/topicsRepo';
import { fetchAllItems } from '../../../data/repositories/itemsRepo';
import { fetchMotivationQuestions } from '../../../data/repositories/motivationRepo';
import { useAdminFetch } from '../hooks/useAdminFetch';
import { downloadPdfForSession } from '../utils/pdfExport';
import { buildItemConditionsMd, downloadMd } from '../utils/itemConditionsMd';
import { logger } from '../../../lib/logger';
import AdminLoadingSpinner from '../../../components/AdminLoadingSpinner';
import AdminFetchError from '../../../components/AdminFetchError';
import type {
  Session,
  ItemAnswer,
  MotivationAnswer,
  Topic,
  Item,
  MotivationQuestion,
} from '../../../types';

export default function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();

  const { data, loading, fetchError, reload } = useAdminFetch(
    async () => {
      if (!sessionId) throw new Error('No session ID');
      const [session, answers, motivationAnswers, topics, items, mqList] = await Promise.all([
        fetchSessionById(sessionId),
        fetchItemAnswersBySession(sessionId),
        fetchMotivationAnswersBySession(sessionId),
        fetchTopics(),
        fetchAllItems(),
        fetchMotivationQuestions(),
      ]);
      logger.info('Session detail loaded', {
        sessionId,
        answers: answers.length,
        motivationAnswers: motivationAnswers.length,
      });
      return { session, answers, motivationAnswers, topics, items, mqList };
    },
    {
      session: null as Session | null,
      answers: [] as ItemAnswer[],
      motivationAnswers: [] as MotivationAnswer[],
      topics: [] as Topic[],
      items: [] as Item[],
      mqList: [] as MotivationQuestion[],
    },
    'Не удалось загрузить данные сессии'
  );

  const { session, answers, motivationAnswers, topics, items, mqList } = data;

  if (loading) {
    return <AdminLoadingSpinner />;
  }

  if (fetchError) {
    return (
      <div className="space-y-6">
        <Link to="/admin/sessions" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          &larr; Назад к результатам
        </Link>
        <AdminFetchError message={fetchError} onRetry={reload} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-red-500 dark:text-red-400 py-8 text-center">Сессия не найдена</div>
    );
  }

  const topicMap = new Map(topics.map((t) => [t.id, t.name]));
  const itemMap = new Map(items.map((it) => [it.id, it]));
  const mqMap = new Map(mqList.map((q) => [q.id, q]));

  const correctCount = answers.filter((a) => a.is_correct).length;

  const exportReport = async () => {
    await downloadPdfForSession(session, answers, itemMap, topics);
  };

  const exportConditionsMd = () => {
    const itemIds = answers.map((a) => a.item_id);
    const md = buildItemConditionsMd({ items, topics, itemIds });
    downloadMd(md, `conditions_${session.name}_${session.surname}.md`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/admin/sessions"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          &larr; Назад к результатам
        </Link>
        <div className="flex gap-2">
          <button
            onClick={() => void exportReport()}
            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors cursor-pointer"
          >
            Скачать отчёт (PDF)
          </button>
          <button
            onClick={exportConditionsMd}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Условия (MD)
          </button>
        </div>
      </div>

      {/* Session info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-6">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          {session.name} {session.surname}
        </h1>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Школа:</span>{' '}
            <span className="font-medium text-gray-800 dark:text-gray-100">{session.school}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Класс:</span>{' '}
            <span className="font-medium text-gray-800 dark:text-gray-100">{session.grade || '—'}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Режим:</span>{' '}
            <span className="font-medium text-gray-800 dark:text-gray-100">
              {session.mode === 'adaptive' ? 'Адаптивный' : 'Автоматический'}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Начало:</span>{' '}
            <span className="font-medium text-gray-800 dark:text-gray-100">
              {session.started_at
                ? new Date(session.started_at).toLocaleString('ru-RU')
                : '—'}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Конец:</span>{' '}
            <span className="font-medium text-gray-800 dark:text-gray-100">
              {session.finished_at
                ? new Date(session.finished_at).toLocaleString('ru-RU')
                : '—'}
            </span>
          </div>
        </div>
        <div className="mt-4 text-sm flex items-center gap-4">
          <span>
            <span className="text-gray-500 dark:text-gray-400">Результат:</span>{' '}
            <span className="font-bold text-purple-700 dark:text-purple-400">
              {correctCount} / {answers.length} (
              {answers.length > 0
                ? ((correctCount / answers.length) * 100).toFixed(0)
                : 0}
              %)
            </span>
          </span>
          {session.is_force_terminated && (
            <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
              Принудительно завершён
            </span>
          )}
          {session.is_early_exit && (
            <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
              Досрочный выход
            </span>
          )}
        </div>
      </div>

      {/* Item answers */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">
          Ответы на задания
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
              <tr>
                <th className="text-left px-4 py-3">#</th>
                <th className="text-left px-4 py-3">Тема</th>
                <th className="text-left px-4 py-3">Задание</th>
                <th className="text-left px-4 py-3">Описание</th>
                <th className="text-center px-4 py-3">b</th>
                <th className="text-center px-4 py-3">Ответ</th>
                <th className="text-center px-4 py-3">Верно</th>
                <th className="text-center px-4 py-3">Время</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {answers.map((a, i) => {
                const item = itemMap.get(a.item_id);
                return (
                  <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-2 text-gray-400 dark:text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2 text-gray-800 dark:text-gray-100">
                      {topicMap.get(a.topic_id) ?? '—'}
                    </td>
                    <td className="px-4 py-2 max-w-xs truncate text-gray-800 dark:text-gray-100">
                      {item?.text ?? a.item_id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-2 max-w-xs truncate text-gray-500 dark:text-gray-400 text-xs">
                      {item?.description || '—'}
                    </td>
                    <td className="px-4 py-2 text-center text-gray-800 dark:text-gray-100">{item?.b ?? '—'}</td>
                    <td className="px-4 py-2 text-center text-gray-800 dark:text-gray-100">
                      {a.text_answer_given != null
                        ? a.text_answer_given
                        : a.answer_given != null
                          ? (item?.options?.[a.answer_given]?.text ?? String.fromCharCode(1040 + a.answer_given))
                          : '—'}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {a.is_correct ? (
                        <span className="text-green-600 dark:text-green-400 font-medium">Да</span>
                      ) : (
                        <span className="text-red-500 dark:text-red-400 font-medium">Нет</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center text-gray-500 dark:text-gray-400">
                      {(a.time_spent_ms / 1000).toFixed(1)}с
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Motivation answers */}
      {motivationAnswers.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">
            Психологические ответы
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                <tr>
                  <th className="text-left px-4 py-3">Вопрос</th>
                  <th className="text-left px-4 py-3">Ответ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {motivationAnswers.map((ma) => {
                  const q = mqMap.get(ma.question_id);
                  return (
                    <tr key={ma.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-2 text-gray-800 dark:text-gray-100">{q?.text ?? '—'}</td>
                      <td className="px-4 py-2 text-gray-800 dark:text-gray-100">
                        {q?.options?.[ma.answer_given] ??
                          String(ma.answer_given)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
