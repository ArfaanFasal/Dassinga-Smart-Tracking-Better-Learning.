import { useLMS } from '../../context/LMSContext';

export function StudentManagement() {
  const { teacherData } = useLMS();
  const students = teacherData?.students || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Students</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Read-only list of students.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-900/80">
        <p className="mb-4 text-sm font-medium text-slate-700 dark:text-slate-300">
          Total students: {students.length}
        </p>

        {students.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No students found.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {students.map((s) => (
              <li
                key={s.id}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {s.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
