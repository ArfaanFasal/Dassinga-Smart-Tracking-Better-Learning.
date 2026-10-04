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
  Cell,
} from 'recharts';
import { useLMS } from '../../context/LMSContext';

const BAR_COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

function FancyTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-cyan-400/40 bg-slate-900/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      {label ? <p className="mb-1 font-semibold text-cyan-300">{label}</p> : null}
      {payload.map((item) => (
        <p key={`${item.dataKey}-${item.name}`} className="text-slate-200">
          <span className="font-medium" style={{ color: item.color }}>
            {item.name}:
          </span>{' '}
          {item.value}
        </p>
      ))}
    </div>
  );
}

export function TeacherAnalytics() {
  const { teacherData } = useLMS();
  const { submissionRate = [], classPerformance = [] } = teacherData.analytics || {};
  const filteredClassPerformance = classPerformance.filter(
    (item) => String(item?.name || '').toLowerCase() !== 'suspicious'
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Submission rate and class performance</p>
      </div>

      <div className="rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-slate-900 via-indigo-950 to-cyan-950 p-6 shadow-[0_16px_50px_rgba(8,145,178,0.35)]">
        <h2 className="font-display text-lg font-semibold text-white">Submission trend</h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={submissionRate}>
              <defs>
                <linearGradient id="teacherTrendStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="50%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#f472b6" />
                </linearGradient>
                <linearGradient id="teacherTrendGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.78} />
                  <stop offset="45%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="75%" stopColor="#f472b6" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#0b1220" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#93c5fd' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#93c5fd' }} />
              <Tooltip content={<FancyTooltip />} />
              <Area
                type="monotone"
                dataKey="rate"
                name="Submission rate %"
                stroke="url(#teacherTrendStroke)"
                fillOpacity={1}
                fill="url(#teacherTrendGlow)"
                strokeWidth={4}
                dot={{ r: 4, stroke: '#67e8f9', strokeWidth: 2, fill: '#0f172a' }}
                activeDot={{ r: 7, stroke: '#67e8f9', strokeWidth: 2, fill: '#082f49' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-fuchsia-400/30 bg-gradient-to-br from-slate-900 via-slate-900 to-fuchsia-950 p-6 shadow-[0_16px_50px_rgba(217,70,239,0.2)]">
        <h2 className="font-display text-lg font-semibold text-white">Validation distribution</h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredClassPerformance} layout="vertical" margin={{ left: 16 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(216,180,254,0.2)" />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#d8b4fe' }} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12, fill: '#f0abfc' }} />
              <Tooltip content={<FancyTooltip />} />
              <Bar dataKey="avg" name="Count" radius={[0, 10, 10, 0]}>
                {filteredClassPerformance.map((_, idx) => (
                  <Cell key={`bar-${idx}`} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
