import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../utils/constants';

export function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  const actualRole = String(user.role || '').toLowerCase();
  const allowed = role
    ? (Array.isArray(role) ? role : [role]).map((r) => String(r).toLowerCase())
    : null;

  if (allowed && !allowed.includes(actualRole)) {
    const fallback =
      actualRole === 'student'
        ? ROUTES.STUDENT_DASHBOARD
        : actualRole === 'teacher'
          ? ROUTES.TEACHER_DASHBOARD
          : ROUTES.ADMIN_DASHBOARD;
    return <Navigate to={fallback} replace />;
  }

  return children;
}
