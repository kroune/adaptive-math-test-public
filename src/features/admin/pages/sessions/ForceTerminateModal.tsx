import Modal from '../../../../components/Modal';

interface Props {
  terminating: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ForceTerminateModal({ terminating, error, onCancel, onConfirm }: Props) {
  return (
    <Modal title="Завершить все тесты?" maxWidth="max-w-sm">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Все активные тесты будут принудительно завершены. Участники увидят экран с результатами.
        Это действие нельзя отменить.
      </p>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
          Ошибка: {error}
        </p>
      )}
      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          disabled={terminating}
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer disabled:opacity-50"
        >
          Отмена
        </button>
        <button
          onClick={onConfirm}
          disabled={terminating}
          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
        >
          {terminating ? 'Завершаю...' : 'Завершить все'}
        </button>
      </div>
    </Modal>
  );
}
