import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLMS } from '../context/LMSContext';
import { BrandLogo } from '../components/BrandLogo';
import { DarkModeToggle } from '../components/DarkModeToggle';
import { ROUTES } from '../utils/constants';

const nav = [
  { to: ROUTES.TEACHER_DASHBOARD, label: 'Dashboard', icon: 'DB' },
  { to: ROUTES.TEACHER_STUDENTS, label: 'Students', icon: 'ST' },
  { to: ROUTES.TEACHER_ASSIGNMENTS, label: 'Assignments', icon: 'AS' },
  { to: ROUTES.TEACHER_CREATE, label: 'Create Assignment', icon: 'CR' },
  { to: ROUTES.TEACHER_SUBMISSIONS, label: 'Submissions', icon: 'SB' },
  { to: ROUTES.TEACHER_ANALYTICS, label: 'Analytics', icon: 'AN' },
];

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition hover:bg-white/80 dark:hover:bg-slate-800 ${
    isActive
      ? 'bg-white text-brand-700 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-brand-300 dark:ring-slate-700'
      : 'text-slate-600 dark:text-slate-400'
  }`;

export function TeacherLayout() {
  const { user, logout } = useAuth();
  const { error } = useLMS();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-slate-200/80 bg-white/90 px-4 py-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 lg:flex">
        <div className="mb-8 px-1">
          <BrandLogo layout="stacked" className="items-start" to={ROUTES.TEACHER_DASHBOARD} />
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Teacher console</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass} end={item.to === ROUTES.TEACHER_DASHBOARD}>
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-slate-200 px-1 text-[10px] font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-3 lg:hidden">
              <BrandLogo layout="horizontal" to={ROUTES.TEACHER_DASHBOARD} />
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
              </div>
              <DarkModeToggle />
              <button
                type="button"
                onClick={logout}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-red-500/50 dark:hover:bg-red-950/40 dark:hover:text-red-300"
              >
                Logout
              </button>
            </div>
          </div>
          <nav className="mx-auto mt-3 flex max-w-6xl gap-2 overflow-x-auto pb-1 lg:hidden">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="whitespace-nowrap rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8">
          {error && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
              {error}
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
