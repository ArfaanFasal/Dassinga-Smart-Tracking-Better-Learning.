import { useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useLMS } from '../../context/LMSContext';
import { sortAssignments } from '../../utils/sortAssignments';
import { getDeadlineReminder } from '../../utils/reminders';
import { Link } from 'react-router-dom';

function localDateKey(d) {
  const x = d instanceof Date ? d : new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isSubmitted(assignment) {
  return assignment.status === 'Completed' || Boolean(assignment.lastSubmission);
}

export function StudentCalendar() {
  const { studentAssignments } = useLMS();
  const [value, setValue] = useState(new Date());

  const byDate = useMemo(() => {
    const map = new Map();
    studentAssignments.forEach((a) => {
      const k = localDateKey(a.deadline);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(a);
    });
    return map;
  }, [studentAssignments]);

  const selectedKey = localDateKey(value);
  const dayAssignments = sortAssignments(byDate.get(selectedKey) || []);

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return null;
    const k = localDateKey(date);
    const list = byDate.get(k);
    if (!list || !list.length) return null;
    const urgent = list.some((a) => !isSubmitted(a) && getDeadlineReminder(a.deadline).highlightRed);
    return urgent ? 'salms-cal-urgent' : 'salms-cal-deadline';
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Calendar</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Deadlines are highlighted; urgent dates appear in red. Tap a day for details.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft dark:border-slate-700 dark:bg-slate-900/80">
          <Calendar
            onChange={setValue}
            value={value}
            tileClassName={tileClassName}
            className="w-full max-w-md border-0 !bg-transparent"
          />
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-amber-200 dark:bg-amber-900" /> Has deadline
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-red-400 dark:bg-red-700" /> Urgent
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-900/80">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            {value.toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </h2>
          {dayAssignments.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No assignment deadlines on this date.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {dayAssignments.map((a) => {
                const submitted = isSubmitted(a);
                const r = submitted ? { message: '', highlightRed: false } : getDeadlineReminder(a.deadline);
                return (
                  <li
                    key={a.id}
                    className={`rounded-xl border px-4 py-3 ${
                      r.highlightRed
                        ? 'border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
                        : 'border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50'
                    }`}
                  >
                    <p className="font-medium text-slate-900 dark:text-white">{a.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {a.subject} · {a.priority}
                      {submitted && <span className=" ml-2 font-semibold text-emerald-600">· Submitted</span>}
                      {r.message && (
                        <span className={r.highlightRed ? ' ml-2 font-semibold text-red-600' : ''}>· {r.message}</span>
                      )}
                    </p>
                    <Link
                      to={`/student/assignments/${a.id}`}
                      className="mt-2 inline-block text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
                    >
                      Open details →
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

