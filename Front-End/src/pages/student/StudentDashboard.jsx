import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useLMS } from '../../context/LMSContext';
import { useProfile } from '../../context/ProfileContext';
import { StatCard } from '../../components/StatCard';
import { MiniCalendarPreview } from '../../components/MiniCalendarPreview';
import { NoticeBoard } from '../../components/NoticeBoard';
import { sortAssignments } from '../../utils/sortAssignments';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../utils/constants';

const COLORS = ['#22c55e', '#f59e0b'];

export function StudentDashboard() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { studentAssignments } = useLMS();

  const displayName = profile?.name || user?.name || 'Student';
  const isSubmitted = (assignment) => assignment.status === 'Completed' || Boolean(assignment.lastSubmission);

  const stats = useMemo(() => {
    const now = Date.now();
    const totalCount = studentAssignments.length;
    const completedCount = studentAssignments.filter((a) => isSubmitted(a)).length;
    const overdueCount = studentAssignments.filter((a) => {
      if (isSubmitted(a)) return false;
      const deadlineMs = new Date(a.deadline).getTime();
      return Number.isFinite(deadlineMs) && deadlineMs < now;
    }).length;
    const pendingCount = studentAssignments.filter((a) => {
      if (isSubmitted(a)) return false;
      const deadlineMs = new Date(a.deadline).getTime();
      if (!Number.isFinite(deadlineMs)) return true;
      return deadlineMs >= now;
    }).length;
    return {
      total: totalCount,
      completed: completedCount,
      pending: pendingCount,
      overdue: overdueCount,
      chartData: [
        { name: 'Completed', value: completedCount },
        { name: 'Pending', value: pendingCount },
      ],
    };
  }, [studentAssignments]);

  const noticeRows = useMemo(() => sortAssignments([...studentAssignments]), [studentAssignments]);

  const recentAssignments = useMemo(
    () => [...studentAssignments].sort((a, b) => new Date(b.deadline) - new Date(a.deadline)).slice(0, 6),
    [studentAssignments]
  );

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-slate-600 dark:text-slate-400">Hi, {displayName}</p>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Overview</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Smart Tracking. Better Learning.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total assignments" value={stats.total} to={ROUTES.STUDENT_ASSIGNMENTS} />
        <StatCard
          title="Completed"
          value={stats.completed}
          to={ROUTES.STUDENT_ASSIGNMENTS}
          accent="from-emerald-500 to-teal-600"
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          to={ROUTES.STUDENT_ASSIGNMENTS}
          accent="from-amber-500 to-orange-600"
        />
        <StatCard
          title="Overdue"
          value={stats.overdue}
          to={ROUTES.STUDENT_CALENDAR}
          accent="from-red-500 to-rose-600"
        />
      </div>

      <NoticeBoard assignments={noticeRows} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-900/80 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Completed vs Pending</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}>
                  {stats.chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <MiniCalendarPreview assignments={studentAssignments} />
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-900/80">
        <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Recent assignments</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
          {recentAssignments.map((a) => (
            <li key={a.id} className="rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800">
              <span className="font-medium text-slate-900 dark:text-white">{a.title}</span>
              <span className="text-xs text-slate-500"> · {new Date(a.deadline).toLocaleString()}</span>
            </li>
          ))}
        </ul>
        <Link to={ROUTES.STUDENT_ASSIGNMENTS} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-dassinga-blue hover:underline">
          Go to assignments {'->'}
        </Link>
      </section>
    </div>
  );
}


