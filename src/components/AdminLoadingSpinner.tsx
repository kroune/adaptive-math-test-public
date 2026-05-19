import { SpinnerIcon } from './Icons';

export default function AdminLoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <SpinnerIcon className="w-8 h-8 text-blue-500 dark:text-blue-400" />
    </div>
  );
}
