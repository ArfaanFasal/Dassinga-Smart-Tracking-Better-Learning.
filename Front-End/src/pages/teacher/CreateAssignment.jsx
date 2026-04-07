import { useState } from 'react';
import { useLMS } from '../../context/LMSContext';

function toApiDateTime(localValue) {
  if (!localValue) return localValue;
  const d = new Date(localValue);
  if (Number.isNaN(d.getTime())) return localValue;
  return d.toISOString();
}

export function CreateAssignment() {
  const { createAssignment, teacherData } = useLMS();
  const students = teacherData.students;

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [assignMode, setAssignMode] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const [submitErr, setSubmitErr] = useState('');

  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = 'Title is required';
    if (!subject.trim()) e.subject = 'Subject is required';
    if (!deadline) e.deadline = 'Deadline is required';
    if (assignMode === 'select' && selectedIds.length === 0) {
      e.students = 'Select at least one student';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const toggleStudent = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitErr('');
    if (!validate()) return;
    try {
      await createAssignment({
        title: title.trim(),
        subject: subject.trim(),
        deadline: toApiDateTime(deadline),
        priority,
        assignMode,
        assignedStudentIds: assignMode === 'select' ? selectedIds : [],
      });
      setSaved(true);
      setTitle('');
      setSubject('');
      setDeadline('');
      setPriority('Medium');
      setAssignMode('all');
      setSelectedIds([]);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      setSubmitErr(err.message || 'Failed to create assignment');
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
          Create assignment
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Publish tasks to the whole class or hand-pick students.
        </p>
      </div>

      {saved && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          Assignment created successfully.
        </div>
      )}
      {submitErr && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {submitErr}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-900/80"
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            placeholder="e.g. Weekly problem set"
          />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Subject
          </label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            placeholder="e.g. Mathematics"
          />
          {errors.subject && <p className="mt-1 text-xs text-red-600">{errors.subject}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Deadline
          </label>
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
          {errors.deadline && <p className="mt-1 text-xs text-red-600">{errors.deadline}</p>}
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Priority
          </span>
          <div className="grid grid-cols-3 gap-2">
            {['High', 'Medium', 'Low'].map((p) => (
              <label
                key={p}
                className={`flex cursor-pointer items-center justify-center rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition ${
                  priority === p
                    ? p === 'High'
                      ? 'border-red-500 bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                      : p === 'Medium'
                        ? 'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
                        : 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
                    : 'border-slate-200 dark:border-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  value={p}
                  checked={priority === p}
                  onChange={() => setPriority(p)}
                  className="sr-only"
                />
                {p}
              </label>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Assign to
          </span>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`flex cursor-pointer items-center justify-center rounded-xl border-2 px-4 py-3 text-sm font-medium ${
                assignMode === 'all'
                  ? 'border-brand-500 bg-brand-50 text-brand-800 dark:bg-brand-500/20 dark:text-brand-200'
                  : 'border-slate-200 dark:border-slate-600'
              }`}
            >
              <input
                type="radio"
                name="assign"
                checked={assignMode === 'all'}
                onChange={() => setAssignMode('all')}
                className="sr-only"
              />
              All students
            </label>
            <label
              className={`flex cursor-pointer items-center justify-center rounded-xl border-2 px-4 py-3 text-sm font-medium ${
                assignMode === 'select'
                  ? 'border-brand-500 bg-brand-50 text-brand-800 dark:bg-brand-500/20 dark:text-brand-200'
                  : 'border-slate-200 dark:border-slate-600'
              }`}
            >
              <input
                type="radio"
                name="assign"
                checked={assignMode === 'select'}
                onChange={() => setAssignMode('select')}
                className="sr-only"
              />
              Select students
            </label>
          </div>
        </div>

        {assignMode === 'select' && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Pick students</p>
            <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
              {students.map((s) => (
                <label
                  key={s.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-white dark:hover:bg-slate-800"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(s.id)}
                    onChange={() => toggleStudent(s.id)}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-slate-800 dark:text-slate-200">{s.name}</span>
                  <span className="text-xs text-slate-500">{s.email}</span>
                </label>
              ))}
            </div>
            {errors.students && <p className="mt-2 text-xs text-red-600">{errors.students}</p>}
          </div>
        )}

        <button
          type="submit"
          className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:brightness-105"
        >
          Submit assignment
        </button>
      </form>
    </div>
  );
}
