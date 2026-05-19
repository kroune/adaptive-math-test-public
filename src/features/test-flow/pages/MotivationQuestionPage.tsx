import { useState, useRef, useEffect } from 'react';
import type { MotivationQuestion } from '../../../types';
import { ThoughtBubbleIcon } from '../../../components/Icons';


interface Props {
  question: MotivationQuestion;
  onAnswer: (answerIndex: number, shownAt: string, answeredAt: string) => void;
}

export default function MotivationQuestionPage({ question, onAnswer }: Props) {
  // Track selection per question ID — resets automatically when question changes
  const [selection, setSelection] = useState<{ questionId: string; index: number } | null>(null);
  const selected = selection?.questionId === question.id ? selection.index : null;

  // Reset shownAt when question changes
  const lastQuestionIdRef = useRef(question.id);
  const shownAtRef = useRef(new Date().toISOString());
  const answerTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  if (lastQuestionIdRef.current !== question.id) {
    lastQuestionIdRef.current = question.id;
    shownAtRef.current = new Date().toISOString();
  }

  useEffect(() => {
    return () => {
      if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current);
    };
  }, []);

  const handleSelect = (index: number) => {
    if (selected !== null) return;
    setSelection({ questionId: question.id, index });
    const answeredAt = new Date().toISOString();
    answerTimeoutRef.current = setTimeout(() => onAnswer(index, shownAtRef.current, answeredAt), 600);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cream dark:bg-midnight p-4 font-child"
      style={{ backgroundImage: 'radial-gradient(ellipse 50% 55% at -10% 40%, var(--blob-grape), transparent)' }}
    >
      <div className="bg-white dark:bg-surface-dark rounded-[28px] shadow-xl shadow-orange-900/8 dark:shadow-black/30 p-8 w-full max-w-lg space-y-6 animate-bounce-in">
        <div className="text-center">
          {question.image_url ? (
            <div className="mb-4 flex justify-center">
              <img src={question.image_url} alt="" className="max-h-48 rounded-2xl object-contain" />
            </div>
          ) : (
            <div className="mb-4 inline-flex w-14 h-14 rounded-2xl bg-grape-bg dark:bg-grape/10 items-center justify-center">
              <ThoughtBubbleIcon className="w-8 h-8 text-grape dark:text-grape-light" />
            </div>
          )}
          <h2 className="text-xl font-display font-bold text-charcoal dark:text-warm-white">
            {question.text}
          </h2>
        </div>

        <div className="space-y-3">
          {question.options.map((option, i) => (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={selected !== null}
              className={`
                w-full py-4 px-6 rounded-2xl text-lg font-semibold transition-all text-left cursor-pointer active:scale-[0.97]
                ${
                  selected === i
                    ? 'bg-grape text-white scale-[1.01] shadow-lg shadow-grape/25'
                    : selected !== null
                      ? 'bg-charcoal/5 dark:bg-warm-white/5 text-charcoal/25 dark:text-warm-white/20'
                      : 'bg-grape-bg dark:bg-grape/8 hover:bg-grape/10 dark:hover:bg-grape/15 text-charcoal dark:text-warm-white border-2 border-grape/15 dark:border-grape/15 hover:border-grape/35 dark:hover:border-grape/30'
                }
              `}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
