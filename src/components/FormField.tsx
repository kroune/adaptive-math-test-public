import type { ReactNode } from 'react';

interface Props {
  label: ReactNode;
  children: ReactNode;
  /** Small grey helper text rendered under the input. */
  hint?: ReactNode;
  /** Optional error message rendered in red under the input. */
  error?: ReactNode;
  className?: string;
}

/**
 * Label + control wrapper for admin forms. Caller still owns the input —
 * the wrapper just provides the label/spacing/hint pattern that's duplicated
 * across ItemsPage, TopicsPage, MotivationPage, LinearTestPage.
 */
export default function FormField({ label, children, hint, error, className = '' }: Props) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}
