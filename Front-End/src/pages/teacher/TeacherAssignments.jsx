import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLMS } from '../../context/LMSContext';
import { ROUTES } from '../../utils/constants';

function toLocalDateTimeInput(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function toApiDateTime(localValue) {
  if (!localValue) return localValue;
  const d = new Date(localValue);
  if (Number.isNaN(d.getTime())) return localValue;
  return d.toISOString();
}

export function TeacherAssignments() {
  const { teacherData, updateAssignment, deleteAssignment } = useLMS();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', subject: '', deadline: '', priority: 'Medium' });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  const assignments = useMemo(() => {
    return [...(teacherData.assignments || [])].sort(
      (a, b) => new Date(a.deadline) - new Date(b.deadline)
    );
  }, [teacherData.assignments]);

  const openEdit = (a) => {
    setError('');
    setEditing(a.id);
    setForm({
      title: a.title || '',
      subject: a.subject || '',
      deadline: toLocalDateTimeInput(a.deadline),
      priority: a.priority || 'Medium',
    });
  };

  const onSave = async (e) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError('');
    try {
      await updateAssignment(editing, {
        ...form,
        deadline: toApiDateTime(form.deadline),
      });
      setEditing(null);
    } catch (err) {
      setError(err.message || 'Could not update assignment');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (assignment) => {
    const ok = window.confirm(`Delete assignment "${assignment.title}"? This cannot be undone.`);
    if (!ok) return;
    setError('');
    setDeletingId(assignment.id);
    try {
      await deleteAssignment(assignment.id);
      if (editing === assignment.id) setEditing(null);
    } catch (err) {
      setError(err.message || 'Could not delete assignment');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Assignments</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Teacher-only area to view and edit assignments.
          </p>
        </div>
        <Link
          to={ROUTES.TEACHER_CREATE}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Create assignment
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft dark:border-slate-700 dark:bg-slate-900/80">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/80">
              <tr>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Subject</th>
                <th className="px-4 py-3 font-semibold">Deadline</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3">{a.title}</td>
                  <td className="px-4 py-3">{a.subject}</td>
                  <td className="px-4 py-3">{new Date(a.deadline).toLocaleString()}</td>
                  <td className="px-4 py-3">{a.priority}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(a)}
                        className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(a)}
                        disabled={deletingId === a.id}
                        className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950/30"
                      >
                        {deletingId === a.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {assignments.length === 0 && <p className="p-6 text-sm text-slate-500">No assignments yet.</p>}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-lg dark:border-slate-700 dark:bg-slate-900">
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Edit assignment</h2>
            <form onSubmit={onSave} className="mt-4 space-y-3">
              {error && <p className="text-sm text-red-600">{error}</p>}
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Title"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
              />
              <input
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="Subject"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
              />
              <input
                type="datetime-local"
                value={form.deadline}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
              />
              <select
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
