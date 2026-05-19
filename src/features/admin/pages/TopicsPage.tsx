import { fetchTopics, createTopic, updateTopic, deleteTopic } from '../../../data/repositories/topicsRepo';
import { useAdminFetch } from '../hooks/useAdminFetch';
import { useAdminCrud } from '../hooks/useAdminCrud';
import { useImageUpload } from '../hooks/useImageUpload';
import type { Topic } from '../../../types';

import AdminLoadingSpinner from '../../../components/AdminLoadingSpinner';
import AdminFetchError from '../../../components/AdminFetchError';

interface TopicForm {
  name: string;
  order_index: string;
  icon_url: string;
}

const EMPTY_FORM: TopicForm = { name: '', order_index: '1', icon_url: '' };

export default function TopicsPage() {
  const { data: topics, loading, fetchError, reload } = useAdminFetch(
    fetchTopics,
    [] as Topic[],
    'Не удалось загрузить темы'
  );

  const { imageFile, setImageFile, uploadImage } = useImageUpload('item-images');

  const crud = useAdminCrud<Topic, TopicForm>({
    emptyForm: EMPTY_FORM,
    itemToForm: (t) => ({
      name: t.name,
      order_index: String(t.order_index),
      icon_url: t.icon_url ?? '',
    }),
    getId: (t) => t.id,
    createFn: (p) => createTopic(p as Pick<Topic, 'name' | 'order_index'> & { icon_url?: string | null }),
    updateFn: (id, p) => updateTopic(id, p as Pick<Topic, 'name' | 'order_index'> & { icon_url?: string | null }),
    deleteFn: deleteTopic,
    formToPayload: (f) => ({
      name: f.name.trim(),
      order_index: parseInt(f.order_index) || 1,
      icon_url: f.icon_url || null,
    }),
    onBeforeSubmit: async (f) => {
      if (imageFile) {
        const url = await uploadImage();
        return { ...f, icon_url: url ?? f.icon_url };
      }
      return f;
    },
    reload,
    deleteConfirmMessage: 'Удалить тему? Все задания этой темы тоже будут удалены.',
  });

  const handleOpenNew = () => {
    setImageFile(null);
    const nextOrder = topics.length > 0
      ? Math.max(...topics.map((t) => t.order_index)) + 1
      : 1;
    crud.openNew({ order_index: String(nextOrder) });
  };

  const handleOpenEdit = (topic: Topic) => {
    setImageFile(null);
    crud.openEdit(topic.id, {
      name: topic.name,
      order_index: String(topic.order_index),
      icon_url: topic.icon_url ?? '',
    });
  };

  if (loading) return <AdminLoadingSpinner />;

  if (fetchError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Темы</h1>
        <AdminFetchError message={fetchError} onRetry={reload} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Темы</h1>
        <button
          onClick={handleOpenNew}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
        >
          + Добавить тему
        </button>
      </div>

      {crud.deleteError && (
        <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">
          <span>Ошибка удаления: {crud.deleteError}</span>
          <button onClick={crud.clearDeleteError} className="ml-3 font-medium hover:underline cursor-pointer">✕</button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
            <tr>
              <th className="text-center px-4 py-3 w-20">Порядок</th>
              <th className="text-center px-4 py-3 w-16">Иконка</th>
              <th className="text-left px-4 py-3">Название темы</th>
              <th className="px-4 py-3 w-32"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {topics.map((topic) => (
              <tr key={topic.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400 font-mono">
                  {topic.order_index}
                </td>
                <td className="px-4 py-3 text-center">
                  {topic.icon_url ? (
                    <img src={topic.icon_url} alt="" className="w-8 h-8 object-contain mx-auto rounded" />
                  ) : (
                    <span className="text-gray-300 dark:text-gray-600">—</span>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">
                  {topic.name}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    onClick={() => handleOpenEdit(topic)}
                    className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Ред.
                  </button>
                  <button
                    onClick={() => crud.handleDelete(topic.id)}
                    className="text-red-500 dark:text-red-400 hover:underline cursor-pointer"
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
            {topics.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                  Нет тем
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {crud.showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/50">
          <form
            onSubmit={crud.handleSubmit}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl dark:shadow-gray-900/50 p-6 w-full max-w-sm space-y-4"
          >
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
              {crud.editingId ? 'Редактировать тему' : 'Новая тема'}
            </h2>

            {crud.error && (
              <div className="bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-sm p-3 rounded-lg">
                {crud.error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Название темы
              </label>
              <input
                type="text"
                value={crud.form.name}
                onChange={(e) => crud.setForm((f) => ({ ...f, name: e.target.value }))}
                required
                autoFocus
                className="w-full px-3 py-2 border rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Например: Сложение"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Порядковый номер
              </label>
              <input
                type="number"
                min="1"
                value={crud.form.order_index}
                onChange={(e) => crud.setForm((f) => ({ ...f, order_index: e.target.value }))}
                required
                className="w-full px-3 py-2 border rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Определяет порядок отображения тем
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Иконка (файл)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setImageFile(file);
                  if (file) crud.setForm((f) => ({ ...f, icon_url: '' }));
                }}
                className="w-full text-sm dark:text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900 dark:file:text-blue-300 file:cursor-pointer"
              />
              {imageFile && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Выбран файл: {imageFile.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Или URL иконки
              </label>
              <input
                type="url"
                value={crud.form.icon_url}
                onChange={(e) => {
                  const url = e.target.value;
                  crud.setForm((f) => ({ ...f, icon_url: url }));
                  if (url) setImageFile(null);
                }}
                className="w-full px-3 py-2 border rounded-lg text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                placeholder="https://..."
              />
              {crud.form.icon_url && !imageFile && (
                <img src={crud.form.icon_url} alt="" className="mt-2 w-10 h-10 object-contain rounded" />
              )}
            </div>

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
