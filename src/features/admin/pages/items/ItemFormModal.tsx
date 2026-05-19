import { useRef, type FormEvent } from 'react';
import Modal from '../../../../components/Modal';
import FormField from '../../../../components/FormField';
import OptionEditor from './OptionEditor';
import { EMPTY_OPTION, type ItemForm } from './itemForm';
import type { Topic } from '../../../../types';

interface Props {
  form: ItemForm;
  setForm: React.Dispatch<React.SetStateAction<ItemForm>>;
  topics: Topic[];
  editing: boolean;
  saving: boolean;
  error: string | null;
  imageFile: File | null;
  setImageFile: (f: File | null) => void;
  optionImageFiles: (File | null)[];
  setOptionImageFiles: React.Dispatch<React.SetStateAction<(File | null)[]>>;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
}

export default function ItemFormModal({
  form,
  setForm,
  topics,
  editing,
  saving,
  error,
  imageFile,
  setImageFile,
  optionImageFiles,
  setOptionImageFiles,
  onSubmit,
  onCancel,
}: Props) {
  const optionFileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleMainFile = (file: File | null) => {
    setImageFile(file);
    if (file) setForm((f) => ({ ...f, image_url: '' }));
  };

  const updateOption = (index: number, patch: Partial<ItemForm['options'][number]>) => {
    setForm((prev) => {
      const opts = [...prev.options];
      opts[index] = { ...opts[index], ...patch };
      return { ...prev, options: opts };
    });
  };

  const setOptionFile = (index: number, file: File | null) => {
    setOptionImageFiles((prev) => {
      const next = [...prev];
      next[index] = file;
      return next;
    });
    if (file) updateOption(index, { image_url: '' });
  };

  const clearOptionImage = (index: number) => {
    setOptionFile(index, null);
    updateOption(index, { image_url: '' });
    const input = optionFileInputRefs.current[index];
    if (input) input.value = '';
  };

  const addOption = () => {
    setForm((prev) => ({ ...prev, options: [...prev.options, { ...EMPTY_OPTION }] }));
    setOptionImageFiles((prev) => [...prev, null]);
  };

  const removeOption = (index: number) => {
    setForm((prev) => {
      const opts = prev.options.filter((_, i) => i !== index);
      let correct = prev.correct_option;
      if (correct === index) correct = 0;
      else if (correct > index) correct -= 1;
      return { ...prev, options: opts, correct_option: correct };
    });
    setOptionImageFiles((prev) => prev.filter((_, i) => i !== index));
    optionFileInputRefs.current = optionFileInputRefs.current.filter((_, i) => i !== index);
  };

  return (
    <Modal maxWidth="max-w-xl" title={editing ? 'Редактировать задание' : 'Новое задание'}>
      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-sm p-3 rounded-lg">
            {error}
          </div>
        )}

        <FormField label="Тема">
          <select
            value={form.topic_id}
            onChange={(e) => setForm((f) => ({ ...f, topic_id: e.target.value }))}
            required
            className="w-full px-3 py-2 border rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          >
            {topics.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Картинка задания (файл)">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleMainFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm dark:text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900 dark:file:text-blue-300 file:cursor-pointer"
          />
          {imageFile && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Выбран файл: {imageFile.name}
            </p>
          )}
        </FormField>

        <FormField label="Или URL картинки задания">
          <input
            type="url"
            value={form.image_url}
            onChange={(e) => {
              const url = e.target.value;
              setForm((f) => ({ ...f, image_url: url }));
              if (url) handleMainFile(null);
            }}
            className="w-full px-3 py-2 border rounded-lg text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            placeholder="https://..."
          />
        </FormField>

        <FormField label="Текст задания (необязательно)">
          <textarea
            value={form.text}
            onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 border rounded-lg text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
        </FormField>

        <FormField
          label="Описание (только для админки и экспорта)"
          hint="Не видно ребёнку. Используется для удобства работы с данными."
        >
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Например: задача на сложение двузначных чисел"
            className="w-full px-3 py-2 border rounded-lg text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
        </FormField>

        {/* Answer type toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Тип ответа
          </label>
          <div className="flex gap-3">
            {(['choice', 'text_input'] as const).map((type) => (
              <label
                key={type}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  form.answer_type === type
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <input
                  type="radio"
                  name="answer_type"
                  value={type}
                  checked={form.answer_type === type}
                  onChange={() => setForm((f) => ({ ...f, answer_type: type }))}
                  className="sr-only"
                />
                <span className="text-sm font-medium">
                  {type === 'choice' ? '☑ Выбор варианта' : '✏️ Текстовый ввод'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {form.answer_type === 'choice' && (
          <fieldset className="space-y-3">
            <div className="flex items-center justify-between">
              <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Варианты ответа
              </legend>
              <button
                type="button"
                onClick={addOption}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                + Добавить вариант
              </button>
            </div>

            {form.options.map((opt, i) => (
              <OptionEditor
                key={i}
                index={i}
                option={opt}
                isCorrect={form.correct_option === i}
                removable={form.options.length > 2}
                pendingFile={optionImageFiles[i] ?? null}
                onUpdate={(patch) => updateOption(i, patch)}
                onMarkCorrect={() => setForm((f) => ({ ...f, correct_option: i }))}
                onRemove={() => removeOption(i)}
                onFileChange={(file) => setOptionFile(i, file)}
                onClearImage={() => clearOptionImage(i)}
                registerFileInputRef={(el) => { optionFileInputRefs.current[i] = el; }}
              />
            ))}
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Отметьте радиокнопкой правильный вариант. Текст и/или картинка — минимум одно поле. Минимум 2 варианта.
            </p>
          </fieldset>
        )}

        {form.answer_type === 'text_input' && (
          <FormField
            label="Правильный ответ (точный текст)"
            hint="Сравнение без учёта регистра и пробелов по краям."
          >
            <input
              type="text"
              value={form.correct_text}
              onChange={(e) => setForm((f) => ({ ...f, correct_text: e.target.value }))}
              required
              placeholder="Например: 42"
              className="w-full px-3 py-2 border rounded-lg text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </FormField>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField label="b (сложность)">
            <input
              type="number"
              step="0.01"
              value={form.b}
              onChange={(e) => setForm((f) => ({ ...f, b: e.target.value }))}
              required
              className="w-full px-3 py-2 border rounded-lg text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </FormField>
          <FormField label="se (ошибка)">
            <input
              type="number"
              step="0.01"
              value={form.se}
              onChange={(e) => setForm((f) => ({ ...f, se: e.target.value }))}
              required
              className="w-full px-3 py-2 border rounded-lg text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Класс от">
            <select
              value={form.grade_min}
              onChange={(e) => {
                const v = e.target.value;
                setForm((f) => ({
                  ...f,
                  grade_min: v,
                  grade_max: parseInt(v, 10) > parseInt(f.grade_max, 10) ? v : f.grade_max,
                }));
              }}
              className="w-full px-3 py-2 border rounded-lg text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              {Array.from({ length: 11 }, (_, i) => (
                <option key={i + 1} value={String(i + 1)}>{i + 1} класс</option>
              ))}
            </select>
          </FormField>
          <FormField label="Класс до">
            <select
              value={form.grade_max}
              onChange={(e) => {
                const v = e.target.value;
                setForm((f) => ({
                  ...f,
                  grade_max: v,
                  grade_min: parseInt(v, 10) < parseInt(f.grade_min, 10) ? v : f.grade_min,
                }));
              }}
              className="w-full px-3 py-2 border rounded-lg text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              {Array.from({ length: 11 }, (_, i) => (
                <option key={i + 1} value={String(i + 1)}>{i + 1} класс</option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors cursor-pointer"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
