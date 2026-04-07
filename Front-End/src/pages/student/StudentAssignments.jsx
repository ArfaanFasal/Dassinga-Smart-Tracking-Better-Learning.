import { useEffect, useMemo, useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import { AssignmentCard } from '../../components/AssignmentCard';
import { sortAssignments } from '../../utils/sortAssignments';
import { isOverdue } from '../../utils/deadlineUtils';

export function StudentAssignments() {
  const { studentAssignments } = useLMS();
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('all');
  const [submitNotice, setSubmitNotice] = useState('');

  useEffect(() => {
    if (!submitNotice) return;
    const t = setTimeout(() => setSubmitNotice(''), 3000);
    return () => clearTimeout(t);
  }, [submitNotice]);

  const subjects = useMemo(() => {
    const s = new Set(studentAssignments.map((a) => a.subject));
    return ['all', ...Array.from(s).sort()];
  }, [studentAssignments]);

  const filtered = useMemo(() => {
    let list = [...studentAssignments];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) || a.subject.toLowerCase().includes(q)
      );
    }
    if (subject !== 'all') {
      list = list.filter((a) => a.subject === subject);
    }

    const sorted = sortAssignments(list);
    const notSubmitted = [];
    const overdue = [];
    const submitted = [];

    sorted.forEach((a) => {
      const isSubmitted = a.status === 'Completed' || Boolean(a.lastSubmission);
      if (isSubmitted) {
        submitted.push(a);
        return;
      }
      if (isOverdue(a.deadline)) {
        overdue.push(a);
      } else {
        notSubmitted.push(a);
      }
    });

    return [...notSubmitted, ...overdue, ...submitted];
  }, [studentAssignments, search, subject]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
          Assignment
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Search, filter, and submit work per assignment (not submitted, then overdue, then submitted).
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Search title or subject…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-dassinga-blue focus:ring-2 focus:ring-dassinga-blue/25 dark:border-slate-600 dark:bg-slate-800 dark:text-white sm:max-w-md"
        />
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
        >
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All subjects' : s}
            </option>
          ))}
        </select>
      </div>

      {submitNotice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          {submitNotice}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((a) => (
          <AssignmentCard key={a.id} assignment={a} onSubmitted={setSubmitNotice} />
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="py-12 text-center text-sm text-slate-500">No assignments match your filters.</p>
      )}
    </div>
  );
}
