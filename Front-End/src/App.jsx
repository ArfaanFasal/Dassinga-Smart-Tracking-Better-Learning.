import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProfileProvider } from './context/ProfileContext';
import { LMSProvider } from './context/LMSContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { StudentLayout } from './layouts/StudentLayout';
import { TeacherLayout } from './layouts/TeacherLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentAssignments } from './pages/student/StudentAssignments';
import { AssignmentDetail } from './pages/student/AssignmentDetail';
import { StudentCalendar } from './pages/student/StudentCalendar';
import { StudentAnalytics } from './pages/student/StudentAnalytics';
import { StudentProfile } from './pages/student/StudentProfile';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { TeacherAssignments } from './pages/teacher/TeacherAssignments';
import { CreateAssignment } from './pages/teacher/CreateAssignment';
import { Submissions } from './pages/teacher/Submissions';
import { TeacherAnalytics } from './pages/teacher/TeacherAnalytics';
import { StudentManagement } from './pages/teacher/StudentManagement';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminTeachers } from './pages/admin/AdminTeachers';
import { ROUTES } from './utils/constants';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }
  if (!user) return <Navigate to={ROUTES.LOGIN} replace />;
  if (user.role === 'student') return <Navigate to={ROUTES.STUDENT_DASHBOARD} replace />;
  if (user.role === 'teacher') return <Navigate to={ROUTES.TEACHER_DASHBOARD} replace />;
  return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
}

function AuthGate({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }
  if (user) {
    const to =
      user.role === 'student'
        ? ROUTES.STUDENT_DASHBOARD
        : user.role === 'teacher'
          ? ROUTES.TEACHER_DASHBOARD
          : ROUTES.ADMIN_DASHBOARD;
    return <Navigate to={to} replace />;
  }
  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProfileProvider>
        <LMSProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomeRedirect />} />
              <Route
                path={ROUTES.LOGIN}
                element={
                  <AuthGate>
                    <Login />
                  </AuthGate>
                }
              />
              <Route
                path={ROUTES.SIGNUP}
                element={
                  <AuthGate>
                    <SignUp />
                  </AuthGate>
                }
              />

              <Route
                path="/student"
                element={
                  <ProtectedRoute role="student">
                    <StudentLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="dashboard" element={<StudentDashboard />} />
                <Route path="assignments" element={<StudentAssignments />} />
                <Route path="assignments/:id" element={<AssignmentDetail />} />
                <Route path="calendar" element={<StudentCalendar />} />
                <Route path="analytics" element={<StudentAnalytics />} />
                <Route path="profile" element={<StudentProfile />} />
              </Route>

              <Route
                path="/teacher"
                element={
                  <ProtectedRoute role="teacher">
                    <TeacherLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="dashboard" element={<TeacherDashboard />} />
                <Route path="assignments" element={<TeacherAssignments />} />
                <Route path="students" element={<StudentManagement />} />
                <Route path="create-assignment" element={<CreateAssignment />} />
                <Route path="submissions" element={<Submissions />} />
                <Route path="analytics" element={<TeacherAnalytics />} />
              </Route>

              <Route
                path="/admin"
                element={
                  <ProtectedRoute role="admin">
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="teachers" element={<AdminTeachers />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </LMSProvider>
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
