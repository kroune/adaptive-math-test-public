import { useTheme } from '../hooks/useTheme';
import { SunIcon, MoonIcon, MonitorIcon } from './Icons';

const LABELS = {
  light: 'Тёмная тема',
  dark: 'Системная тема',
  system: 'Светлая тема',
} as const;

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { preference, toggleTheme } = useTheme();

  const icon =
    preference === 'dark' ? <MoonIcon /> :
    preference === 'light' ? <SunIcon /> :
    <MonitorIcon />;

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg transition-colors cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${className}`}
      title={LABELS[preference]}
    >
      {icon}
    </button>
  );
}
