import { Link } from 'react-router-dom';

export function StatCard({ title, value, subtitle, icon, accent = 'from-brand-500 to-indigo-600', to = '' }) {
  const cardClass =
    'group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-soft-lg dark:border-slate-700 dark:bg-slate-900/80';

  const content = (
    <>
      <div
        className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${accent} opacity-20 blur-2xl transition group-hover:opacity-30`}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl dark:bg-slate-800">
            {icon}
          </div>
        )}
      </div>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={cardClass}>
        {content}
      </Link>
    );
  }

  return <div className={cardClass}>{content}</div>;
}
