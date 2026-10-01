import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import TaskEditorModal from '../components/TaskEditorModal.jsx';
import api, { getErrorMessage } from '../services/api.js';

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const localKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export default function CalendarPage() {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedKey, setSelectedKey] = useState(localKey(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalTask, setModalTask] = useState(undefined);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    const from = new Date(month.getFullYear(), month.getMonth(), 1);
    const to = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    try {
      const [calendarResponse, categoryResponse, tagResponse] = await Promise.all([
        api.get('/tasks/calendar', { params: { from: from.toISOString(), to: to.toISOString() } }),
        api.get('/categories'), api.get('/tags'),
      ]);
      setTasks(calendarResponse.data.data.tasks);
      setCategories(categoryResponse.data.data.categories);
      setTags(tagResponse.data.data.tags);
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setLoading(false); }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(first);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return { date, key: localKey(date), inMonth: date.getMonth() === month.getMonth() };
    });
  }, [month]);

  const tasksByDay = useMemo(() => {
    const map = new Map();
    for (const task of tasks) {
      if (!task.dueDate) continue;
      const key = localKey(new Date(task.dueDate));
      map.set(key, [...(map.get(key) || []), task]);
    }
    return map;
  }, [tasks]);
  const selectedDate = new Date(`${selectedKey}T12:00:00`);
  const selectedTasks = tasksByDay.get(selectedKey) || [];

  function moveMonth(direction) {
    const next = new Date(month.getFullYear(), month.getMonth() + direction, 1);
    setMonth(next);
    setSelectedKey(localKey(next));
  }

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-medium text-slate-400">Plan at a glance</p><h1 className="mt-2 text-[30px] font-semibold tracking-[-.045em] text-ink">Calendar</h1><p className="mt-1 text-sm text-slate-500">Dates give your plans somewhere to land.</p></div><button className="primary-button !h-10 !w-auto" onClick={() => setModalTask({ dueDate: new Date(`${selectedKey}T12:00:00`).toISOString() })}><Plus size={16} /> Add for {selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</button></div>
    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error} <button className="ml-2 underline" onClick={load}>Retry</button></div>}
    <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
      <section className="panel calendar-panel">
        <div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-3"><span className="settings-icon"><CalendarDays size={18} /></span><div><h2 className="section-title">{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2><p className="section-subtitle">{tasks.length} scheduled {tasks.length === 1 ? 'task' : 'tasks'}</p></div></div><div className="flex gap-1"><button className="icon-button" aria-label="Previous month" onClick={() => moveMonth(-1)}><ChevronLeft size={18} /></button><button className="icon-button" aria-label="Next month" onClick={() => moveMonth(1)}><ChevronRight size={18} /></button></div></div>
        <div className="calendar-grid calendar-weekdays">{weekdays.map((day) => <div key={day}>{day}</div>)}</div>
        <div className="calendar-grid">{days.map(({ date, key, inMonth }) => {
          const dayTasks = tasksByDay.get(key) || [];
          const selected = key === selectedKey;
          const today = key === localKey(new Date());
          return <button key={key} onClick={() => setSelectedKey(key)} className={`calendar-day ${!inMonth ? 'calendar-day-muted' : ''} ${selected ? 'calendar-day-selected' : ''} ${today ? 'calendar-day-today' : ''}`} aria-pressed={selected} aria-label={`${date.toLocaleDateString()}, ${dayTasks.length} tasks`}><span className="calendar-day-number">{date.getDate()}</span><span className="calendar-day-tasks">{dayTasks.slice(0, 2).map((task) => <span className={`calendar-event ${task.status === 'completed' ? 'calendar-event-done' : ''}`} key={task._id}>{task.title}</span>)}{dayTasks.length > 2 && <span className="calendar-more">+{dayTasks.length - 2} more</span>}</span></button>;
        })}</div>
        {loading && <div className="calendar-loading">Updating calendar…</div>}
      </section>
      <section className="panel min-h-[410px]"><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-slate-400">Selected day</p><h2 className="mt-1 text-lg font-semibold text-ink">{selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h2></div><span className="rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-500">{selectedTasks.length}</span></div>
        {selectedTasks.length ? <div className="mt-5 space-y-2">{selectedTasks.map((task) => <button key={task._id} className="calendar-task-card" onClick={() => setModalTask(task)}><span className={`task-toggle !h-4 !w-4 ${task.status === 'completed' ? 'task-toggle-done' : ''}`}>{task.status === 'completed' && '✓'}</span><span className="min-w-0 flex-1 text-left"><span className={`block truncate text-xs font-semibold ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{task.title}</span><span className="mt-1 block text-[10px] text-slate-400">{new Date(task.dueDate).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}{task.categoryId ? ` · ${task.categoryId.name}` : ''}</span></span><span className={`priority-pill priority-${task.priority}`}>{task.priority}</span></button>)}</div> : <div className="empty-calendar"><span className="empty-chart-icon"><CalendarDays size={19} /></span><p className="mt-3 text-sm font-semibold text-slate-600">A clear day.</p><p className="mt-1 text-xs text-slate-400">No tasks are scheduled here.</p></div>}
      </section>
    </div>
    {modalTask !== undefined && <TaskEditorModal task={modalTask} categories={categories} tags={tags} onClose={() => setModalTask(undefined)} onSaved={() => { setModalTask(undefined); load(); }} onTaxonomyChanged={load} />}
  </div>;
}
