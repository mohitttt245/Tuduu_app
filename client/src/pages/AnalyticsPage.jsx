import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Clock3, Timer } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api, { getErrorMessage } from '../services/api.js';

const COLORS = ['#7465e8', '#5ca888', '#5591ce', '#e3a45f', '#d87873', '#9284bd', '#65aeb0'];
const ranges = [['7', '7 days'], ['30', '30 days'], ['90', '90 days'], ['all', 'All time']];

function Stat({ icon: Icon, label, value, detail, tone }) {
  return <article className="stat-card"><span className={`stat-icon ${tone}`}><Icon size={17} /></span><p className="mt-4 text-xs text-slate-500">{label}</p><p className="mt-1 text-[25px] font-semibold tracking-tight text-ink">{value}</p>{detail && <p className="mt-1 text-[10px] text-slate-400">{detail}</p>}</article>;
}

function ChartPanel({ title, subtitle, children, className = '' }) {
  return <section className={`panel min-w-0 ${className}`}><div className="mb-4"><h2 className="section-title">{title}</h2><p className="section-subtitle">{subtitle}</p></div>{children}</section>;
}

export default function AnalyticsPage() {
  const [range, setRange] = useState('30');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    api.get('/analytics', { params: { range } })
      .then(({ data }) => { if (active) setAnalytics(data.data); })
      .catch((requestError) => { if (active) setError(getErrorMessage(requestError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [range]);

  const stats = analytics?.stats;
  const series = analytics?.charts?.productivity || [];
  const tooltipStyle = { borderRadius: 12, border: '1px solid #ececf3', boxShadow: '0 8px 24px #24304a12', fontSize: 11 };
  return <div className="space-y-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-medium text-slate-400">Look back, learn, adjust</p><h1 className="mt-2 text-[30px] font-semibold tracking-[-.045em] text-ink">Analytics</h1><p className="mt-1 text-sm text-slate-500">Your effort, reflected in a few useful numbers.</p></div><div className="range-tabs" role="tablist" aria-label="Analytics date range">{ranges.map(([value, label]) => <button key={value} role="tab" aria-selected={range === value} className={range === value ? 'range-tab-active' : ''} onClick={() => setRange(value)}>{label}</button>)}</div></div>
    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error} <button className="ml-2 underline" onClick={() => window.location.reload()}>Retry</button></div>}
    {loading ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <div className="skeleton h-36" key={item} />)}</div> : <>
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4"><Stat icon={Activity} label="Tasks created" value={stats?.tasksCreated ?? 0} detail="in selected range" tone="stat-violet" /><Stat icon={CheckCircle2} label="Tasks completed" value={stats?.tasksCompleted ?? 0} detail={`${stats?.completionRate ?? 0}% completion rate`} tone="stat-green" /><Stat icon={AlertTriangle} label="Overdue now" value={stats?.overdueTasks ?? 0} detail="pending past due date" tone="stat-orange" /><Stat icon={Clock3} label="Average completion" value={`${stats?.averageCompletionHours ?? 0}h`} detail="from creation to completion" tone="stat-blue" /></section>
      <section className="grid gap-4 xl:grid-cols-2"><ChartPanel title="Productivity" subtitle="Created and completed tasks by day"><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><LineChart data={series} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}><CartesianGrid stroke="#edf0f5" vertical={false} /><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9aa2b3', fontSize: 10 }} minTickGap={28} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#9aa2b3', fontSize: 10 }} /><Tooltip contentStyle={tooltipStyle} /><Line type="monotone" dataKey="created" name="Created" stroke="#a7a0d9" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="completed" name="Completed" stroke="#7465e8" strokeWidth={2.5} dot={false} /></LineChart></ResponsiveContainer></div></ChartPanel>
        <ChartPanel title="Completed vs pending" subtitle="Current task status within this range"><div className="chart-wrap">{analytics?.charts.byStatus?.some((item) => item.count > 0) ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={analytics.charts.byStatus} dataKey="count" nameKey="name" innerRadius={55} outerRadius={88} paddingAngle={3}>{analytics.charts.byStatus.map((item, index) => <Cell key={item.name} fill={index === 0 ? '#5ca888' : '#a9a2d7'} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart></ResponsiveContainer> : <div className="chart-empty">Task status counts will appear here.</div>}</div><div className="chart-legend">{analytics?.charts.byStatus?.map((item, index) => <span key={item.name}><i style={{ backgroundColor: index === 0 ? '#5ca888' : '#a9a2d7' }} />{item.name} <b>{item.count}</b></span>)}</div></ChartPanel>
        <ChartPanel title="Tasks by category" subtitle="Where your tasks are organized"><div className="chart-wrap">{analytics?.charts.byCategory?.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={analytics.charts.byCategory} dataKey="count" nameKey="name" innerRadius={54} outerRadius={86} paddingAngle={3}>{analytics.charts.byCategory.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart></ResponsiveContainer> : <div className="chart-empty">Category breakdown will appear as you add tasks.</div>}</div><div className="chart-legend">{(analytics?.charts.byCategory || []).map((item, index) => <span key={item.name}><i style={{ backgroundColor: COLORS[index % COLORS.length] }} />{item.name} <b>{item.count}</b></span>)}</div></ChartPanel>
        <ChartPanel title="Task priority" subtitle="How work is distributed by priority"><div className="chart-wrap">{analytics?.charts.byPriority?.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={analytics.charts.byPriority} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}><CartesianGrid stroke="#edf0f5" vertical={false} /><XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fill: '#9aa2b3', fontSize: 10 }} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#9aa2b3', fontSize: 10 }} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="count" name="Tasks" fill="#7465e8" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer> : <div className="chart-empty">Priority breakdown will appear as tasks are created.</div>}</div></ChartPanel>
        <ChartPanel title="Habits & focus" subtitle="Habit check-ins and completed Pomodoro sessions"><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={analytics?.charts.habitCompletions || []} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}><CartesianGrid stroke="#edf0f5" vertical={false} /><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9aa2b3', fontSize: 10 }} minTickGap={28} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#9aa2b3', fontSize: 10 }} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="habitCompletions" name="Habit check-ins" fill="#5ca888" radius={[4, 4, 0, 0]} /><Bar dataKey="pomodoroSessions" name="Focus sessions" fill="#7465e8" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></ChartPanel>
      </section>
      <section className="panel flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="section-title">Focus time</h2><p className="section-subtitle">Completed Pomodoro sessions in this range</p></div><div className="flex items-center gap-2 text-lg font-semibold text-ink"><Timer size={19} className="text-violet-500" />{stats?.pomodoroSessions ?? 0} <span className="text-xs font-medium text-slate-400">sessions</span><span className="mx-2 h-5 w-px bg-slate-200" />{Math.floor((stats?.focusMinutes || 0) / 60)}h {(stats?.focusMinutes || 0) % 60}m</div></section>
    </>}
  </div>;
}
