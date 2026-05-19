import { useState, type FormEvent } from 'react';
import { supabase } from '../../../lib/supabase';
import { logger } from '../../../lib/logger';
import ThemeToggle from '../../../components/ThemeToggle';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (err) {
      logger.warn('Admin login failed', { email: email.trim() });
      setError('Неверный email или пароль');
      return;
    }

    logger.info('Admin logged in', { email: email.trim() });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 font-admin">
      <ThemeToggle className="fixed top-4 right-4 z-50" />
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-8 w-full max-w-sm space-y-5"
      >
        <h1 className="text-2xl font-bold text-charcoal dark:text-warm-white text-center tracking-tight">
          Админ-панель
        </h1>

        {error && (
          <div className="bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-sm p-3 rounded-xl">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:border-coral dark:focus:border-coral-light focus:outline-none dark:bg-gray-700 dark:text-gray-100 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Пароль
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:border-coral dark:focus:border-coral-light focus:outline-none dark:bg-gray-700 dark:text-gray-100 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-coral hover:bg-coral-hover disabled:opacity-50 text-white font-semibold rounded-xl transition-colors cursor-pointer"
        >
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>
    </div>
  );
}
