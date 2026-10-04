import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLMS } from '../../context/LMSContext';
import { PriorityBadge } from '../../components/PriorityBadge';
import { MIN_ANSWER_LENGTH, ROUTES } from '../../utils/constants';
import { validateSubmissionInput } from '../../utils/submissionValidation';
import { isOverdue } from '../../utils/deadlineUtils';

const KEY_POINTS = [
  'Address every part of the prompt in separate paragraphs.',
  'Cite sources where required using the course style guide.',
  'Proofread for clarity before submitting.',
];

const FILE_ACCEPT =
  '.pdf,.doc,.docx,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip';
const IMAGE_ACCEPT = 'image/*';

export function AssignmentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { getStudentAssignmentMerged, submitAssignment, refresh } = useLMS();

  const assignment = user?.id ? getStudentAssignmentMerged(id, user.id) : null;

  const [answer, setAnswer] = useState('');
  const [includeFile, setIncludeFile] = useState(false);
  const [documentFile, setDocumentFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localSubmitted, setLocalSubmitted] = useState(false);

  if (!assignment) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
        <p className="text-slate-600 dark:text-slate-400">Assignment not found or not assigned to you.</p>
        <Link to={ROUTES.STUDENT_ASSIGNMENTS} className="mt-4 inline-block text-brand-600 hover:underline">
          Back to assignments
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (deadlinePassed && !done) {
      window.alert('Submission deadline has passed');
      return;
    }
    const text = answer.trim();
    const error = await validateSubmissionInput({
      text,
      includeFile,
      documentFile,
      imageFile,
      minAnswerLength: MIN_ANSWER_LENGTH,
    });
    if (error) {
      window.alert(error);
      return;
    }

    const prevAnswer = answer;
    const prevDocumentFile = documentFile;
    const prevImageFile = imageFile;
    const prevIncludeFile = includeFile;
    const safetyTimer = setTimeout(() => setIsSubmitting(false), 20000);

    try {
      setIsSubmitting(true);
      setLocalSubmitted(true);
      setAnswer('');
      setDocumentFile(null);
      setImageFile(null);
      setIncludeFile(false);

      const result = await submitAssignment({
        assignmentId: assignment.id,
        content: text || '',
        includeFile,
        mainFile: documentFile || null,
        imageFile: imageFile || null,
      });
      const validation = String(result?.validation?.status || 'VALID').toUpperCase();
      if (validation === 'SUSPICIOUS') {
        window.alert('Submitted successfully. Marked as suspicious for teacher review.');
      } else if (validation === 'INVALID') {
        window.alert('Submitted successfully. Marked as invalid by validation checks.');
      } else {
        window.alert('Submitted successfully');
      }
      refresh().catch(() => {});
    } catch (err) {
      const message = String(err?.message || 'Submission failed');
      if (message.toLowerCase().includes('duplicate submission attempt')) {
        setLocalSubmitted(true);
        window.alert('Submitted successfully');
        refresh().catch(() => {});
      } else if (message.toLowerCase().includes('request timed out')) {
        setLocalSubmitted(true);
        window.alert('Submitted successfully. Syncing status...');
        refresh().catch(() => {});
        setTimeout(() => refresh().catch(() => {}), 3000);
        setTimeout(() => refresh().catch(() => {}), 8000);
      } else {
        setLocalSubmitted(false);
        setAnswer(prevAnswer);
        setDocumentFile(prevDocumentFile);
        setImageFile(prevImageFile);
        setIncludeFile(prevIncludeFile);
        window.alert(message);
      }
    } finally {
      clearTimeout(safetyTimer);
      setIsSubmitting(false);
    }
  };

  const done = localSubmitted || assignment.status === 'Completed' || Boolean(assignment.lastSubmission);
  const deadlinePassed = isOverdue(assignment.deadline);
  const submissionLocked = done || deadlinePassed || isSubmitting;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to={ROUTES.STUDENT_ASSIGNMENTS}
            className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            ← Assignments
          </Link>
          <h1 className="mt-2 font-display text-2xl font-bold text-slate-900 dark:text-white">
            {assignment.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
            <span>{assignment.subject}</span>
            <span>·</span>
            <span>{new Date(assignment.deadline).toLocaleString()}</span>
            <PriorityBadge priority={assignment.priority} />
            <span
              className={
                done ? 'font-medium text-emerald-600 dark:text-emerald-400' : 'font-medium text-amber-600'
              }
            >
              {done ? 'Completed' : assignment.status}
            </span>
            {deadlinePassed && !done && <span className="font-medium text-red-600">Deadline passed</span>}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft dark:border-slate-700 dark:bg-slate-900/80">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Answer support
            </h2>
            <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-slate-700 dark:text-slate-300">
              {KEY_POINTS.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-2">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-900/80"
          >
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
              Your submission
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Minimum {MIN_ANSWER_LENGTH} characters when submitting text only. You may optionally attach a file;
              if you choose to include a file, selecting the file is required before submit.
            </p>

            <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Answer
            </label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={10}
              disabled={submissionLocked}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              placeholder="Type your answer here…"
            />

            <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Attach document (PDF, DOCX, ZIP)
            </label>
            <input
              type="file"
              accept={FILE_ACCEPT}
              onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
              disabled={submissionLocked}
              className="mt-2 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100 dark:text-slate-400 dark:file:bg-brand-950 dark:file:text-brand-300"
            />
            {documentFile && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Selected: {documentFile.name}</p>
            )}

            <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">Attach image (optional)</label>
            <input
              type="file"
              accept={IMAGE_ACCEPT}
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              disabled={submissionLocked}
              className="mt-2 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100 dark:text-slate-400 dark:file:bg-brand-950 dark:file:text-brand-300"
            />
            {imageFile && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Selected image: {imageFile.name}</p>
            )}

            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={includeFile}
                onChange={(e) => {
                  setIncludeFile(e.target.checked);
                }}
                disabled={submissionLocked}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Submit using file only (document required)
            </label>

            <button
              type="submit"
              disabled={submissionLocked}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {done ? 'Already submitted' : deadlinePassed ? 'Deadline passed' : isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

