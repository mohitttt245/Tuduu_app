import { Archive, CalendarDays, Check, Circle, Pin, Pencil, Trash2, ArchiveRestore } from 'lucide-react';

export default function TaskRow({ task, onEdit, onComplete, onReopen, onPin, onArchive, onDelete }) {
  const done = task.status === 'completed';
  const archived = task.status === 'archived';
  const subtaskCount = task.subtasks?.length || 0;
  const finishedSubtasks = task.subtasks?.filter((subtask) => subtask.completed).length || 0;
  return (
    <article className={`task-row ${done ? 'task-row-done' : ''}`}>
      <button disabled={archived} className={`task-toggle ${done ? 'task-toggle-done' : ''}`} onClick={() => done ? onReopen(task) : onComplete(task)} aria-label={archived ? `${task.title} is archived` : done ? `Reopen ${task.title}` : `Complete ${task.title}`}>{done ? <Check size={13} /> : !archived && <Circle size={19} />}</button>
      <div className="min-w-0 flex-1"><button className={`block max-w-full truncate text-left text-sm font-semibold ${done || archived ? 'text-slate-400 line-through' : 'text-slate-700 hover:text-violet-700'}`} onClick={() => onEdit(task)}>{task.title}</button><div className="mt-1.5 flex flex-wrap items-center gap-1.5">{task.categoryId && <span className="category-pill" style={{ '--category-color': task.categoryId.color || '#7465e8' }}>{task.categoryId.name}</span>}{task.priority && <span className={`priority-pill priority-${task.priority}`}>{task.priority}</span>}{task.dueDate && <span className="due-pill"><CalendarDays size={11} />{new Date(task.dueDate).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>}{task.tagIds?.map((tag) => <span className="tag-pill" key={tag._id}>#{tag.name}</span>)}{subtaskCount > 0 && <><span className="subtask-progress" role="progressbar" aria-valuemin="0" aria-valuemax={subtaskCount} aria-valuenow={finishedSubtasks}><span style={{ width: `${(finishedSubtasks / subtaskCount) * 100}%` }} /></span><span className="due-pill">{finishedSubtasks}/{subtaskCount} steps</span></>}</div></div>
      <div className="task-actions"><button disabled={archived} className={`icon-button ${task.pinned ? 'text-violet-600' : ''}`} onClick={() => onPin(task)} title={task.pinned ? 'Unpin task' : 'Pin task'} aria-label={task.pinned ? 'Unpin task' : 'Pin task'}><Pin size={15} fill={task.pinned ? 'currentColor' : 'none'} /></button><button className="icon-button" onClick={() => onEdit(task)} title="Edit task" aria-label="Edit task"><Pencil size={15} /></button><button className="icon-button" onClick={() => onArchive(task)} title={archived ? 'Restore task' : 'Archive task'} aria-label={archived ? 'Restore task' : 'Archive task'}>{archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}</button><button className="icon-button icon-button-danger" onClick={() => onDelete(task)} title="Delete task" aria-label="Delete task"><Trash2 size={15} /></button></div>
    </article>
  );
}
