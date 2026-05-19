import { useState, useRef, useEffect } from 'react';
import type { AnswerPayload, Item } from '../../../types';
import { ExitIcon } from '../../../components/Icons';


interface Props {
  item: Item;
  topicName: string;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (payload: AnswerPayload, timeSpentMs: number, shownAt: string, answeredAt: string) => void;
  onExit?: () => void;
}

const OPTION_LETTERS = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З'];

const OPTION_STYLES = [
  {
    idle: 'bg-coral-bg dark:bg-coral/10 border-coral/25 dark:border-coral/25 hover:border-coral/55 hover:shadow-md hover:shadow-coral/10 hover:-translate-y-0.5',
    badge: 'bg-coral text-white',
  },
  {
    idle: 'bg-seafoam-bg dark:bg-seafoam/10 border-seafoam/25 dark:border-seafoam/25 hover:border-seafoam/55 hover:shadow-md hover:shadow-seafoam/10 hover:-translate-y-0.5',
    badge: 'bg-seafoam text-white',
  },
  {
    idle: 'bg-grape-bg dark:bg-grape/10 border-grape/25 dark:border-grape/25 hover:border-grape/55 hover:shadow-md hover:shadow-grape/10 hover:-translate-y-0.5',
    badge: 'bg-grape text-white',
  },
  {
    idle: 'bg-sunshine-bg dark:bg-sunshine/10 border-sunshine/25 dark:border-sunshine/25 hover:border-sunshine/55 hover:shadow-md hover:shadow-sunshine/10 hover:-translate-y-0.5',
    badge: 'bg-sunshine text-charcoal',
  },
];

export default function QuestionPage({
  item,
  topicName,
  questionNumber,
  totalQuestions,
  onAnswer,
  onExit,
}: Props) {
  // Choice mode state
  const [selection, setSelection] = useState<{ itemId: string; index: number } | null>(null);
  const selected = selection?.itemId === item.id ? selection.index : null;

  // Text-input mode state
  const [textValue, setTextValue] = useState('');
  const [textSubmitted, setTextSubmitted] = useState<string | null>(null); // null = not yet submitted

  // Reset timer and capture shown_at synchronously when item changes
  const lastItemIdRef = useRef(item.id);
  const startTimeRef = useRef(performance.now());
  const shownAtRef = useRef(new Date().toISOString());
  const answerTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  if (lastItemIdRef.current !== item.id) {
    lastItemIdRef.current = item.id;
    startTimeRef.current = performance.now();
    shownAtRef.current = new Date().toISOString();
    setTextValue('');
    setTextSubmitted(null);
    if (answerTimeoutRef.current) {
      clearTimeout(answerTimeoutRef.current);
      answerTimeoutRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current);
    };
  }, []);

  const handleChoiceSelect = (index: number) => {
    if (selected !== null) return;
    setSelection({ itemId: item.id, index });
    const timeSpent = Math.round(performance.now() - startTimeRef.current);
    const answeredAt = new Date().toISOString();
    answerTimeoutRef.current = setTimeout(
      () => onAnswer({ kind: 'choice', index }, timeSpent, shownAtRef.current, answeredAt),
      800
    );
  };

  const handleTextSubmit = () => {
    if (textSubmitted !== null || !textValue.trim()) return;
    const trimmed = textValue.trim();
    setTextSubmitted(trimmed);
    const timeSpent = Math.round(performance.now() - startTimeRef.current);
    const answeredAt = new Date().toISOString();
    answerTimeoutRef.current = setTimeout(
      () => onAnswer({ kind: 'text', text: trimmed }, timeSpent, shownAtRef.current, answeredAt),
      800
    );
  };

  const progress = (questionNumber / totalQuestions) * 100;
  const hasImage = Boolean(item.image_url);
  const isTextInput = item.answer_type === 'text_input';

  // For choice options: detect if any option has an image
  const anyOptionHasImage = !isTextInput && item.options.some((o) => o.image_url);

  return (
    <div className="h-screen flex flex-col bg-cream dark:bg-midnight font-child overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md shadow-sm shadow-orange-900/5 dark:shadow-black/20 px-5 py-3.5">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-charcoal/45 dark:text-warm-white/45">
              {topicName}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-coral dark:text-coral-light">
                {questionNumber} / {totalQuestions}
              </span>
              {onExit && (
                <button
                  onClick={onExit}
                  className="flex items-center gap-1 text-charcoal/30 hover:text-rose dark:text-warm-white/30 dark:hover:text-rose transition-colors cursor-pointer"
                  title="Завершить досрочно"
                >
                  <ExitIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="w-full bg-charcoal/8 dark:bg-warm-white/8 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-coral dark:bg-coral-light h-2.5 rounded-full transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content — keyed per item for entrance animation */}
      <div key={item.id} className="flex-1 min-h-0 flex flex-col items-center px-4 pt-3 pb-4 gap-3 animate-slide-up overflow-hidden">
        <div className="w-full max-w-3xl flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto">

          {/* Item image */}
          {hasImage && (
            <div className="flex-shrink-0 rounded-3xl overflow-hidden bg-white dark:bg-surface-dark shadow-xl shadow-orange-900/8 dark:shadow-black/30 ring-1 ring-charcoal/5 dark:ring-warm-white/5">
              <img
                src={item.image_url!}
                alt="Задание"
                className="w-full object-contain max-h-[55vh]"
              />
            </div>
          )}

          {/* Text — when no image, centred; when image present, below it */}
          {!hasImage && item.text && (
            <div className="flex-1 min-h-0 flex items-center justify-center">
              <p className="text-2xl text-center font-bold text-charcoal dark:text-warm-white leading-snug">
                {item.text}
              </p>
            </div>
          )}
          {hasImage && item.text && (
            <p className="flex-shrink-0 text-xl text-center font-bold text-charcoal dark:text-warm-white leading-snug">
              {item.text}
            </p>
          )}

          {/* ── CHOICE OPTIONS ── */}
          {!isTextInput && (
            <div
              className={`flex-shrink-0 grid gap-2.5 ${
                anyOptionHasImage
                  ? 'grid-cols-2'
                  : 'grid-cols-1 sm:grid-cols-2'
              }`}
            >
              {item.options.map((option, i) => {
                const style = OPTION_STYLES[i % OPTION_STYLES.length];
                let stateClass: string;
                let badgeClass: string;
                if (selected === null) {
                  stateClass = `${style.idle} cursor-pointer`;
                  badgeClass = style.badge;
                } else if (selected === i) {
                  stateClass = 'bg-coral/15 dark:bg-coral/20 border-coral shadow-lg shadow-coral/20';
                  badgeClass = 'bg-coral text-white';
                } else {
                  stateClass = 'bg-charcoal/4 dark:bg-warm-white/4 border-transparent opacity-35';
                  badgeClass = 'bg-charcoal/12 dark:bg-warm-white/12 text-charcoal/40 dark:text-warm-white/40';
                }

                const hasOptImg = Boolean(option.image_url);
                const hasOptText = Boolean(option.text);

                return (
                  <button
                    key={i}
                    onClick={() => handleChoiceSelect(i)}
                    disabled={selected !== null}
                    className={`
                      relative border-2 rounded-2xl transition-all duration-200 active:scale-[0.97]
                      ${anyOptionHasImage ? 'flex flex-col items-center p-2 gap-1.5' : 'flex items-center gap-3.5 py-4 px-5 text-left'}
                      ${stateClass}
                    `}
                  >
                    {/* Badge */}
                    <span
                      className={`
                        flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black transition-all
                        ${anyOptionHasImage ? 'absolute top-2 left-2 z-10' : ''}
                        ${badgeClass}
                      `}
                    >
                      {OPTION_LETTERS[i] ?? String(i + 1)}
                    </span>

                    {/* Option image */}
                    {hasOptImg && (
                      <img
                        src={option.image_url!}
                        alt={`Вариант ${OPTION_LETTERS[i] ?? i + 1}`}
                        className="w-full rounded-xl object-contain max-h-28"
                        draggable={false}
                      />
                    )}

                    {/* Option text */}
                    {hasOptText && (
                      <span
                        className={`font-bold text-charcoal dark:text-warm-white ${
                          anyOptionHasImage ? 'text-sm text-center w-full' : 'text-lg'
                        }`}
                      >
                        {option.text}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── TEXT INPUT ── */}
          {isTextInput && (
            <div className="flex-shrink-0 flex flex-col items-center gap-4 pt-2">
              <input
                type="text"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleTextSubmit(); }}
                disabled={textSubmitted !== null}
                placeholder="Напиши ответ здесь..."
                autoFocus
                className={`
                  w-full max-w-sm text-center text-2xl font-bold rounded-2xl border-2 px-5 py-4
                  bg-white dark:bg-surface-dark text-charcoal dark:text-warm-white
                  placeholder:text-charcoal/25 dark:placeholder:text-warm-white/25
                  outline-none transition-all duration-200
                  ${textSubmitted !== null
                    ? 'border-coral/50 opacity-60 cursor-not-allowed'
                    : 'border-charcoal/15 dark:border-warm-white/15 focus:border-coral dark:focus:border-coral-light focus:shadow-md focus:shadow-coral/10'
                  }
                `}
              />
              <button
                onClick={handleTextSubmit}
                disabled={textSubmitted !== null || !textValue.trim()}
                className={`
                  px-10 py-4 rounded-2xl font-display font-bold text-xl text-white
                  transition-all duration-200 active:scale-[0.97]
                  ${textSubmitted !== null || !textValue.trim()
                    ? 'bg-charcoal/20 dark:bg-warm-white/10 cursor-not-allowed'
                    : 'bg-coral hover:bg-coral-hover shadow-lg shadow-coral/30 hover:-translate-y-0.5 cursor-pointer'
                  }
                `}
              >
                {textSubmitted !== null ? '...' : 'Ответить!'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
