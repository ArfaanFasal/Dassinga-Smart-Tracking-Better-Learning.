import { useMemo, useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import { fetchSubmissionAssetBlob } from '../../services/mockApi';

function statusClass(status) {
  if (status === 'INVALID') return 'font-medium text-red-600 dark:text-red-400';
  if (status === 'SUSPICIOUS') return 'font-medium text-amber-600 dark:text-amber-400';
  return 'font-medium text-emerald-600 dark:text-emerald-400';
}

export function Submissions() {
  const { teacherData, reviewSubmissionValidation } = useLMS();
  const [openingKey, setOpeningKey] = useState('');
  const [reviewingKey, setReviewingKey] = useState('');
  const [assetError, setAssetError] = useState('');

  const rows = useMemo(() => {
    return [...teacherData.submissions].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }, [teacherData.submissions]);

  const openAsset = async (submissionId, kind) => {
    const key = `${submissionId}:${kind}`;
    setAssetError('');
    setOpeningKey(key);
    const openedTab = window.open('', '_blank');
    try {
      const blob = await fetchSubmissionAssetBlob(submissionId, kind);
      const url = URL.createObjectURL(blob);
      if (openedTab) {
        openedTab.location.href = url;
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      if (openedTab) openedTab.close();
      setAssetError(err.message || 'Could not open file');
    } finally {
      setOpeningKey('');
    }
  };

  const updateValidation = async (submissionId, verdict) => {
    const key = `${submissionId}:${verdict}`;
    setAssetError('');
    setReviewingKey(key);
    try {
      await reviewSubmissionValidation(submissionId, verdict);
    } catch (err) {
      setAssetError(err.message || 'Could not update validation');
    } finally {
      setReviewingKey('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Submissions</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Monitor files, timestamps, and validation flags.</p>
      </div>

      {assetError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {assetError}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft dark:border-slate-700 dark:bg-slate-900/80">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-700">
            <thead className="bg-slate-50/80 dark:bg-slate-800/80">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Student</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Assignment</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Validation</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Files</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Review</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Submitted at</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((s) => (
                <tr key={s.id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{s.studentName || 'Student'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.assignmentTitle || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={statusClass(s.validationStatus)}>{s.validationStatus || 'VALID'}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    <div className="flex flex-col gap-1">
                      {s.fileUrl && (
                        <button
                          type="button"
                          onClick={() => openAsset(s.id, 'file')}
                          disabled={openingKey === `${s.id}:file`}
                          className="text-left text-blue-600 hover:underline disabled:opacity-60"
                        >
                          {openingKey === `${s.id}:file` ? 'Opening document...' : 'View document'}
                        </button>
                      )}
                      {s.imageUrl && (
                        <button
                          type="button"
                          onClick={() => openAsset(s.id, 'image')}
                          disabled={openingKey === `${s.id}:image`}
                          className="text-left text-blue-600 hover:underline disabled:opacity-60"
                        >
                          {openingKey === `${s.id}:image` ? 'Opening image...' : 'View image'}
                        </button>
                      )}
                      {!s.fileUrl && !s.imageUrl && <span>-</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => updateValidation(s.id, 'VALID')}
                        disabled={reviewingKey !== '' || s.validationStatus === 'VALID'}
                        className="rounded-lg border border-emerald-400 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                      >
                        {reviewingKey === `${s.id}:VALID` ? 'Saving...' : 'Mark Valid'}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateValidation(s.id, 'INVALID')}
                        disabled={reviewingKey !== '' || s.validationStatus === 'INVALID'}
                        className="rounded-lg border border-red-400 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950/30"
                      >
                        {reviewingKey === `${s.id}:INVALID` ? 'Saving...' : 'Reject'}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.submittedAt ? new Date(s.submittedAt).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No submissions yet.</p>}
      </div>
    </div>
  );
}
