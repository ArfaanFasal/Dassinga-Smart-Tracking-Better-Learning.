import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useLMS } from '../../context/LMSContext';
import { StatCard } from '../../components/StatCard';
import { ROUTES } from '../../utils/constants';

export function AdminDashboard() {
  const { adminData } = useLMS();

  const users = adminData?.users || [];
  const stats = adminData?.stats || {};

  const grouped = useMemo(
    () => ({
      students: users.filter((u) => u.role === 'student').length,
      teachers: users.filter((u) => u.role === 'teacher').length,
      admins: users.filter((u) => u.role === 'admin').length,
    }),
    [users]
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Admin dashboard</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Monitor platform activity and jump into user or teacher management.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Assignments" value={stats.totalAssignments || 0} to={ROUTES.ADMIN_DASHBOARD} />
        <StatCard
          title="Submissions"
          value={stats.totalSubmissions || 0}
          to={ROUTES.ADMIN_DASHBOARD}
          accent="from-emerald-500 to-teal-600"
        />
        <StatCard
          title="Flagged"
          value={stats.flaggedSubmissions || 0}
          to={ROUTES.ADMIN_DASHBOARD}
          accent="from-red-500 to-rose-600"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to={ROUTES.ADMIN_USERS}
          className="rounded-2xl border border-slate-200/80 bg-white p-6 transition hover:border-brand-300 dark:border-slate-700 dark:bg-slate-900/80"
        >
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Users</h2>
          <p className="mt-1 text-sm text-slate-500">Students: {grouped.students}</p>
          <p className="mt-3 text-sm font-medium text-brand-600">Manage student accounts</p>
        </Link>

        <Link
          to={ROUTES.ADMIN_TEACHERS}
          className="rounded-2xl border border-slate-200/80 bg-white p-6 transition hover:border-brand-300 dark:border-slate-700 dark:bg-slate-900/80"
        >
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Teachers</h2>
          <p className="mt-1 text-sm text-slate-500">Teachers: {grouped.teachers}</p>
          <p className="mt-3 text-sm font-medium text-brand-600">Manage teacher accounts</p>
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-700 dark:bg-slate-900/80">
        <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">System roles</h2>
        <p className="mt-2 text-sm text-slate-500">
          Students: {grouped.students} | Teachers: {grouped.teachers} | Admins: {grouped.admins}
        </p>
      </div>
    </div>
  );
}
