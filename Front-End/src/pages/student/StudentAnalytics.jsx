import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import { useLMS } from '../../context/LMSContext';
import { fetchSubmissions } from '../../services/mockApi';

export function StudentAnalytics() {
  const { studentAssignments } = useLMS();
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetchSubmissions()
        .then((subs) => {
          if (!alive) return;
          setSubmissions(Array.isArray(subs) ? subs : []);
        })
        .catch(() => {
          if (!alive) return;
        });

    load();
    const intervalId = setInterval(load, 10000);
    const onFocus = () => load();
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onFocus);
      document.addEventListener('visibilitychange', onFocus);
    }

    return () => {
      alive = false;
      clearInterval(intervalId);
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', onFocus);
        document.removeEventListener('visibilitychange', onFocus);
      }
    };
  }, []);

  const completedAssignmentIds = useMemo(() => {
    const ids = new Set();
    submissions.forEach((s) => {
      const validation = String(s?.validationStatus || '').toUpperCase();
      const status = String(s?.status || '').toLowerCase();
      // Count as completed only when not invalid/rejected.
      if (validation === 'INVALID' || status === 'rejected') return;
      if (s?.assignmentId != null) ids.add(String(s.assignmentId));
    });
    return ids;
  }, [submissions]);

  const completionRate = useMemo(() => {
    const t = studentAssignments.length;
    if (!t) return 0;
    const c = studentAssignments.filter((a) => completedAssignmentIds.has(String(a?.id ?? ''))).length;
    return Math.round((c / t) * 100);
  }, [studentAssignments, completedAssignmentIds]);

  const weekly = useMemo(() => {
    const total = studentAssignments.length;
    const completed = studentAssignments.filter((a) => completedAssignmentIds.has(String(a?.id ?? ''))).length;
    const pending = Math.max(0, total - completed);
    return [{ week: 'Current', completed, pending }];
  }, [studentAssignments, completedAssignmentIds]);

  const subjects = useMemo(() => {
    const bySubject = new Map();
    studentAssignments.forEach((a) => {
      const subject = String(a?.subject || 'Other');
      if (!bySubject.has(subject)) bySubject.set(subject, { total: 0, completed: 0 });
      const row = bySubject.get(subject);
      row.total += 1;
      if (completedAssignmentIds.has(String(a?.id ?? ''))) row.completed += 1;
    });

    return Array.from(bySubject.entries()).map(([subject, row]) => ({
      subject,
      score: row.total ? Math.round((row.completed / row.total) * 100) : 0,
    }));
  }, [studentAssignments, completedAssignmentIds]);

  const submissionTrends = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const buckets = [
      { period: 'P1', minDays: 21, maxDays: 28, submissions: 0 },
      { period: 'P2', minDays: 14, maxDays: 21, submissions: 0 },
      { period: 'P3', minDays: 7, maxDays: 14, submissions: 0 },
      { period: 'P4', minDays: 0, maxDays: 7, submissions: 0 },
    ];

    submissions.forEach((s) => {
      const ts = new Date(s?.submittedAt || '').getTime();
      if (!Number.isFinite(ts)) return;
      const ageDays = (now - ts) / dayMs;
      const bucket = buckets.find((b) => ageDays >= b.minDays && ageDays < b.maxDays);
      if (bucket) bucket.submissions += 1;
    });

    return buckets.map(({ period, submissions: count }) => ({ period, submissions: count }));
  }, [submissions]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Completion rate, subject progress, and submission trends
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-900/80">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Completion rate</h2>
          <p className="mt-2 font-display text-4xl font-bold text-dassinga-navy dark:text-blue-200">
            {completionRate}%
          </p>
          <p className="mt-1 text-xs text-slate-500">Based on your current assignment list</p>
        </div>
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 p-5 dark:border-amber-900/50 dark:bg-amber-950/30">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            Procrastination score
          </p>
          <p className="mt-2 text-sm leading-relaxed text-amber-950/90 dark:text-amber-100/90">
            You tend to complete tasks at the last minute. Try scheduling focused blocks earlier in the week
            to reduce stress and improve quality.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-900/80">
        <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
          Weekly performance
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Completed vs pending by week</p>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis dataKey="week" tick={{ fill: 'currentColor', fontSize: 12 }} className="text-slate-500" />
              <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} className="text-slate-500" />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid rgb(226 232 240)',
                  background: 'white',
                }}
              />
              <Legend />
              <Bar dataKey="completed" name="Completed" fill="#2F855A" radius={[6, 6, 0, 0]} />
              <Bar dataKey="pending" name="Pending" fill="#f97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-900/80">
        <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
          Subject-wise progress
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Relative performance index by subject</p>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={subjects}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis dataKey="subject" tick={{ fill: 'currentColor', fontSize: 11 }} className="text-slate-500" />
              <YAxis domain={[0, 100]} tick={{ fill: 'currentColor', fontSize: 12 }} className="text-slate-500" />
              <Tooltip />
              <Line type="monotone" dataKey="score" name="Score" stroke="#2B6CB0" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-900/80">
        <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
          Submission trends
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Count of submissions over recent periods</p>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={submissionTrends}>
              <defs>
                <linearGradient id="subGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2B6CB0" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2B6CB0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} className="text-slate-500" />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} className="text-slate-500" />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="submissions"
                name="Submissions"
                stroke="#1A365D"
                fillOpacity={1}
                fill="url(#subGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
