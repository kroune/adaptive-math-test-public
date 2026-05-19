import { useEffect, useMemo } from 'react';
import type { AnswerOptionForm } from './itemForm';

interface Props {
  index: number;
  option: AnswerOptionForm;
  isCorrect: boolean;
  removable: boolean;
  pendingFile: File | null;
  onUpdate: (patch: Partial<AnswerOptionForm>) => void;
  onMarkCorrect: () => void;
  onRemove: () => void;
  onFileChange: (file: File | null) => void;
  onClearImage: () => void;
  registerFileInputRef: (el: HTMLInputElement | null) => void;
}

/**
 * One row in the choice-options editor: radio + text + file/URL + preview.
 * Owns the blob-URL lifecycle for the preview to avoid the memory leak the
 * pre-refactor inline render had (URL.createObjectURL called on every render
 * without revocation).
 */
export default function OptionEditor({
  index,
  option,
  isCorrect,
  removable,
  pendingFile,
  onUpdate,
  onMarkCorrect,
  onRemove,
  onFileChange,
  onClearImage,
  registerFileInputRef,
}: Props) {
  const previewUrl = useMemo(
    () => (pendingFile ? URL.createObjectURL(pendingFile) : null),
    [pendingFile],
  );

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const hasImage = Boolean(option.image_url) || Boolean(pendingFile);

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 space-y-2">
      {/* Row: radio + label + remove */}
      <div className="flex items-center gap-2">
        <input
          type="radio"
          name="correct"
          checked={isCorrect}
          onChange={onMarkCorrect}
          title="Правильный ответ"
        />
        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Вариант {String.fromCharCode(65 + index)}
          {isCorrect && (
            <span className="ml-1.5 text-green-600 dark:text-green-400 normal-case tracking-normal">
              ✓ правильный
            </span>
          )}
        </span>
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-auto text-red-400 hover:text-red-600 dark:hover:text-red-300 text-lg leading-none cursor-pointer px-1"
            title="Удалить вариант"
          >
            ×
          </button>
        )}
      </div>

      {/* Option text */}
      <input
        type="text"
        value={option.text}
        onChange={(e) => onUpdate({ text: e.target.value })}
        className="w-full px-3 py-2 border rounded-lg text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        placeholder={`Текст варианта ${String.fromCharCode(65 + index)} (необязательно)`}
      />

      {/* Option image controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <label className="flex-shrink-0 text-xs text-gray-600 dark:text-gray-400 font-medium">
          Картинка:
        </label>

        <input
          ref={registerFileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          className="flex-1 min-w-0 text-xs dark:text-gray-300 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-600 dark:file:bg-gray-700 dark:file:text-gray-300 file:cursor-pointer"
        />

        <input
          type="url"
          value={option.image_url}
          onChange={(e) => {
            const url = e.target.value;
            onUpdate({ image_url: url });
            if (url) onFileChange(null);
          }}
          className="w-36 px-2 py-1 border rounded text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          placeholder="URL..."
        />

        {hasImage && (
          <button
            type="button"
            onClick={onClearImage}
            className="text-xs text-red-400 hover:text-red-600 cursor-pointer"
          >
            Удалить
          </button>
        )}
      </div>

      {/* Preview */}
      {(previewUrl || option.image_url) && (
        <div className="mt-1">
          <img
            src={previewUrl ?? option.image_url}
            alt="Превью"
            className="max-h-20 rounded object-contain border border-gray-200 dark:border-gray-600"
          />
          {pendingFile && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
              {pendingFile.name}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
