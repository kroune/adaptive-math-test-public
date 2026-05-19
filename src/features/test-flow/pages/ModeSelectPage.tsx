import { TargetIcon, RocketIcon } from '../../../components/Icons';

interface Props {
  onSelect: (mode: 'adaptive' | 'nonadaptive') => void;
}

export default function ModeSelectPage({ onSelect }: Props) {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cream dark:bg-midnight p-4 font-child"
      style={{ backgroundImage: 'radial-gradient(ellipse 50% 50% at -5% 10%, var(--blob-coral), transparent), radial-gradient(ellipse 50% 50% at 105% 95%, var(--blob-seafoam), transparent)' }}
    >
      <div className="relative w-full max-w-2xl space-y-8">
        <div className="text-center animate-bounce-in">
          <h1 className="text-4xl font-display font-bold text-charcoal dark:text-warm-white mb-2">
            Выбери режим
          </h1>
          <p className="text-charcoal/50 dark:text-warm-white/50 text-lg">
            Как ты хочешь проходить тест?
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <button
            onClick={() => onSelect('adaptive')}
            className="group bg-white dark:bg-surface-dark rounded-[24px] shadow-lg shadow-orange-900/6 dark:shadow-black/20 p-8 text-left cursor-pointer transition-all hover:shadow-xl hover:shadow-coral/12 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] border-2 border-transparent hover:border-coral/30 dark:hover:border-coral/25 animate-slide-up"
          >
            <div className="mb-5 w-14 h-14 rounded-2xl bg-coral-bg dark:bg-coral/10 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3">
              <TargetIcon className="w-8 h-8 text-coral dark:text-coral-light" />
            </div>
            <h2 className="text-xl font-display font-bold text-charcoal dark:text-warm-white mb-2">
              Я выбираю темы
            </h2>
            <p className="text-charcoal/50 dark:text-warm-white/50 text-sm leading-relaxed">
              Ты сам решаешь, какие темы проходить. Между темами будут
              короткие вопросы.
            </p>
          </button>

          <button
            onClick={() => onSelect('nonadaptive')}
            className="group bg-white dark:bg-surface-dark rounded-[24px] shadow-lg shadow-orange-900/6 dark:shadow-black/20 p-8 text-left cursor-pointer transition-all hover:shadow-xl hover:shadow-seafoam/12 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] border-2 border-transparent hover:border-seafoam/30 dark:hover:border-seafoam/25 animate-slide-up"
            style={{ animationDelay: '0.08s' }}
          >
            <div className="mb-5 w-14 h-14 rounded-2xl bg-seafoam-bg dark:bg-seafoam/10 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:-rotate-3">
              <RocketIcon className="w-8 h-8 text-seafoam dark:text-seafoam-light" />
            </div>
            <h2 className="text-xl font-display font-bold text-charcoal dark:text-warm-white mb-2">
              Автоматический
            </h2>
            <p className="text-charcoal/50 dark:text-warm-white/50 text-sm leading-relaxed">
              Темы выбираются за тебя. Просто решай задания одно за другим!
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
