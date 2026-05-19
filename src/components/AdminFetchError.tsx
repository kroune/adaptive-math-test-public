import { AlertIcon } from './Icons';

interface AdminFetchErrorProps {
  message: string;
  onRetry?: () => void;
}

export default function AdminFetchError({ message, onRetry }: AdminFetchErrorProps) {
  return (
    <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-4 flex items-center gap-3">
      <AlertIcon className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0" />
      <p className="text-red-600 dark:text-red-400 text-sm flex-1">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-red-600 dark:text-red-400 hover:underline font-medium cursor-pointer shrink-0"
        >
          Повторить
        </button>
      )}
    </div>
  );
}
