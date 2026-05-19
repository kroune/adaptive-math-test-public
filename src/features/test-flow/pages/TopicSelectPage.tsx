import type { Topic } from '../../../types';
import { CheckCircleIcon, ExitIcon } from '../../../components/Icons';

interface Props {
  topics: Topic[];
  completedTopicIds: string[];
  onSelect: (topicId: string) => void;
  onExit?: () => void;
}

const TOPIC_COLORS = [
  { bg: 'bg-coral', shadow: 'shadow-coral/25 hover:shadow-coral/40' },
  { bg: 'bg-seafoam', shadow: 'shadow-seafoam/25 hover:shadow-seafoam/40' },
  { bg: 'bg-sunshine text-charcoal', shadow: 'shadow-sunshine/25 hover:shadow-sunshine/40' },
  { bg: 'bg-grape', shadow: 'shadow-grape/25 hover:shadow-grape/40' },
  { bg: 'bg-mint', shadow: 'shadow-mint/25 hover:shadow-mint/40' },
];

export default function TopicSelectPage({
  topics,
  completedTopicIds,
  onSelect,
  onExit,
}: Props) {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cream dark:bg-midnight p-4 py-8 font-child overflow-y-auto"
      style={{ backgroundImage: 'radial-gradient(ellipse 50% 50% at 75% -5%, var(--blob-grape), transparent), radial-gradient(ellipse 50% 50% at -5% 95%, var(--blob-sunshine), transparent)' }}
    >
      <div className="relative w-full max-w-2xl space-y-6">
        <div className="text-center animate-bounce-in relative">
          <h1 className="text-3xl font-display font-bold text-charcoal dark:text-warm-white mb-2">
            Выбери тему
          </h1>
          <p className="text-charcoal/50 dark:text-warm-white/50">
            Пройдено: {completedTopicIds.length} из {topics.length}
          </p>
          {onExit && (
            <button
              onClick={onExit}
              className="absolute top-0 right-0 flex items-center gap-1.5 px-3 py-1.5 text-sm text-charcoal/40 hover:text-rose dark:text-warm-white/40 dark:hover:text-rose transition-colors cursor-pointer rounded-xl hover:bg-charcoal/5 dark:hover:bg-warm-white/5"
              title="Завершить досрочно"
            >
              <ExitIcon className="w-4 h-4" />
              <span>Выйти</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {topics.map((topic, i) => {
            const done = completedTopicIds.includes(topic.id);
            const color = TOPIC_COLORS[i % TOPIC_COLORS.length];
            return (
              <button
                key={topic.id}
                onClick={() => !done && onSelect(topic.id)}
                disabled={done}
                className={`
                  relative rounded-[20px] text-center font-display font-bold text-lg
                  shadow-lg transition-all animate-slide-up flex flex-col items-center justify-end
                  overflow-hidden
                  ${topic.icon_url ? 'min-h-[220px] pb-5 px-4' : 'min-h-[120px] px-6 py-8 justify-center'}
                  ${
                    done
                      ? 'bg-charcoal/10 dark:bg-warm-white/5 text-charcoal/30 dark:text-warm-white/20 cursor-not-allowed'
                      : `${color.bg} ${color.shadow} text-white hover:-translate-y-1 hover:shadow-xl active:translate-y-0 active:scale-[0.98] cursor-pointer`
                  }
                `}
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                {topic.icon_url && (
                  <div className="absolute inset-0 flex items-center justify-center p-4 pb-12 overflow-hidden">
                    <img
                      src={topic.icon_url}
                      alt=""
                      className="max-w-full max-h-full object-contain drop-shadow-lg"
                    />
                  </div>
                )}
                <span className="relative z-10 drop-shadow-sm">{topic.name}</span>
                {done && (
                  <span className="absolute top-3 right-3 z-10">
                    <CheckCircleIcon className="w-7 h-7 text-charcoal/20 dark:text-warm-white/15" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
