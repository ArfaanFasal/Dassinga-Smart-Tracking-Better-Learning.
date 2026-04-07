import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { useLMS } from '../../context/LMSContext';

export function TeacherAnalytics() {
  const { teacherData } = useLMS();
  const { submissionRate = [], classPerformance = [] } = teacherData.analytics || {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Submission rate and class performance</p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-900/80">
        <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Submission trend</h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={submissionRate}>
              <defs>
                <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} className="text-slate-500" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} className="text-slate-500" />
              <Tooltip />
              <Area type="monotone" dataKey="rate" name="Submission rate %" stroke="#6366f1" fillOpacity={1} fill="url(#colorRate)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-900/80">
        <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Validation distribution</h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={classPerformance} layout="vertical" margin={{ left: 16 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis type="number" tick={{ fontSize: 12 }} className="text-slate-500" />
              <YAxis type="category" dataKey="name" width={88} tick={{ fontSize: 12 }} className="text-slate-500" />
              <Tooltip />
              <Bar dataKey="avg" name="Count" fill="#22c55e" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

