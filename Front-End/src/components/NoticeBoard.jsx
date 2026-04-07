import { Link } from 'react-router-dom';
import { PriorityBadge } from './PriorityBadge';

export function NoticeBoard({ assignments = [] }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-900/80">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Notice board</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Priority first, then nearest deadlines.</p>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-700">
          <thead className="bg-slate-50/80 dark:bg-slate-800/80">
            <tr>
              <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-300">Subject</th>
              <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-300">Title</th>
              <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-300">Deadline</th>
              <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-300">Priority</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {assignments.map((a) => (
              <tr key={a.id}>
                <td className="px-3 py-2.5 text-slate-800 dark:text-slate-200">{a.subject}</td>
                <td className="px-3 py-2.5">
                  <Link to={`/student/assignments/${a.id}`} className="font-medium text-dassinga-navy hover:underline dark:text-blue-300">
                    {a.title}
                  </Link>
                </td>
                <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">
                  {new Date(a.deadline).toLocaleString()}
                </td>
                <td className="px-3 py-2.5">
                  <PriorityBadge priority={a.priority} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {assignments.length === 0 && <p className="mt-4 text-sm text-slate-500">No notice items.</p>}
    </section>
  );
}

