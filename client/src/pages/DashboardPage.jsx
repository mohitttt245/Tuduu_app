import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, CalendarDays, Check, CheckCircle2, CircleAlert, ClipboardList, Clock3, Sparkles, Target } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api, { getErrorMessage } from '../services/api.js';

const numberFormat = new Intl.NumberFormat();

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function StatCard({ icon: Icon, label, value, note, tone }) {
  return <article className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={18} strokeWidth={1.9} /></div><div className="mt-5 flex items-end justify-between gap-2"><div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 text-[26px] font-semibold tracking-[-.04em] text-ink">{numberFormat.format(value)}</p></div><span className="mb-1 text-[10px] text-slate-400">{note}</span></div></article>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/dashboard/summary')
      .then(({ data }) => { if (active) setSummary(data.data); })
      .catch((requestError) => { if (active) setError(getErrorMessage(requestError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const chartData = useMemo(() => (summary?.weeklyCompleted || []).map((item) => ({
    ...item,
    day: new Date(`${item.date}T12:00:00Z`).toLocaleDateString(undefined, { weekday: 'short', timeZone: 'UTC' }),
  })), [summary]);
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="text-xs font-medium text-slate-400">{today}</p><h1 className="mt-2 text-[28px] font-semibold tracking-[-.045em] text-ink sm:text-[34px]">{greeting()}, {user?.name?.split(' ')[0]} <span aria-hidden="true">✦</span></h1><p className="mt-1.5 text-sm text-slate-500">Let's make today feel a little more manageable.</p></div>
        <div className="hidden items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-500 shadow-sm sm:flex"><CalendarDays size={15} className="text-violet-500" />Your personal overview</div>
      </div>

      {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><span>{error}</span><button className="text-xs font-semibold underline" onClick={() => window.location.reload()}>Try again</button></div>}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4" aria-label="Productivity overview">
        <StatCard icon={Target} label="Due today" value={summary?.stats.todayTasks ?? 0} note="tasks" tone="stat-violet" />
        <StatCard icon={CheckCircle2} label="Completed" value={summary?.stats.completedTasks ?? 0} note="all time" tone="stat-green" />
        <StatCard icon={ClipboardList} label="In progress" value={summary?.stats.pendingTasks ?? 0} note="tasks" tone="stat-blue" />
        <StatCard icon={CircleAlert} label="Overdue" value={summary?.stats.overdueTasks ?? 0} note="needs attention" tone="stat-orange" />
      </section>

      <section className="quick-actions" aria-label="Quick actions"><Link to="/tasks?view=all&new=1"><span className="quick-action-icon"><ClipboardList size={16} /></span><span><strong>Add a task</strong><small>Capture a next step</small></span><ArrowUpRight size={15} className="ml-auto text-slate-300" /></Link><Link to="/calendar"><span className="quick-action-icon quick-action-green"><CalendarDays size={16} /></span><span><strong>Plan a date</strong><small>See your calendar</small></span><ArrowUpRight size={15} className="ml-auto text-slate-300" /></Link><Link to="/pomodoro"><span className="quick-action-icon quick-action-orange"><Clock3 size={16} /></span><span><strong>Focus session</strong><small>Start a Pomodoro</small></span><ArrowUpRight size={15} className="ml-auto text-slate-300" /></Link><Link to="/habits"><span className="quick-action-icon quick-action-blue"><Target size={16} /></span><span><strong>Check in</strong><small>Build a routine</small></span><ArrowUpRight size={15} className="ml-auto text-slate-300" /></Link></section>

      <section className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <article className="panel min-h-[300px]">
          <div className="flex items-start justify-between"><div><h2 className="section-title">Your rhythm</h2><p className="section-subtitle">Tasks completed over the last 7 days</p></div><span className="panel-icon"><Sparkles size={16} /></span></div>
          {loading ? <div className="skeleton mt-8 h-[208px]" /> : summary?.stats.totalTasks === 0 ? <div className="empty-chart"><div className="empty-chart-icon"><Clock3 size={19} /></div><p className="text-sm font-medium text-slate-600">Your week is a blank canvas.</p><p className="mt-1 max-w-[260px] text-center text-xs leading-5 text-slate-400">As you complete tasks, your progress will take shape here.</p></div> : <div className="mt-6 h-[220px] w-full" aria-label="Completed tasks per day"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}><CartesianGrid stroke="#edf0f5" vertical={false} /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9aa2b3', fontSize: 11 }} dy={10} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#9aa2b3', fontSize: 11 }} /><Tooltip cursor={{ stroke: '#ddd9ff', strokeDasharray: '4 4' }} contentStyle={{ borderRadius: 12, border: '1px solid #ececf3', boxShadow: '0 8px 24px #24304a12', fontSize: 12 }} /><Line type="monotone" dataKey="completed" name="Completed" stroke="#7465e8" strokeWidth={2.5} dot={{ r: 3, fill: '#7465e8', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5 }} /></LineChart></ResponsiveContainer></div>}
        </article>

        <article className="panel flex min-h-[300px] flex-col">
          <div className="flex items-start justify-between"><div><h2 className="section-title">All-time progress</h2><p className="section-subtitle">A steady pace adds up</p></div><span className="progress-ring-icon"><Check size={16} /></span></div>
          <div className="my-auto flex items-center gap-5 py-8"><div className="progress-ring" style={{ '--progress': `${summary?.stats.completionRate || 0}%` }}><div className="progress-ring-inner"><span className="text-[25px] font-semibold tracking-[-.05em] text-ink">{summary?.stats.completionRate ?? 0}<span className="text-sm">%</span></span></div></div><div><p className="text-sm font-semibold text-ink">You’re building momentum</p><p className="mt-1 max-w-[160px] text-xs leading-5 text-slate-400">Every finished task is a promise kept to yourself.</p></div></div>
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs"><span className="text-slate-500">Total tasks created</span><span className="font-semibold text-ink">{numberFormat.format(summary?.stats.totalTasks ?? 0)}</span></div>
        </article>
      </section>

      <section className="panel">
        <div className="flex items-start justify-between"><div><h2 className="section-title">Your tasks</h2><p className="section-subtitle">A clear view of what’s on your plate</p></div><Link to="/tasks?view=all" className="flex items-center gap-1 text-[11px] font-semibold text-violet-600">View all <ArrowUpRight size={13} /></Link></div>
        {loading ? <div className="mt-6 space-y-3">{[0, 1, 2].map((row) => <div key={row} className="skeleton h-12" />)}</div> : summary?.recentTasks?.length ? <div className="mt-5 divide-y divide-slate-100">{summary.recentTasks.map((task) => <div key={task._id} className="flex items-center gap-3 py-3"><span className={`task-check ${task.status === 'completed' ? 'task-check-done' : ''}`}>{task.status === 'completed' && <Check size={12} />}</span><span className={`min-w-0 flex-1 truncate text-sm ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{task.title}</span><span className={`priority-pill priority-${task.priority}`}>{task.priority}</span></div>)}</div> : <div className="empty-tasks mt-5"><div className="empty-task-mark"><ClipboardList size={20} /></div><div className="flex-1"><p className="text-sm font-semibold text-ink">Nothing on your list yet.</p><p className="mt-1 text-xs leading-5 text-slate-400">Add a task to turn an idea into a next step.</p></div><Link className="secondary-button" to="/tasks?view=all&new=1">Add task</Link></div>}
      </section>
      <div className="flex items-center justify-center gap-2 pb-3 text-[11px] text-slate-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Your private workspace is up to date</div>
    </div>
  );
}
