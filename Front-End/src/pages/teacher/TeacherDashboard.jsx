import { useMemo } from 'react';
import { useLMS } from '../../context/LMSContext';
import { StatCard } from '../../components/StatCard';
import { NoticeBoard } from '../../components/NoticeBoard';
import { ROUTES } from '../../utils/constants';

export function TeacherDashboard() {
  const { teacherData } = useLMS();

  const totalAssignments = teacherData.assignments.length;
  const totalStudents = teacherData.students.length;
  const totalSubmissions = teacherData.submissions.length;
  const pendingSlots = useMemo(() => {
    const now = Date.now();
    const submittedIds = new Set(teacherData.submissions.map((s) => s.assignmentId));
    return teacherData.assignments.filter((a) => {
      const assignmentId = String(a.id);
      if (submittedIds.has(assignmentId) || submittedIds.has(Number(assignmentId))) return false;
      const deadlineMs = new Date(a.deadline).getTime();
      if (!Number.isFinite(deadlineMs)) return true;
      return deadlineMs >= now;
    }).length;
  }, [teacherData.submissions, teacherData.assignments]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Teacher dashboard</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Overview of assignments and class activity</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Assignments" value={totalAssignments} to={ROUTES.TEACHER_ASSIGNMENTS} />
        <StatCard title="Students" value={totalStudents} to={ROUTES.TEACHER_STUDENTS} accent="from-sky-500 to-blue-600" />
        <StatCard title="Submissions" value={totalSubmissions} to={ROUTES.TEACHER_SUBMISSIONS} accent="from-emerald-500 to-teal-600" />
        <StatCard title="Pending" value={pendingSlots} to={ROUTES.TEACHER_SUBMISSIONS} accent="from-amber-500 to-orange-600" />
      </div>

      <NoticeBoard assignments={teacherData.noticeBoard || teacherData.assignments} />
    </div>
  );
}

