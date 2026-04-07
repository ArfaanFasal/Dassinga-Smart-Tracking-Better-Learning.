import { useTheme } from '../context/ThemeContext';

export function DarkModeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      className="group relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 shadow-sm transition hover:border-brand-500/40 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-brand-500/50 dark:hover:text-brand-400"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
    >
      <span className="text-lg transition group-hover:scale-110">
        {dark ? '☀️' : '🌙'}
      </span>
    </button>
  );
}
