import { useState, useMemo } from 'react';
import { fetchTopics } from '../../../data/repositories/topicsRepo';
import { fetchAllItems, createItem, updateItem, deleteItem } from '../../../data/repositories/itemsRepo';
import { useAdminFetch } from '../hooks/useAdminFetch';
import { useAdminCrud } from '../hooks/useAdminCrud';
import { useImageUpload } from '../hooks/useImageUpload';
import { uploadImageToStorage } from '../../../domain/imageUpload';
import AdminLoadingSpinner from '../../../components/AdminLoadingSpinner';
import AdminFetchError from '../../../components/AdminFetchError';
import {
  EMPTY_FORM,
  formToPayload,
  itemToForm,
  type ItemForm,
} from './items/itemForm';
import ItemFormModal from './items/ItemFormModal';
import type { Topic, Item } from '../../../types';

export default function ItemsPage() {
  const { data, loading, fetchError, reload } = useAdminFetch(
    () => Promise.all([fetchTopics(), fetchAllItems()]).then(([t, i]) => ({ topics: t, items: i })),
    { topics: [] as Topic[], items: [] as Item[] },
    'Не удалось загрузить данные',
  );

  const { topics, items } = data;

  // Item main image
  const { imageFile, setImageFile, uploadImage } = useImageUpload('item-images');

  // Per-option image files (parallel array aligned with form.options)
  const [optionImageFiles, setOptionImageFiles] = useState<(File | null)[]>([]);

  const crud = useAdminCrud<Item, ItemForm>({
    emptyForm: EMPTY_FORM,
    itemToForm,
    getId: (item) => item.id,
    createFn: (p) => createItem(p as Omit<Item, 'id'>),
    updateFn: (id, p) => updateItem(id, p as Partial<Omit<Item, 'id'>>),
    deleteFn: deleteItem,
    formToPayload: (f) => formToPayload(f),
    onBeforeSubmit: async (f) => {
      let updatedF = { ...f };

      if (imageFile) {
        const url = await uploadImage();
        if (url) updatedF = { ...updatedF, image_url: url };
      }

      if (updatedF.answer_type === 'choice') {
        const updatedOptions = [...updatedF.options];
        for (let i = 0; i < optionImageFiles.length; i++) {
          const file = optionImageFiles[i];
          if (file) {
            const url = await uploadImageToStorage(file, 'item-images');
            updatedOptions[i] = { ...updatedOptions[i], image_url: url };
          }
        }
        updatedF = { ...updatedF, options: updatedOptions };
      }

      return updatedF;
    },
    reload,
    deleteConfirmMessage: 'Удалить задание?',
  });

  const [filterTopic, setFilterTopic] = useState('');
  const [search, setSearch] = useState('');

  const filteredItems = useMemo(() => {
    let result = items;
    if (filterTopic) {
      result = result.filter((it) => it.topic_id === filterTopic);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((it) => {
        const text = (it.text ?? '').toLowerCase();
        const desc = (it.description ?? '').toLowerCase();
        const opts = it.options
          .map((o) => `${o.text ?? ''} ${o.image_url ?? ''}`)
          .join(' ')
          .toLowerCase();
        const topicName = (topics.find((t) => t.id === it.topic_id)?.name ?? '').toLowerCase();
        return text.includes(q) || desc.includes(q) || opts.includes(q) || topicName.includes(q);
      });
    }
    return result;
  }, [items, filterTopic, search, topics]);

  const topicName = (id: string) =>
    topics.find((t) => t.id === id)?.name ?? '—';

  const resetFileState = () => {
    setImageFile(null);
    setOptionImageFiles([]);
  };

  const handleOpenNew = () => {
    resetFileState();
    crud.openNew({ topic_id: topics[0]?.id ?? '' });
  };

  const handleOpenEdit = (item: Item) => {
    resetFileState();
    crud.openEdit(item.id, itemToForm(item));
  };

  if (loading) return <AdminLoadingSpinner />;

  if (fetchError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Задания</h1>
        <AdminFetchError message={fetchError} onRetry={reload} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Задания</h1>
        <button
          onClick={handleOpenNew}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
        >
          + Добавить задание
        </button>
      </div>

      {crud.deleteError && (
        <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">
          <span>Ошибка удаления: {crud.deleteError}</span>
          <button onClick={crud.clearDeleteError} className="ml-3 font-medium hover:underline cursor-pointer">✕</button>
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по тексту, вариантам ответа..."
            className="w-full px-3 py-2 border rounded-lg text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>
        <select
          value={filterTopic}
          onChange={(e) => setFilterTopic(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        >
          <option value="">Все темы</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {filteredItems.length} заданий
        </span>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
            <tr>
              <th className="text-left px-4 py-3">Тема</th>
              <th className="text-left px-4 py-3">Текст</th>
              <th className="text-left px-4 py-3">Описание</th>
              <th className="text-center px-4 py-3">Тип ответа</th>
              <th className="text-center px-4 py-3">b</th>
              <th className="text-center px-4 py-3">se</th>
              <th className="text-center px-4 py-3">Классы</th>
              <th className="text-center px-4 py-3">Фото</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3 text-gray-800 dark:text-gray-100">{topicName(item.topic_id)}</td>
                <td className="px-4 py-3 max-w-xs truncate text-gray-800 dark:text-gray-100">
                  {item.text || '—'}
                </td>
                <td className="px-4 py-3 max-w-xs truncate text-gray-500 dark:text-gray-400 text-xs">
                  {item.description || '—'}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      (item.answer_type ?? 'choice') === 'text_input'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                    }`}
                  >
                    {(item.answer_type ?? 'choice') === 'text_input' ? 'Текст' : 'Выбор'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-gray-800 dark:text-gray-100">{item.b}</td>
                <td className="px-4 py-3 text-center text-gray-800 dark:text-gray-100">{item.se}</td>
                <td className="px-4 py-3 text-center text-gray-800 dark:text-gray-100">
                  {item.grade_min === item.grade_max
                    ? `${item.grade_min}`
                    : `${item.grade_min}–${item.grade_max}`}
                </td>
                <td className="px-4 py-3 text-center text-gray-800 dark:text-gray-100">
                  {item.image_url ? 'Да' : '—'}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Ред.
                  </button>
                  <button
                    onClick={() => crud.handleDelete(item.id)}
                    className="text-red-500 dark:text-red-400 hover:underline cursor-pointer"
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                  {items.length === 0 ? 'Нет заданий' : 'Ничего не найдено'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {crud.showForm && (
        <ItemFormModal
          form={crud.form}
          setForm={crud.setForm}
          topics={topics}
          editing={!!crud.editingId}
          saving={crud.saving}
          error={crud.error}
          imageFile={imageFile}
          setImageFile={setImageFile}
          optionImageFiles={optionImageFiles}
          setOptionImageFiles={setOptionImageFiles}
          onSubmit={crud.handleSubmit}
          onCancel={crud.closeForm}
        />
      )}
    </div>
  );
}
