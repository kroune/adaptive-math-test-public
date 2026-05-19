import {
  fetchMotivationQuestions,
  createMotivationQuestion,
  updateMotivationQuestion,
  deleteMotivationQuestion,
} from '../../../data/repositories/motivationRepo';
import { fetchTopics } from '../../../data/repositories/topicsRepo';
import { useAdminFetch } from '../hooks/useAdminFetch';
import { useAdminCrud } from '../hooks/useAdminCrud';
import { useImageUpload } from '../hooks/useImageUpload';
import type { MotivationQuestion, MotivationTiming, Topic } from '../../../types';
import AdminLoadingSpinner from '../../../components/AdminLoadingSpinner';
import AdminFetchError from '../../../components/AdminFetchError';

const TIMING_LABELS: Record<MotivationTiming, string> = {
  before_test: 'Перед началом теста',
  before_topic: 'Перед темой',
  after_topic: 'После темы',
  after_test: 'В конце теста',
};

interface MqForm {
  text: string;
  options: string[];
  image_url: string;
  timing: MotivationTiming;
  topic_id: string;
  order_index: string;
}

const EMPTY_FORM: MqForm = { text: '', options: ['', '', '', ''], image_url: '', timing: 'before_test', topic_id: '', order_index: '0' };

export default function MotivationPage() {
  const { data, loading, fetchError, reload } = useAdminFetch(
    () => Promise.all([fetchMotivationQuestions(), fetchTopics()]).then(([q, t]) => ({ questions: q, topics: t })),
    { questions: [] as MotivationQuestion[], topics: [] as Topic[] },
    'Не удалось загрузить вопросы'
  );

  const { questions, topics } = data;

  const { imageFile, setImageFile, uploadImage } = useImageUpload('item-images');

  const crud = useAdminCrud<MotivationQuestion, MqForm>({
    emptyForm: EMPTY_FORM,
    itemToForm: (q) => ({
      text: q.text,
      options: [...q.options],
      image_url: q.image_url ?? '',
      timing: q.timing,
      topic_id: q.topic_id ?? '',
      order_index: String(q.order_index),
    }),
    getId: (q) => q.id,
    createFn: (p) => createMotivationQuestion(p as Omit<MotivationQuestion, 'id'>),
    updateFn: (id, p) => updateMotivationQuestion(id, p as Omit<MotivationQuestion, 'id'>),
    deleteFn: deleteMotivationQuestion,
    formToPayload: (f) => {
      const filteredOptions = f.options.filter((o) => o.trim() !== '');
      return {
        text: f.text.trim(),
        options: filteredOptions,
        image_url: f.image_url || null,
        timing: f.timing,
        topic_id: (f.timing === 'before_topic' || f.timing === 'after_topic') ? (f.topic_id || null) : null,
        order_index: parseInt(f.order_index) || 0,
      };
    },
    onBeforeSubmit: async (f) => {
      const filteredOptions = f.options.filter((o) => o.trim() !== '');
      if (filteredOptions.length < 2) {
        throw new Error('Нужно хотя бы 2 варианта ответа');
      }
      if (imageFile) {
        const url = await uploadImage();
        return { ...f, image_url: url ?? f.image_url };
      }
      return f;
    },
    reload,
    deleteConfirmMessage: 'Удалить вопрос?',
  });

  const handleOpenNew = () => {
    setImageFile(null);
    crud.openNew({ options: ['', '', '', ''] });
  };

  const handleOpenEdit = (q: MotivationQuestion) => {
    setImageFile(null);
    crud.openEdit(q.id, {
      text: q.text,
      options: [...q.options],
      image_url: q.image_url ?? '',
      timing: q.timing,
      topic_id: q.topic_id ?? '',
      order_index: String(q.order_index),
    });
  };

  const updateOption = (index: number, value: string) => {
    crud.setForm((prev) => {
      const opts = [...prev.options];
      opts[index] = value;
      return { ...prev, options: opts };
    });
  };

  const addOption = () => {
    crud.setForm((prev) => ({ ...prev, options: [...prev.options, ''] }));
  };

  const removeOption = (index: number) => {
    crud.setForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  if (loading) return <AdminLoadingSpinner />;

  if (fetchError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Психологические вопросы
        </h1>
        <AdminFetchError message={fetchError} onRetry={reload} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Психологические вопросы
        </h1>
        <button
          onClick={handleOpenNew}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
        >
          + Добавить вопрос
        </button>
      </div>

      {crud.deleteError && (
        <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">
          <span>Ошибка удаления: {crud.deleteError}</span>
          <button onClick={crud.clearDeleteError} className="ml-3 font-medium hover:underline cursor-pointer">✕</button>
        </div>
      )}

      <div className="space-y-3">
        {questions.map((q) => {
          const topicName = q.topic_id ? topics.find((t) => t.id === q.topic_id)?.name : null;
          return (
          <div
            key={q.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-4 flex items-start justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                  {TIMING_LABELS[q.timing]}
                </span>
                {topicName && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {topicName}
                  </span>
                )}
                {q.image_url && (
                  <span className="text-xs text-blue-500 dark:text-blue-400">Картинка</span>
                )}
              </div>
              <p className="font-medium text-gray-800 dark:text-gray-100">{q.text}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                {q.options.join(' / ')}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => handleOpenEdit(q)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Ред.
              </button>
              <button
                onClick={() => crud.handleDelete(q.id)}
                className="text-sm text-red-500 dark:text-red-400 hover:underline cursor-pointer"
              >
                Удалить
              </button>
            </div>
          </div>
        );
        })}
        {questions.length === 0 && (
          <p className="text-gray-400 dark:text-gray-500 text-center py-8">
            Пока нет психологических вопросов
          </p>
        )}
      </div>

      {crud.showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/50">
          <form
            onSubmit={crud.handleSubmit}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl dark:shadow-gray-900/50 p-6 w-full max-w-md space-y-4"
          >
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
              {crud.editingId ? 'Редактировать вопрос' : 'Новый вопрос'}
            </h2>

            {crud.error && (
              <div className="bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-sm p-3 rounded-lg">
                {crud.error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Текст вопроса
              </label>
              <textarea
                value={crud.form.text}
                onChange={(e) =>
                  crud.setForm((f) => ({ ...f, text: e.target.value }))
                }
                required
                rows={3}
                className="w-full px-3 py-2 border rounded-lg text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Момент показа
                </label>
                <select
                  value={crud.form.timing}
                  onChange={(e) => crud.setForm((f) => ({ ...f, timing: e.target.value as MotivationTiming }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  {(Object.keys(TIMING_LABELS) as MotivationTiming[]).map((t) => (
                    <option key={t} value={t}>{TIMING_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Порядок
                </label>
                <input
                  type="number"
                  min="0"
                  value={crud.form.order_index}
                  onChange={(e) => crud.setForm((f) => ({ ...f, order_index: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>

            {(crud.form.timing === 'before_topic' || crud.form.timing === 'after_topic') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Тема
                </label>
                <select
                  value={crud.form.topic_id}
                  onChange={(e) => crud.setForm((f) => ({ ...f, topic_id: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">— Не выбрана —</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Картинка (файл)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setImageFile(file);
                  if (file) crud.setForm((f) => ({ ...f, image_url: '' }));
                }}
                className="w-full text-sm dark:text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900 dark:file:text-blue-300 file:cursor-pointer"
              />
              {imageFile && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">Выбран: {imageFile.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Или URL картинки
              </label>
              <input
                type="url"
                value={crud.form.image_url}
                onChange={(e) => {
                  const url = e.target.value;
                  crud.setForm((f) => ({ ...f, image_url: url }));
                  if (url) setImageFile(null);
                }}
                className="w-full px-3 py-2 border rounded-lg text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                placeholder="https://..."
              />
              {crud.form.image_url && !imageFile && (
                <img src={crud.form.image_url} alt="" className="mt-2 max-h-20 rounded" />
              )}
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Варианты ответа
              </legend>
              {crud.form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    placeholder={`Вариант ${i + 1}`}
                  />
                  {crud.form.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400 text-lg cursor-pointer"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addOption}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                + ещё вариант
              </button>
            </fieldset>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={crud.closeForm}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={crud.saving}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors cursor-pointer"
              >
                {crud.saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
