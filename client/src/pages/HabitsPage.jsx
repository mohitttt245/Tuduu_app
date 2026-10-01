import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Flame, Heart, Pencil, Plus, Trash2 } from 'lucide-react';
import api, { getErrorMessage } from '../services/api.js';

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const keyFor = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const todayKey = () => keyFor(new Date());

function HabitModal({ habit, onClose, onSaved }) {
  const [name, setName] = useState(habit?.name || '');
  const [description, setDescription] = useState(habit?.description || '');
  const [days, setDays] = useState(habit?.weekdays || [0, 1, 2, 3, 4, 5, 6]);
  const [target, setTarget] = useState(habit?.targetPerWeek || 7);
  const [reminderTime, setReminderTime] = useState(habit?.reminderTime || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const payload = { name, description, weekdays: days, targetPerWeek: Number(target), reminderTime };
      if (habit) await api.put(`/habits/${habit._id}`, payload); else await api.post('/habits', payload);
      onSaved();
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setBusy(false); }
  }
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal-card modal-card-narrow" role="dialog" aria-modal="true" aria-labelledby="habit-modal-title"><div className="modal-heading"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-violet-600">A routine worth keeping</p><h2 id="habit-modal-title" className="mt-1 text-xl font-semibold text-ink">{habit ? 'Edit habit' : 'New habit'}</h2></div><button className="icon-button" aria-label="Close habit editor" onClick={onClose}>×</button></div><form className="modal-body space-y-4" onSubmit={submit}><label className="form-label">Habit name<input autoFocus className="settings-input" required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Read for 15 minutes" /></label><label className="form-label">A note <span className="font-normal text-slate-400">Optional</span><textarea className="settings-input min-h-[70px] py-2" maxLength={300} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What does showing up look like?" /></label><fieldset><legend className="mb-2 text-xs font-semibold text-slate-600">Scheduled days</legend><div className="flex flex-wrap gap-2">{weekDays.map((day, index) => <button type="button" className={`weekday-chip ${days.includes(index) ? 'weekday-chip-active' : ''}`} key={day} onClick={() => setDays((current) => current.includes(index) ? current.filter((value) => value !== index) : [...current, index])}>{day}</button>)}</div></fieldset><div className="grid gap-3 sm:grid-cols-2"><label className="form-label">Weekly target<input className="settings-input" type="number" min="1" max="7" value={target} onChange={(event) => setTarget(event.target.value)} /></label><label className="form-label">Reminder time<input className="settings-input" type="time" value={reminderTime} onChange={(event) => setReminderTime(event.target.value)} /><span className="text-[10px] font-normal text-slate-400">In-app reminder on scheduled days.</span></label></div>{error && <p className="form-error" role="alert">{error}</p>}<div className="modal-footer !px-0 !pb-0"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="primary-button !h-10 !w-auto" disabled={busy}>{busy ? 'Saving…' : habit ? 'Save changes' : 'Create habit'}</button></div></form></section></div>;
}

export default function HabitsPage() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalHabit, setModalHabit] = useState(undefined);
  const today = todayKey();
  const week = useMemo(() => Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() - (6 - index)); return keyFor(date); }), []);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const { data } = await api.get('/habits', { params: { today } }); setHabits(data.data.habits); }
    catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setLoading(false); }
  }, [today]);

  useEffect(() => { load(); }, [load]);

  async function toggleCompletion(habit) {
    setError('');
    try {
      if (habit.completions.includes(today)) await api.delete(`/habits/${habit._id}/completion`, { params: { dateKey: today } });
      else await api.post(`/habits/${habit._id}/complete`, { dateKey: today });
      await load();
    } catch (requestError) { setError(getErrorMessage(requestError)); }
  }

  async function removeHabit(habit) {
    if (!window.confirm(`Delete “${habit.name}” and its entire completion history? This cannot be undone.`)) return;
    try { await api.delete(`/habits/${habit._id}`); await load(); }
    catch (requestError) { setError(getErrorMessage(requestError)); }
  }

  const doneToday = habits.filter((habit) => habit.completions.includes(today)).length;
  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-medium text-slate-400">Consistency over intensity</p><h1 className="mt-2 text-[30px] font-semibold tracking-[-.045em] text-ink">Habits</h1><p className="mt-1 text-sm text-slate-500">Keep promises small enough to keep.</p></div><button className="primary-button !h-10 !w-auto" onClick={() => setModalHabit(null)}><Plus size={16} /> New habit</button></div>
    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error} <button className="ml-2 underline" onClick={load}>Retry</button></div>}
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-3"><article className="stat-card"><div className="stat-icon stat-violet"><Heart size={18} /></div><p className="mt-4 text-xs text-slate-500">Active habits</p><p className="mt-1 text-[26px] font-semibold text-ink">{habits.length}</p></article><article className="stat-card"><div className="stat-icon stat-green"><Check size={18} /></div><p className="mt-4 text-xs text-slate-500">Done today</p><p className="mt-1 text-[26px] font-semibold text-ink">{doneToday}<span className="ml-1 text-sm font-medium text-slate-400">/ {habits.length}</span></p></article><article className="stat-card col-span-2 lg:col-span-1"><div className="stat-icon stat-orange"><Flame size={18} /></div><p className="mt-4 text-xs text-slate-500">Longest streak</p><p className="mt-1 text-[26px] font-semibold text-ink">{Math.max(0, ...habits.map((habit) => habit.longestStreak || 0))}<span className="ml-1 text-sm font-medium text-slate-400">days</span></p></article></section>

    {loading ? <div className="grid gap-4 md:grid-cols-2">{[0, 1].map((item) => <div className="skeleton h-56" key={item} />)}</div> : habits.length ? <div className="grid gap-4 md:grid-cols-2">{habits.map((habit) => {
      const completionSet = new Set(habit.completions);
      const isDone = completionSet.has(today);
      return <article className="panel" key={habit._id}><div className="flex items-start gap-3"><button className={`habit-check ${isDone ? 'habit-check-done' : ''}`} onClick={() => toggleCompletion(habit)} aria-label={isDone ? `Undo ${habit.name} for today` : `Complete ${habit.name} for today`}>{isDone && <Check size={17} />}</button><div className="min-w-0 flex-1"><h2 className="truncate text-sm font-semibold text-ink">{habit.name}</h2><p className="mt-1 text-xs text-slate-400">{habit.description || `Goal: ${habit.targetPerWeek} ${habit.targetPerWeek === 1 ? 'day' : 'days'} each week`}</p></div><div className="flex gap-1"><button className="icon-button" aria-label={`Edit ${habit.name}`} onClick={() => setModalHabit(habit)}><Pencil size={14} /></button><button className="icon-button icon-button-danger" aria-label={`Delete ${habit.name}`} onClick={() => removeHabit(habit)}><Trash2 size={14} /></button></div></div>
        <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-3"><div className="flex items-center gap-2"><Flame size={16} className={habit.currentStreak ? 'text-orange-500' : 'text-slate-300'} /><span className="text-xs font-semibold text-slate-600">{habit.currentStreak || 0} day streak</span></div><span className="text-[10px] text-slate-400">Best {habit.longestStreak || 0}</span></div>
        <div className="mt-4 flex items-center justify-between"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Last 7 days</p><p className="text-[10px] text-slate-400">{week.filter((date) => completionSet.has(date)).length} / 7</p></div><div className="mt-2 grid grid-cols-7 gap-1.5">{week.map((date) => { const completed = completionSet.has(date); const weekday = new Date(`${date}T12:00:00`).getDay(); const scheduled = habit.weekdays.includes(weekday); return <div className="flex flex-col items-center gap-1" key={date}><span className={`habit-day ${completed ? 'habit-day-complete' : scheduled ? 'habit-day-scheduled' : ''}`} title={`${date}${scheduled ? ' · scheduled' : ''}${completed ? ' · complete' : ''}`}>{completed ? <Check size={11} /> : scheduled ? '·' : ''}</span><span className="text-[9px] text-slate-400">{weekDays[weekday].slice(0, 1)}</span></div>; })}</div>
      </article>;
    })}</div> : <div className="panel flex flex-col items-center py-16 text-center"><span className="empty-chart-icon"><Heart size={19} /></span><h2 className="mt-4 text-sm font-semibold text-ink">A habit starts with one gentle choice.</h2><p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">Create a routine and check it off when you show up.</p><button className="primary-button mt-5 !h-10 !w-auto" onClick={() => setModalHabit(null)}><Plus size={15} /> Create a habit</button></div>}
    {modalHabit !== undefined && <HabitModal habit={modalHabit} onClose={() => setModalHabit(undefined)} onSaved={() => { setModalHabit(undefined); load(); }} />}
  </div>;
}
