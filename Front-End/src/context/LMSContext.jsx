import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import {
  fetchAssignments,
  createAssignmentApi,
  updateAssignmentApi,
  deleteAssignmentApi,
  fetchSubmissions,
  submitAssignmentApi,
  reviewSubmissionValidationApi,
  fetchSubmissionStats,
  fetchStudents,
  adminFetchUsers,
  adminCreateTeacher,
  adminCreateUser,
  adminUpdateUser,
  adminDeleteUser,
  adminToggleUserStatus,
  sortNoticeBoard,
  summarizeTeacherAnalytics,
} from '../services/mockApi';
import { getDraft, setDraft } from '../services/assignmentDrafts';

const LMSContext = createContext(null);

export function LMSProvider({ children }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({
    totalAssignments: 0,
    totalSubmissions: 0,
    pendingAssignments: 0,
    flaggedSubmissions: 0,
  });
  const [users, setUsers] = useState([]);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setAssignments([]);
      setSubmissions([]);
      setStudents([]);
      setUsers([]);
      setStats({ totalAssignments: 0, totalSubmissions: 0, pendingAssignments: 0, flaggedSubmissions: 0 });
      return;
    }

    setLoading(true);
    setError('');
    const role = String(user.role || '').toLowerCase();
    const errors = [];
    try {
      const baseResults = await Promise.allSettled([fetchAssignments(), fetchSubmissions()]);
      if (baseResults[0].status === 'fulfilled') setAssignments(baseResults[0].value || []);
      else {
        setAssignments([]);
        errors.push(baseResults[0].reason);
      }

      if (baseResults[1].status === 'fulfilled') setSubmissions(baseResults[1].value || []);
      else {
        setSubmissions([]);
        errors.push(baseResults[1].reason);
      }

      if (role === 'teacher' || role === 'admin') {
        const teacherResults = await Promise.allSettled([fetchSubmissionStats(), fetchStudents()]);
        if (teacherResults[0].status === 'fulfilled') setStats(teacherResults[0].value || {});
        else {
          setStats({ totalAssignments: 0, totalSubmissions: 0, pendingAssignments: 0, flaggedSubmissions: 0 });
          errors.push(teacherResults[0].reason);
        }
        if (teacherResults[1].status === 'fulfilled') setStudents(teacherResults[1].value || []);
        else {
          setStudents([]);
          errors.push(teacherResults[1].reason);
        }
      } else {
        setStudents([]);
      }

      if (role === 'admin') {
        const adminResult = await Promise.allSettled([adminFetchUsers()]);
        if (adminResult[0].status === 'fulfilled') setUsers(adminResult[0].value || []);
        else {
          setUsers([]);
          errors.push(adminResult[0].reason);
        }
      } else {
        setUsers([]);
      }
    } finally {
      if (errors.length > 0) {
        const first = errors[0];
        if (first?.response?.status === 401) {
          setError('Session expired. Please log in again.');
        } else {
          setError(first?.response?.data?.message || first?.message || 'Some data failed to load. Please refresh.');
        }
      }
      setLoading(false);
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const studentAssignments = useMemo(() => {
    const role = String(user?.role || '').toLowerCase();
    if (role !== 'student') return [];
    return assignments;
  }, [assignments, user?.role]);

  const getStudentAssignmentMerged = useCallback(
    (assignmentId) => {
      const targetId = String(assignmentId);
      const a = assignments.find((x) => String(x.id) === targetId);
      if (!a) return null;
      const sub = submissions.find((s) => String(s.assignmentId) === targetId);
      return {
        ...a,
        status: sub ? 'Completed' : a.status || 'Pending',
      };
    },
    [assignments, submissions]
  );

  const submitAssignment = useCallback(
    async ({ assignmentId, content, includeFile, mainFile, imageFile }) => {
      const result = await submitAssignmentApi({
        assignmentId,
        textAnswer: content || '',
        includeFile,
        mainFile,
        imageFile,
      });

      // Optimistic update so UI reflects "Submitted" immediately.
      const created = result?.submission;
      if (created?.id && created?.assignmentId) {
        setSubmissions((prev) => {
          const next = prev.filter((s) => String(s.id) !== String(created.id));
          return [created, ...next];
        });
        setAssignments((prev) =>
          prev.map((a) => {
            if (String(a.id) !== String(created.assignmentId)) return a;
            return {
              ...a,
              status: 'Completed',
              lastSubmission: {
                fileUrl: created.fileUrl || '',
                imageUrl: created.imageUrl || '',
                submittedAt: created.submittedAt || new Date().toISOString(),
                validationStatus: created.validationStatus || 'VALID',
                validationFlags: created.validationFlags || [],
              },
            };
          })
        );
      }

      // Keep server data as source of truth; don't block UX on this.
      refresh().catch(() => {});
      return result;
    },
    [refresh]
  );

  const createAssignment = useCallback(
    async (payload) => {
      await createAssignmentApi(payload);
      await refresh();
    },
    [refresh]
  );

  const updateAssignment = useCallback(
    async (assignmentId, payload) => {
      await updateAssignmentApi(assignmentId, payload);
      await refresh();
    },
    [refresh]
  );

  const deleteAssignment = useCallback(
    async (assignmentId) => {
      await deleteAssignmentApi(assignmentId);
      await refresh();
    },
    [refresh]
  );

  const createTeacherByAdmin = useCallback(async (payload) => {
    await adminCreateTeacher(payload);
    await refresh();
  }, [refresh]);

  const createUserByAdmin = useCallback(async (payload) => {
    await adminCreateUser(payload);
    await refresh();
  }, [refresh]);

  const updateUserByAdmin = useCallback(async (userId, payload) => {
    await adminUpdateUser(userId, payload);
    await refresh();
  }, [refresh]);

  const deleteUserByAdmin = useCallback(async (userId) => {
    await adminDeleteUser(userId);
    await refresh();
  }, [refresh]);

  const toggleUserStatusByAdmin = useCallback(async (userId, enabled) => {
    await adminToggleUserStatus(userId, enabled);
    await refresh();
  }, [refresh]);

  const teacherData = useMemo(() => {
    const noticeBoard = sortNoticeBoard(assignments);
    const analytics = summarizeTeacherAnalytics(submissions);
    return {
      assignments,
      submissions,
      students,
      noticeBoard,
      analytics,
      stats,
    };
  }, [assignments, submissions, students, stats]);

  const adminData = useMemo(() => ({ users, stats, assignments, submissions }), [users, stats, assignments, submissions]);

  const reviewSubmissionValidation = useCallback(
    async (submissionId, validationStatus) => {
      await reviewSubmissionValidationApi(submissionId, validationStatus);
      await refresh();
    },
    [refresh]
  );

  const value = useMemo(
    () => ({
      loading,
      error,
      refresh,
      studentAssignments,
      submitAssignment,
      createAssignment,
      updateAssignment,
      deleteAssignment,
      getStudentAssignmentMerged,
      teacherData,
      adminData,
      reviewSubmissionValidation,
      createTeacherByAdmin,
      createUserByAdmin,
      updateUserByAdmin,
      deleteUserByAdmin,
      toggleUserStatusByAdmin,
      markAssignmentCompleted: async () => {},
      saveAssignmentDraft: (assignmentId, draft) => {
        if (!user?.id) return;
        setDraft(String(user.id), String(assignmentId), draft);
      },
      loadAssignmentDraft: (assignmentId) => {
        if (!user?.id) return null;
        return getDraft(String(user.id), String(assignmentId));
      },
      getAssignmentById: (id) => assignments.find((a) => String(a.id) === String(id)),
    }),
    [
      loading,
      error,
      refresh,
      studentAssignments,
      submitAssignment,
      createAssignment,
      updateAssignment,
      deleteAssignment,
      getStudentAssignmentMerged,
      teacherData,
      adminData,
      reviewSubmissionValidation,
      createTeacherByAdmin,
      createUserByAdmin,
      updateUserByAdmin,
      deleteUserByAdmin,
      toggleUserStatusByAdmin,
      assignments,
      user?.id,
    ]
  );

  return <LMSContext.Provider value={value}>{children}</LMSContext.Provider>;
}

export function useLMS() {
  const ctx = useContext(LMSContext);
  if (!ctx) throw new Error('useLMS must be used within LMSProvider');
  return ctx;
}

