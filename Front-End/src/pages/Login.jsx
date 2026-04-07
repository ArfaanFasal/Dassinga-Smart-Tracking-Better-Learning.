import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { checkApiHealth } from '../services/mockApi';
import { ROUTES } from '../utils/constants';

const LOGO = '/branding/dassinga-logo.svg';

export function Login() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;
  const justRegistered = location.state?.registered;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('student');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverOnline, setServerOnline] = useState(true);

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email format';
    if (!password) e.password = 'Password is required';
    if (!role) e.role = 'Select a role';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    const online = await checkApiHealth();
    if (!online) {
      setErrors({ form: 'Backend is offline. Start backend server and try again.' });
      return;
    }
    setSubmitting(true);
    setErrors({});
    try {
      const user = await login(email, password);
      if (String(user.role || '').toLowerCase() !== role) {
        logout();
        setErrors({ form: `This account is registered as ${user.role}, not ${role}.` });
        setSubmitting(false);
        return;
      }
      if (from) navigate(from, { replace: true });
      else if (user.role === 'student') navigate(ROUTES.STUDENT_DASHBOARD, { replace: true });
      else if (user.role === 'teacher') navigate(ROUTES.TEACHER_DASHBOARD, { replace: true });
      else navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
    } catch (err) {
      setErrors({ form: err.message || 'Login failed' });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    checkApiHealth().then((ok) => setServerOnline(ok));
  }, []);

  const toggleAdminMode = () => {
    setIsAdminMode((v) => !v);
    setRole((prev) => (prev === 'admin' ? 'student' : 'admin'));
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-brand-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-500/20 via-transparent to-transparent" />
      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-16">
        <div className="mb-10 flex flex-col items-center text-center">
          <img src={LOGO} alt="" className="h-28 w-auto drop-shadow-sm md:h-32" width={120} height={140} />
          <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-[#1A365D] dark:text-blue-200">Dassinga</h1>
          <p className="mt-2 text-sm font-medium text-[#2F855A] dark:text-emerald-400">Smart Tracking. Better Learning.</p>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Sign in to continue</p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-8 shadow-soft-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
          {justRegistered && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
              Student account created. Please sign in.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate autoComplete="off">
            {!serverOnline && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
                Backend server is not reachable. Run backend first.
              </div>
            )}
            {errors.form && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                {errors.form}
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
              <input
                id="email"
                type="email"
                name="login_email_no_autofill"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none ring-brand-500/0 transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                placeholder="you@school.edu"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="login_password_no_autofill"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-20 text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  placeholder="********"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password}</p>}
            </div>

            <div>
              <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Role</span>
              {!isAdminMode ? (
                <div className="grid grid-cols-2 gap-3">
                  {['student', 'teacher'].map((r) => (
                    <label
                      key={r}
                      className={`flex cursor-pointer items-center justify-center rounded-xl border-2 px-4 py-3 text-sm font-medium transition hover:border-brand-400 ${
                        role === r
                          ? 'border-brand-500 bg-brand-50 text-brand-800 dark:bg-brand-500/20 dark:text-brand-200'
                          : 'border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={r}
                        checked={role === r}
                        onChange={() => setRole(r)}
                        className="sr-only"
                      />
                      {r[0].toUpperCase() + r.slice(1)}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                  Admin login mode enabled
                </div>
              )}
              <button
                type="button"
                onClick={toggleAdminMode}
                className="mt-2 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                {isAdminMode ? 'Use Student / Teacher mode' : 'Admin login'}
              </button>
              {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting || !serverOnline}
              className="w-full rounded-xl bg-[#1A365D] py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#2c5282] disabled:opacity-60 dark:bg-[#2B6CB0] dark:hover:bg-[#3182ce]"
            >
              {submitting ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            No account?{' '}
            <Link to={ROUTES.SIGNUP} className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
              Sign up (Student only)
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
