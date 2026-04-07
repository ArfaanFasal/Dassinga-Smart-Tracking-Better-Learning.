import { useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Link } from 'react-router-dom';
import { sortAssignments } from '../utils/sortAssignments';
import { getDeadlineReminder } from '../utils/reminders';
import { ROUTES } from '../utils/constants';

function localDateKey(d) {
  const x = d instanceof Date ? d : new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function MiniCalendarPreview({ assignments }) {
  const [value, setValue] = useState(new Date());

  const byDate = useMemo(() => {
    const map = new Map();
    assignments.forEach((a) => {
      const k = localDateKey(a.deadline);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(a);
    });
    return map;
  }, [assignments]);

  const selectedKey = localDateKey(value);
  const dayAssignments = sortAssignments(byDate.get(selectedKey) || []);

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return null;
    const k = localDateKey(date);
    const list = byDate.get(k);
    if (!list || !list.length) return null;
    const urgent = list.some((a) => getDeadlineReminder(a.deadline).highlightRed);
    return urgent ? 'salms-cal-urgent' : 'salms-cal-deadline';
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-soft dark:border-slate-700 dark:bg-slate-900/80">
      <h3 className="mb-2 px-1 font-display text-sm font-semibold text-slate-900 dark:text-white">
        Mini calendar
      </h3>
      <Calendar
        onChange={setValue}
        value={value}
        tileClassName={tileClassName}
        className="w-full !max-w-full border-0 !bg-transparent text-sm"
      />
      <div className="mt-2 border-t border-slate-100 pt-2 dark:border-slate-800">
        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
          {value.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </p>
        {dayAssignments.length === 0 ? (
          <p className="mt-1 text-xs text-slate-500">No deadlines</p>
        ) : (
          <ul className="mt-1 space-y-1">
            {dayAssignments.slice(0, 3).map((a) => (
              <li key={a.id} className="truncate text-xs text-slate-700 dark:text-slate-300">
                · {a.title}
              </li>
            ))}
            {dayAssignments.length > 3 && (
              <li className="text-xs text-slate-500">+{dayAssignments.length - 3} more</li>
            )}
          </ul>
        )}
        <Link
          to={ROUTES.STUDENT_CALENDAR}
          className="mt-2 inline-block text-xs font-semibold text-dassinga-blue hover:underline"
        >
          Open full calendar →
        </Link>
      </div>
    </div>
  );
}
