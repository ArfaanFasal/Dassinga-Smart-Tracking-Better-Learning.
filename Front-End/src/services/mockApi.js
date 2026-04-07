import axios from 'axios';

const TOKEN_KEY = 'salms_auth_token';
const REFRESH_TOKEN_KEY = 'salms_auth_refresh_token';
export const AUTH_EXPIRED_EVENT = 'salms:auth-expired';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
});

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function hasAuthToken() {
  return !!getAuthToken();
}

export function setAuthToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || '';
}

export function setRefreshToken(token) {
  if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token);
  else localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config || {};
    const isAuthRoute = String(originalRequest.url || '').includes('/auth/');
    const canRetry = error?.response?.status === 401 && !originalRequest._retry && !isAuthRoute;

    if (canRetry) {
      const refresh = getRefreshToken();
      if (refresh) {
        originalRequest._retry = true;
        try {
          const { data } = await api.post('/auth/refresh', { refresh });
          const nextAccess = data?.access || data?.data?.access;
          const nextRefresh = data?.refresh || data?.data?.refresh;
          if (nextAccess) {
            setAuthToken(nextAccess);
            if (nextRefresh) setRefreshToken(nextRefresh);
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${nextAccess}`;
            return api.request(originalRequest);
          }
        } catch {
          // fall through to hard logout behavior below
        }
      }
    }

    if (error?.response?.status === 401) {
      clearAuthToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
      }
    }
    return Promise.reject(error);
  }
);

function getErrorMessage(err, fallback) {
  if (err?.code === 'ECONNABORTED') {
    return 'Request timed out. Please try again.';
  }
  if (err?.code === 'ERR_NETWORK' || !err?.response) {
    return 'Cannot connect to server. Make sure backend is running on port 5000.';
  }
  const data = err?.response?.data;
  if (data?.message) return data.message;
  if (Array.isArray(data?.non_field_errors) && data.non_field_errors.length > 0) {
    return String(data.non_field_errors[0]);
  }
  if (data && typeof data === 'object') {
    const firstEntry = Object.values(data).find((v) => Array.isArray(v) && v.length > 0);
    if (firstEntry) return String(firstEntry[0]);
  }
  return err?.message || fallback;
}

export async function checkApiHealth() {
  try {
    const { data } = await api.get('/health');
    return data?.success === true;
  } catch {
    return false;
  }
}

function normalizeUser(user) {
  if (!user) return null;
  return {
    ...user,
    role: String(user.role || '').toLowerCase(),
  };
}

export async function apiLogin(email, password) {
  try {
    const { data } = await api.post('/auth/login', { email, password });
    const token = data?.data?.token;
    const refresh = data?.data?.refresh;
    const user = normalizeUser(data?.data?.user);
    if (!token || !user) throw new Error('Invalid login response');
    setAuthToken(token);
    setRefreshToken(refresh || '');
    return { token, user };
  } catch (err) {
    throw new Error(getErrorMessage(err, 'Login failed'));
  }
}

export async function apiRegister({ name, email, password, role }) {
  try {
    const { data } = await api.post('/auth/register', {
      name,
      email,
      password,
      role: String(role || '').toLowerCase(),
    });
    return data?.data || { ok: true };
  } catch (err) {
    throw new Error(getErrorMessage(err, 'Registration failed'));
  }
}

export async function fetchAssignments() {
  const { data } = await api.get('/assignments');
  return data?.data?.assignments || [];
}

export async function fetchAssignmentById(id) {
  const { data } = await api.get(`/assignments/${id}`);
  return data?.data?.assignment || null;
}

export async function createAssignmentApi(payload) {
  const { data } = await api.post('/assignments', payload);
  return data?.data?.assignment;
}

export async function updateAssignmentApi(id, payload) {
  const { data } = await api.patch(`/assignments/${id}`, payload);
  return data?.data?.assignment;
}

export async function deleteAssignmentApi(id) {
  await api.delete(`/assignments/${id}`);
}

export async function submitAssignmentApi({ assignmentId, textAnswer, includeFile, mainFile, imageFile }) {
  try {
    const form = new FormData();
    form.append('assignmentId', assignmentId);
    form.append('textAnswer', textAnswer || '');
    form.append('includeFile', includeFile ? 'true' : 'false');
    if (mainFile) form.append('mainFile', mainFile);
    if (imageFile) form.append('imageFile', imageFile);

    const { data } = await api.post('/submissions', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return {
      submission: data?.data?.submission,
      validation: data?.data?.validation,
    };
  } catch (err) {
    throw new Error(getErrorMessage(err, 'Submission failed'));
  }
}

export async function fetchSubmissionAssetBlob(submissionId, kind = 'file') {
  const safeKind = kind === 'image' ? 'image' : 'file';
  const response = await api.get(`/submissions/${submissionId}/${safeKind}`, {
    responseType: 'blob',
  });
  return response.data;
}

export async function reviewSubmissionValidationApi(submissionId, validationStatus) {
  const { data } = await api.patch(`/submissions/${submissionId}/validation`, { validationStatus });
  return data?.data?.submission;
}

export async function fetchSubmissions(assignmentId = '') {
  const url = assignmentId ? `/submissions/${assignmentId}` : '/submissions';
  const { data } = await api.get(url);
  return data?.data?.submissions || [];
}

export async function fetchSubmissionStats() {
  const { data } = await api.get('/submissions/stats');
  return (
    data?.data || {
      totalAssignments: 0,
      totalSubmissions: 0,
      pendingAssignments: 0,
      flaggedSubmissions: 0,
    }
  );
}

export async function fetchStudents() {
  const { data } = await api.get('/users/students');
  return data?.data?.users || [];
}

export async function fetchProfile() {
  const { data } = await api.get('/users/profile');
  return data?.data?.profile;
}

export async function updateProfileApi(payload) {
  const { data } = await api.put('/users/profile', payload);
  return data?.data?.profile;
}

export async function adminFetchUsers(params = {}) {
  const { data } = await api.get('/admin/users', { params });
  return data?.data?.users || [];
}

export async function adminCreateTeacher(payload) {
  const { data } = await api.post('/admin/create-teacher', payload);
  return data?.data?.user;
}

export async function adminCreateUser(payload) {
  const { data } = await api.post('/admin/users', payload);
  return data?.data?.user;
}

export async function adminUpdateUser(userId, payload) {
  const { data } = await api.patch(`/admin/users/${userId}`, payload);
  return data?.data?.user;
}

export async function adminDeleteUser(userId) {
  await api.delete('/admin/delete-user', { data: { userId } });
}

export async function adminToggleUserStatus(userId, enabled) {
  const { data } = await api.patch('/admin/users/status', { userId, enabled });
  return data?.data?.user;
}

export function sortNoticeBoard(assignments) {
  const rank = { High: 0, Medium: 1, Low: 2 };
  return [...assignments].sort((a, b) => {
    const pa = rank[a.priority] ?? 9;
    const pb = rank[b.priority] ?? 9;
    if (pa !== pb) return pa - pb;
    return new Date(a.deadline) - new Date(b.deadline);
  });
}

export function summarizeTeacherAnalytics(submissions = []) {
  const byDay = new Map();
  submissions.forEach((s) => {
    if (!s.submittedAt) return;
    const day = new Date(s.submittedAt).toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) || 0) + 1);
  });

  return {
    submissionRate: Array.from(byDay.entries())
      .map(([day, count]) => ({ week: day, rate: Math.min(100, count * 10) }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-8),
    classPerformance: [
      { name: 'Valid', avg: submissions.filter((s) => s.validationStatus === 'VALID').length },
      {
        name: 'Suspicious',
        avg: submissions.filter((s) => s.validationStatus === 'SUSPICIOUS').length,
      },
      { name: 'Rejected', avg: submissions.filter((s) => s.validationStatus === 'INVALID').length },
    ],
  };
}

export function getAnalyticsSeed() {
  return {
    weekly: [
      { week: 'W1', completed: 2, pending: 3 },
      { week: 'W2', completed: 4, pending: 2 },
      { week: 'W3', completed: 3, pending: 2 },
      { week: 'W4', completed: 5, pending: 1 },
    ],
    subjects: [
      { subject: 'Math', score: 72 },
      { subject: 'Science', score: 78 },
      { subject: 'History', score: 66 },
      { subject: 'English', score: 81 },
    ],
    submissionTrends: [
      { period: 'P1', submissions: 1 },
      { period: 'P2', submissions: 3 },
      { period: 'P3', submissions: 2 },
      { period: 'P4', submissions: 4 },
    ],
  };
}


