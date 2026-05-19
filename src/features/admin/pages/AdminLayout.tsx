import { NavLink, Outlet } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import ThemeToggle from '../../../components/ThemeToggle';

const NAV_ITEMS = [
  { to: '/admin/topics', label: 'Темы' },
  { to: '/admin/items', label: 'Задания' },
  { to: '/admin/motivation', label: 'Психология' },
  { to: '/admin/linear-test', label: 'Линейный тест' },
  { to: '/admin/algorithm', label: 'Алгоритм' },
  { to: '/admin/sessions', label: 'Результаты' },
];

export default function AdminLayout() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-admin">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold text-charcoal dark:text-warm-white tracking-tight">Админка</span>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-coral-bg text-coral dark:bg-coral/10 dark:text-coral-light'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer font-medium"
            >
              Выйти
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
