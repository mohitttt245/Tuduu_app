import { useEffect, useState } from 'react';
import { CalendarDays, Plus, X } from 'lucide-react';
import api, { getErrorMessage } from '../services/api.js';

const emptyTask = {
  title: '', description: '', priority: 'medium', dueDate: '', categoryId: '', tagIds: [],
  reminderOffsetMinutes: 0, recurrence: { frequency: 'none', interval: 1, weekdays: [], endDate: '' }, subtasks: [],
};
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const reminderChoices = [0, 5, 15, 30, 60, 1440];

function localDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export default function TaskEditorModal({ task, categories, tags, onClose, onSaved, onTaxonomyChanged }) {
  const [form, setForm] = useState(emptyTask);
  const [newTag, setNewTag] = useState('');
  const [subtaskDraft, setSubtaskDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!task) { setForm(emptyTask); return; }
    setForm({
      title: task.title || '', description: task.description || '', priority: task.priority || 'medium',
      dueDate: localDateTime(task.dueDate), categoryId: task.categoryId?._id || task.categoryId || '',
      tagIds: (task.tagIds || []).map((tag) => typeof tag === 'string' ? tag : tag._id),
      reminderOffsetMinutes: task.reminderOffsetMinutes || 0,
      recurrence: { frequency: task.recurrence?.frequency || 'none', interval: task.recurrence?.interval || 1, weekdays: task.recurrence?.weekdays || [], endDate: task.recurrence?.endDate ? new Date(task.recurrence.endDate).toISOString().slice(0, 10) : '' },
      subtasks: (task.subtasks || []).map((subtask) => ({ title: subtask.title, completed: subtask.completed })),
    });
  }, [task]);

  function setField(name, value) { setForm((current) => ({ ...current, [name]: value })); }
  function updateRecurrence(name, value) { setForm((current) => ({ ...current, recurrence: { ...current.recurrence, [name]: value } })); }

  async function addTag() {
    if (!newTag.trim()) return;
    try {
      const { data } = await api.post('/tags', { name: newTag.trim() });
      const tag = data.data.tag;
      setForm((current) => ({ ...current, tagIds: [...new Set([...current.tagIds, tag._id])] }));
      setNewTag('');
      onTaxonomyChanged();
    } catch (requestError) { setError(getErrorMessage(requestError)); }
  }

  function addSubtask(event) {
    event.preventDefault();
    if (!subtaskDraft.trim()) return;
    setField('subtasks', [...form.subtasks, { title: subtaskDraft.trim(), completed: false }]);
    setSubtaskDraft('');
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const payload = {
      ...form,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      categoryId: form.categoryId || null,
      reminderOffsetMinutes: Number(form.reminderOffsetMinutes),
      recurrence: { ...form.recurrence, interval: Number(form.recurrence.interval), endDate: form.recurrence.endDate ? new Date(`${form.recurrence.endDate}T23:59:59`).toISOString() : null },
    };
    try {
      if (task?._id) await api.put(`/tasks/${task._id}`, payload);
      else await api.post('/tasks', payload);
      onSaved();
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setBusy(false); }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
        <div className="modal-heading"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-violet-600">{task ? 'Edit details' : 'Make a little progress'}</p><h2 id="task-modal-title" className="mt-1 text-xl font-semibold tracking-tight text-ink">{task ? 'Edit task' : 'New task'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close task editor"><X size={18} /></button></div>
        <form onSubmit={submit} className="modal-body space-y-4">
          <label className="form-label">Task title<input autoFocus className="settings-input" maxLength={200} required value={form.title} onChange={(event) => setField('title', event.target.value)} placeholder="What would you like to get done?" /></label>
          <label className="form-label">Description <span className="font-normal text-slate-400">Optional</span><textarea className="settings-input min-h-[82px] resize-y py-2.5" maxLength={5000} value={form.description} onChange={(event) => setField('description', event.target.value)} placeholder="Add a little more detail…" /></label>
          <div className="grid gap-3 sm:grid-cols-2"><label className="form-label">Priority<select className="settings-input" value={form.priority} onChange={(event) => setField('priority', event.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label><label className="form-label">Category<select className="settings-input" value={form.categoryId} onChange={(event) => setField('categoryId', event.target.value)}><option value="">No category</option>{categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select></label></div>
          <div className="grid gap-3 sm:grid-cols-2"><label className="form-label"><span className="flex items-center gap-1.5"><CalendarDays size={14} /> Due date & time</span><input className="settings-input" type="datetime-local" value={form.dueDate} onChange={(event) => setField('dueDate', event.target.value)} /></label><label className="form-label">Reminder<select className="settings-input" value={form.reminderOffsetMinutes} onChange={(event) => setField('reminderOffsetMinutes', Number(event.target.value))}>{reminderChoices.map((minutes) => <option key={minutes} value={minutes}>{minutes === 0 ? 'No reminder' : minutes < 60 ? `${minutes} minutes before` : minutes === 60 ? '1 hour before' : '1 day before'}</option>)}</select></label></div>

          <div className="form-label">Tags<div className="flex flex-wrap gap-2">{tags.map((tag) => <label key={tag._id} className={`tag-choice ${form.tagIds.includes(tag._id) ? 'tag-choice-active' : ''}`}><input className="sr-only" type="checkbox" checked={form.tagIds.includes(tag._id)} onChange={(event) => setField('tagIds', event.target.checked ? [...form.tagIds, tag._id] : form.tagIds.filter((id) => id !== tag._id))} />#{tag.name}</label>)}</div><div className="flex gap-2"><input className="settings-input" maxLength={32} value={newTag} onChange={(event) => setNewTag(event.target.value)} placeholder="Add a tag" onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addTag(); } }} /><button type="button" className="secondary-button" onClick={addTag}><Plus size={14} /> Add</button></div></div>

          <fieldset className="rounded-xl border border-slate-100 p-3.5"><legend className="px-1 text-xs font-semibold text-slate-600">Repeat</legend><div className="grid gap-3 sm:grid-cols-2"><label className="form-label">Schedule<select className="settings-input" value={form.recurrence.frequency} onChange={(event) => updateRecurrence('frequency', event.target.value)}><option value="none">Does not repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option><option value="custom">Every N days</option></select></label>{form.recurrence.frequency !== 'none' && <label className="form-label">Every<input className="settings-input" type="number" min="1" max="365" value={form.recurrence.interval} onChange={(event) => updateRecurrence('interval', event.target.value)} /><span className="text-[10px] font-normal text-slate-400">{form.recurrence.frequency === 'custom' ? 'days' : form.recurrence.frequency === 'weekly' ? 'weeks' : form.recurrence.frequency === 'monthly' ? 'months' : form.recurrence.frequency === 'yearly' ? 'years' : 'days'}</span></label>}</div>
            {form.recurrence.frequency === 'weekly' && <div className="mt-3"><p className="mb-2 text-[11px] font-medium text-slate-500">Repeat on</p><div className="flex flex-wrap gap-1.5">{weekdays.map((day, index) => <button key={day} type="button" className={`weekday-chip ${form.recurrence.weekdays.includes(index) ? 'weekday-chip-active' : ''}`} onClick={() => updateRecurrence('weekdays', form.recurrence.weekdays.includes(index) ? form.recurrence.weekdays.filter((value) => value !== index) : [...form.recurrence.weekdays, index])}>{day}</button>)}</div></div>}
            {form.recurrence.frequency !== 'none' && <label className="form-label mt-3">Ends on <span className="font-normal text-slate-400">Optional</span><input className="settings-input" type="date" value={form.recurrence.endDate} onChange={(event) => updateRecurrence('endDate', event.target.value)} /></label>}
          </fieldset>

          <fieldset className="rounded-xl border border-slate-100 p-3.5"><legend className="px-1 text-xs font-semibold text-slate-600">Subtasks</legend><div className="space-y-2">{form.subtasks.map((subtask, index) => <div key={`${index}-${subtask.title}`} className="flex items-center gap-2"><input className="h-4 w-4 accent-violet-600" type="checkbox" checked={subtask.completed} onChange={(event) => setField('subtasks', form.subtasks.map((item, itemIndex) => itemIndex === index ? { ...item, completed: event.target.checked } : item))} aria-label={`Mark ${subtask.title} complete`} /><input className="settings-input h-9" maxLength={200} value={subtask.title} onChange={(event) => setField('subtasks', form.subtasks.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item))} /><button className="icon-button !h-8 !w-8" type="button" onClick={() => setField('subtasks', form.subtasks.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${subtask.title}`}><X size={14} /></button></div>)}</div><div className="mt-2 flex gap-2"><input className="settings-input h-9" maxLength={200} value={subtaskDraft} onChange={(event) => setSubtaskDraft(event.target.value)} placeholder="Add a step" onKeyDown={(event) => { if (event.key === 'Enter') addSubtask(event); }} /><button className="secondary-button !h-9" type="button" onClick={addSubtask}><Plus size={14} /> Add step</button></div></fieldset>

          {error && <p className="form-error" role="alert">{error}</p>}
        </form>
        <div className="modal-footer"><button className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button !h-10 !w-auto" disabled={busy} onClick={() => document.getElementById('task-modal-title')?.closest('[role="dialog"]')?.querySelector('form')?.requestSubmit()}>{busy ? 'Saving…' : task ? 'Save task' : 'Create task'}</button></div>
      </section>
    </div>
  );
}
