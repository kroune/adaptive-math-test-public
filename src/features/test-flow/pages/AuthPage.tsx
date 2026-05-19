import { useState, type FormEvent } from 'react';
import { WaveIcon } from '../../../components/Icons';

interface Props {
  onSubmit: (data: { name: string; surname: string; school: string; grade: string }) => void;
}

function setValidity(e: React.SyntheticEvent<HTMLInputElement>) {
  (e.target as HTMLInputElement).setCustomValidity('Пожалуйста, заполни это поле');
}

function clearValidity(e: React.SyntheticEvent<HTMLInputElement>) {
  (e.target as HTMLInputElement).setCustomValidity('');
}

const INPUT_CLASS =
  'w-full px-4 py-3.5 rounded-2xl border-[2.5px] border-warm-border dark:border-dark-border bg-white dark:bg-midnight/50 text-lg text-charcoal dark:text-warm-white placeholder-charcoal/30 dark:placeholder-warm-white/30 focus:border-coral dark:focus:border-coral-light focus:outline-none transition-colors';

export default function AuthPage({ onSubmit }: Props) {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [school, setSchool] = useState('');
  const [grade, setGrade] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = {
      name: name.trim(),
      surname: surname.trim(),
      school: school.trim(),
      grade: grade.trim(),
    };
    if (!trimmed.name || !trimmed.surname || !trimmed.school || !trimmed.grade) return;
    onSubmit(trimmed);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cream dark:bg-midnight p-4 font-child"
      style={{ backgroundImage: 'radial-gradient(ellipse 50% 50% at -5% 0%, var(--blob-coral), transparent), radial-gradient(ellipse 50% 50% at 105% 30%, var(--blob-seafoam), transparent), radial-gradient(ellipse 45% 45% at 30% 105%, var(--blob-sunshine), transparent)' }}
    >
      <form
        onSubmit={handleSubmit}
        className="relative bg-white dark:bg-surface-dark rounded-[28px] shadow-xl shadow-orange-900/8 dark:shadow-black/30 p-8 w-full max-w-md space-y-6 animate-bounce-in"
      >
        <div className="text-center">
          <h1 className="text-4xl font-display font-bold text-charcoal dark:text-warm-white mb-2 flex items-center justify-center gap-3">
            <span>Привет!</span>
            <WaveIcon className="w-10 h-10 text-coral dark:text-coral-light" />
          </h1>
          <p className="text-charcoal/50 dark:text-warm-white/50 text-lg">
            Давай начнём тестирование по математике
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-charcoal/60 dark:text-warm-white/60 mb-1.5">
              Имя
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              onInvalid={setValidity}
              onInput={clearValidity}
              className={INPUT_CLASS}
              placeholder="Как тебя зовут?"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-charcoal/60 dark:text-warm-white/60 mb-1.5">
              Фамилия
            </label>
            <input
              type="text"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              required
              onInvalid={setValidity}
              onInput={clearValidity}
              className={INPUT_CLASS}
              placeholder="Твоя фамилия"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-charcoal/60 dark:text-warm-white/60 mb-1.5">
              Школа
            </label>
            <input
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              required
              onInvalid={setValidity}
              onInput={clearValidity}
              className={INPUT_CLASS}
              placeholder="Номер или название школы"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-charcoal/60 dark:text-warm-white/60 mb-1.5">
              Класс
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              required
              onInvalid={(e) => (e.target as HTMLSelectElement).setCustomValidity('Пожалуйста, выбери класс')}
              onInput={(e) => (e.target as HTMLSelectElement).setCustomValidity('')}
              className={INPUT_CLASS}
            >
              <option value="" disabled>Выбери свой класс</option>
              {Array.from({ length: 11 }, (_, i) => (
                <option key={i + 1} value={String(i + 1)}>{i + 1} класс</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-coral hover:bg-coral-hover active:scale-[0.97] text-white text-xl font-display font-bold rounded-2xl transition-all cursor-pointer shadow-lg shadow-coral/25 hover:shadow-xl hover:shadow-coral/30 dark:shadow-black/30 dark:hover:shadow-black/40"
        >
          Начать!
        </button>
      </form>
    </div>
  );
}
