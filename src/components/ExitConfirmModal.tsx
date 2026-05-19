interface Props {
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ExitConfirmModal({ onCancel, onConfirm }: Props) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 dark:bg-black/60 p-4 font-child animate-fade-in">
      <div className="bg-white dark:bg-surface-dark rounded-[24px] shadow-2xl p-6 max-w-sm w-full space-y-4 text-center animate-pop">
        <h2 className="text-xl font-display font-bold text-charcoal dark:text-warm-white">
          Завершить тестирование?
        </h2>
        <p className="text-charcoal/50 dark:text-warm-white/50">
          Ты уверен, что хочешь закончить? Все ответы будут сохранены.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-bold text-charcoal/60 dark:text-warm-white/60 bg-charcoal/5 dark:bg-warm-white/8 rounded-xl hover:bg-charcoal/10 dark:hover:bg-warm-white/12 transition-colors cursor-pointer"
          >
            Продолжить тест
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 text-sm font-bold text-white bg-rose-dark rounded-xl hover:bg-rose transition-colors cursor-pointer"
          >
            Да, завершить
          </button>
        </div>
      </div>
    </div>
  );
}
