/** Seed users (passwords are plain for mock only) */
export const SEED_USERS = [
  {
    id: 'u-teacher-1',
    name: 'Dr. Sarah Chen',
    email: 'teacher@lms.com',
    password: 'teacher123',
    role: 'Teacher',
  },
  {
    id: 'u-student-1',
    name: 'Alex Rivera',
    email: 'student@lms.com',
    password: 'student123',
    role: 'Student',
  },
  {
    id: 'u-student-2',
    name: 'Jordan Lee',
    email: 'jordan@lms.com',
    password: 'student123',
    role: 'Student',
  },
];

/** All students in class (for teacher metrics) */
export const CLASS_STUDENTS = [
  { id: 'u-student-1', name: 'Alex Rivera', email: 'student@lms.com' },
  { id: 'u-student-2', name: 'Jordan Lee', email: 'jordan@lms.com' },
];

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(23, 59, 0, 0);
  return d.toISOString();
}

function hoursFromNow(h) {
  const d = new Date();
  d.setHours(d.getHours() + h);
  return d.toISOString();
}

const ago = (d) => new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();

/** Assignments created by teacher */
export const SEED_ASSIGNMENTS = [
  {
    id: 'asg-1',
    title: 'Calculus Problem Set 4',
    subject: 'Mathematics',
    deadline: daysFromNow(1),
    priority: 'High',
    createdBy: 'u-teacher-1',
    assignMode: 'all',
    assignedStudentIds: [],
    createdAt: ago(12),
  },
  {
    id: 'asg-2',
    title: 'Essay: Modern Literature',
    subject: 'English',
    deadline: daysFromNow(3),
    priority: 'Medium',
    createdBy: 'u-teacher-1',
    assignMode: 'all',
    assignedStudentIds: [],
    createdAt: ago(18),
  },
  {
    id: 'asg-3',
    title: 'Lab Report — Thermodynamics',
    subject: 'Physics',
    deadline: hoursFromNow(4),
    priority: 'High',
    createdBy: 'u-teacher-1',
    assignMode: 'select',
    assignedStudentIds: ['u-student-1'],
    createdAt: ago(8),
  },
  {
    id: 'asg-4',
    title: 'World History Timeline',
    subject: 'History',
    deadline: daysFromNow(7),
    priority: 'Low',
    createdBy: 'u-teacher-1',
    assignMode: 'all',
    assignedStudentIds: [],
    createdAt: ago(20),
  },
  {
    id: 'asg-5',
    title: 'React Component Patterns',
    subject: 'Computer Science',
    deadline: daysFromNow(0),
    priority: 'Medium',
    createdBy: 'u-teacher-1',
    assignMode: 'all',
    assignedStudentIds: [],
    createdAt: ago(3),
  },
];

/**
 * Per-student status: Pending | Completed (submitted)
 * Keyed by assignmentId + studentId conceptually; stored flat.
 */
export const SEED_STUDENT_PROGRESS = [
  { assignmentId: 'asg-2', studentId: 'u-student-1', status: 'Completed' },
  { assignmentId: 'asg-4', studentId: 'u-student-1', status: 'Completed' },
  { assignmentId: 'asg-2', studentId: 'u-student-2', status: 'Completed' },
];

export const SEED_SUBMISSIONS = [
  {
    id: 'sub-1',
    assignmentId: 'asg-2',
    studentId: 'u-student-1',
    studentName: 'Alex Rivera',
    assignmentTitle: 'Essay: Modern Literature',
    content: 'Draft submitted for review...',
    fileName: null,
    notes: null,
    attachmentName: null,
    imageName: null,
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Submitted',
  },
  {
    id: 'sub-2',
    assignmentId: 'asg-4',
    studentId: 'u-student-1',
    studentName: 'Alex Rivera',
    assignmentTitle: 'World History Timeline',
    content: 'Completed timeline with citations.',
    fileName: 'timeline.pdf',
    notes: 'Final version attached.',
    attachmentName: 'timeline.pdf',
    imageName: null,
    submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Submitted',
  },
  {
    id: 'sub-3',
    assignmentId: 'asg-2',
    studentId: 'u-student-2',
    studentName: 'Jordan Lee',
    assignmentTitle: 'Essay: Modern Literature',
    content: 'Submitted essay body.',
    fileName: null,
    notes: null,
    attachmentName: null,
    imageName: null,
    submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Submitted',
  },
];

/** Weekly performance points for analytics (student) */
export const SEED_WEEKLY_PERFORMANCE = [
  { week: 'W1', completed: 2, pending: 1 },
  { week: 'W2', completed: 3, pending: 2 },
  { week: 'W3', completed: 4, pending: 1 },
  { week: 'W4', completed: 3, pending: 2 },
];

export const SEED_SUBJECT_BREAKDOWN = [
  { subject: 'Mathematics', score: 88 },
  { subject: 'English', score: 82 },
  { subject: 'Physics', score: 90 },
  { subject: 'History', score: 79 },
  { subject: 'Computer Science', score: 92 },
];

/** Submission activity trend (mock) */
export const SEED_SUBMISSION_TRENDS = [
  { period: 'W1', submissions: 1 },
  { period: 'W2', submissions: 2 },
  { period: 'W3', submissions: 1 },
  { period: 'W4', submissions: 3 },
];

/** Teacher analytics charts */
export const SEED_TEACHER_SUBMISSION_RATE = [
  { week: 'W1', rate: 72 },
  { week: 'W2', rate: 78 },
  { week: 'W3', rate: 85 },
  { week: 'W4', rate: 81 },
];

export const SEED_CLASS_PERFORMANCE = [
  { name: 'Mathematics', avg: 84 },
  { name: 'English', avg: 79 },
  { name: 'Physics', avg: 86 },
  { name: 'History', avg: 81 },
  { name: 'CS', avg: 88 },
];
