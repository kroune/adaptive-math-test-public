import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Optional bold header shown at the top of the card. */
  title?: ReactNode;
  /** Max width in Tailwind sizing tokens (e.g. 'max-w-xl'). Defaults to max-w-md. */
  maxWidth?: string;
  /** Extra classes appended to the inner card. */
  className?: string;
}

/**
 * Generic centered modal: dimmed backdrop + white card.
 * Does NOT close on backdrop click or Escape — the parent component decides
 * how the modal is dismissed (typically via a button inside `children`).
 * Used by all admin forms; child-facing modals use ExitConfirmModal which is
 * styled separately for the kid theme.
 */
export default function Modal({ children, title, maxWidth = 'max-w-md', className = '' }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/50 p-4">
      <div
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl dark:shadow-gray-900/50 p-6 w-full ${maxWidth} max-h-[90vh] overflow-y-auto space-y-4 ${className}`}
      >
        {title && (
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{title}</h2>
        )}
        {children}
      </div>
    </div>
  );
}
