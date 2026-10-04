import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLMS } from '../context/LMSContext';
import { PriorityBadge } from './PriorityBadge';
import { MIN_ANSWER_LENGTH } from '../utils/constants';
import { getDeadlineReminder } from '../utils/reminders';
import { validateSubmissionInput } from '../utils/submissionValidation';
import { isOverdue } from '../utils/deadlineUtils';

const FILE_ACCEPT =
  '.pdf,.doc,.docx,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip,image/*';

export function AssignmentCard({ assignment, onSubmitted }) {
  const { user } = useAuth();
  const { submitAssignment, refresh, saveAssignmentDraft, loadAssignmentDraft, markAssignmentCompleted } =
    useLMS();
  const submission = assignment.lastSubmission || null;

  const [notes, setNotes] = useState('');
  const [includeFile, setIncludeFile] = useState(false);
  const [mainFile, setMainFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localSubmitted, setLocalSubmitted] = useState(false);

  useEffect(() => {
    const d = loadAssignmentDraft(assignment.id);
    if (d) {
      setNotes(d.notes || '');
      setIncludeFile(!!d.includeFile);
    }
  }, [assignment.id, loadAssignmentDraft]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  useEffect(() => {
    saveAssignmentDraft(assignment.id, {
      notes,
      includeFile,
    });
  }, [notes, includeFile, assignment.id, saveAssignmentDraft]);

  const done = localSubmitted || assignment.status === 'Completed' || !!submission;
  const deadlinePassed = isOverdue(assignment.deadline);
  const submissionLocked = done || deadlinePassed || isSubmitting;
  const r = getDeadlineReminder(assignment.deadline);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (deadlinePassed && !done) {
      window.alert('Submission deadline has passed');
      return;
    }
    const text = notes.trim();
    const error = await validateSubmissionInput({
      text,
      includeFile,
      documentFile: mainFile,
      imageFile,
      minAnswerLength: MIN_ANSWER_LENGTH,
    });
    if (error) {
      window.alert(error);
      return;
    }

    const prevNotes = notes;
    const prevMainFile = mainFile;
    const prevImageFile = imageFile;
    const prevIncludeFile = includeFile;
    const safetyTimer = setTimeout(() => setIsSubmitting(false), 20000);

    try {
      setIsSubmitting(true);
      // Optimistic UI: reflect submitted state immediately with no lag.
      setLocalSubmitted(true);
      onSubmitted?.('Assignment submitted successfully.');

      setNotes('');
      setMainFile(null);
      setImageFile(null);
      setIncludeFile(false);

      const result = await submitAssignment({
        assignmentId: assignment.id,
        content: text || '',
        includeFile,
        mainFile,
        imageFile,
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
        onSubmitted?.('Assignment submitted successfully.');
        refresh().catch(() => {});
      } else if (message.toLowerCase().includes('request timed out')) {
        // Timeout can happen even when backend eventually stores submission.
        // Keep optimistic submitted state and sync in background.
        setLocalSubmitted(true);
        onSubmitted?.('Submission received. Syncing status...');
        refresh().catch(() => {});
        setTimeout(() => refresh().catch(() => {}), 3000);
        setTimeout(() => refresh().catch(() => {}), 8000);
      } else {
        setLocalSubmitted(false);
        // Restore user input if submit actually failed.
        setNotes(prevNotes);
        setMainFile(prevMainFile);
        setImageFile(prevImageFile);
        setIncludeFile(prevIncludeFile);
        window.alert(message);
      }
    } finally {
      clearTimeout(safetyTimer);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft transition hover:shadow-soft-lg dark:border-slate-700 dark:bg-slate-900/80">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-dassinga-green dark:text-emerald-400">
            {assignment.subject}
          </p>
          <h3 className="mt-1 font-display text-base font-bold text-slate-900 dark:text-white">
            {assignment.title}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Due {new Date(assignment.deadline).toLocaleString()}
            {r.message && (
              <span className={r.highlightRed ? ' ml-1 font-semibold text-red-600' : ''}>
                {' '}
                · {r.message}
              </span>
            )}
          </p>
        </div>
        <PriorityBadge priority={assignment.priority} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span
          className={
            done
              ? 'font-semibold text-emerald-600 dark:text-emerald-400'
              : deadlinePassed
                ? 'font-semibold text-red-600 dark:text-red-400'
                : 'font-semibold text-amber-600 dark:text-amber-400'
          }
        >
          {done ? 'Submitted' : deadlinePassed ? 'Deadline passed' : 'Not Submitted'}
        </span>
        {submission?.submittedAt && (
          <span className="text-slate-500">
            · {new Date(submission.submittedAt).toLocaleString()}
          </span>
        )}
      </div>

      {(submission?.fileUrl || submission?.imageUrl || submission?.validationStatus) && (
        <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/80">
          <p className="font-medium text-slate-700 dark:text-slate-300">Last submission</p>
          <ul className="mt-1 list-inside list-disc text-slate-600 dark:text-slate-400">
            {submission.fileUrl && <li>File uploaded</li>}
            {submission.imageUrl && <li>Image uploaded</li>}
            {submission.validationStatus && <li>Validation: {submission.validationStatus}</li>}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 flex flex-1 flex-col border-t border-slate-100 pt-4 dark:border-slate-800">
        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Notes / content</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={submissionLocked}
          rows={4}
          placeholder="Your notes or answer outline…"
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        />

        <label className="mt-3 text-xs font-medium text-slate-600 dark:text-slate-400">
          Attach document (PDF, DOCX, ZIP)
        </label>
        <input
          type="file"
          accept={FILE_ACCEPT}
          disabled={submissionLocked}
          onChange={(e) => setMainFile(e.target.files?.[0] || null)}
          className="mt-1 text-xs file:mr-2 file:rounded-lg file:bg-dassinga-navy/10 file:px-2 file:py-1 file:text-dassinga-navy dark:file:bg-white/10 dark:file:text-slate-200"
        />
        {mainFile && <p className="mt-1 text-xs text-slate-600">Selected: {mainFile.name}</p>}

        <label className="mt-3 text-xs font-medium text-slate-600 dark:text-slate-400">Image (optional)</label>
        <input
          type="file"
          accept="image/*"
          disabled={submissionLocked}
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          className="mt-1 text-xs file:mr-2 file:rounded-lg file:bg-dassinga-green/15 file:px-2 file:py-1 dark:file:text-emerald-200"
        />
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Preview"
            className="mt-2 max-h-32 rounded-lg border border-slate-200 object-contain dark:border-slate-600"
          />
        )}

        <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={includeFile}
            onChange={(e) => setIncludeFile(e.target.checked)}
            disabled={submissionLocked}
            className="rounded border-slate-300 text-dassinga-navy"
          />
          Submit using file only (document required)
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={submissionLocked}
            className="rounded-xl bg-dassinga-green px-4 py-2 text-sm font-semibold text-white shadow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {done ? 'Submitted' : deadlinePassed ? 'Deadline passed' : isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
          {!submissionLocked && (
            <button
              type="button"
              onClick={() => {
                markAssignmentCompleted(assignment.id);
                refresh();
              }}
              className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
            >
              Mark complete
            </button>
          )}
          <Link
            to={`/student/assignments/${assignment.id}`}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Full details
          </Link>
        </div>
      </form>
    </div>
  );
}
