const styles = {
  High: 'bg-red-500/15 text-red-600 dark:text-red-400 ring-1 ring-red-500/40',
  Medium:
    'bg-orange-500/15 text-orange-700 dark:text-orange-400 ring-1 ring-orange-500/40',
  Low: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/40',
};

export function PriorityBadge({ priority }) {
  const c = styles[priority] || styles.Medium;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${c}`}
    >
      {priority}
    </span>
  );
}
