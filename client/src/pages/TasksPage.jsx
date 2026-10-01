import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ChevronRight, Plus, Search, SlidersHorizontal, Tags } from 'lucide-react';
import TaskEditorModal from '../components/TaskEditorModal.jsx';
import TaskRow from '../components/TaskRow.jsx';
import TaxonomyModal from '../components/TaxonomyModal.jsx';
import api, { getErrorMessage } from '../services/api.js';

const views = [
  ['all', 'All tasks'], ['today', 'Today'], ['upcoming', 'Upcoming'], ['overdue', 'Overdue'], ['important', 'Important'], ['completed', 'Completed'], ['archived', 'Archived'],
];

export default function TasksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = views.some(([value]) => value === searchParams.get('view')) ? searchParams.get('view') : 'all';
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [priority, setPriority] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tagId, setTagId] = useState('');
  const [dueFrom, setDueFrom] = useState('');
  const [dueTo, setDueTo] = useState('');
  const [sort, setSort] = useState('dueDate');
  const [order, setOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalTask, setModalTask] = useState(undefined);
  const [showTaxonomy, setShowTaxonomy] = useState(false);

  const loadTaxonomy = useCallback(async () => {
    const [categoryResponse, tagResponse] = await Promise.all([api.get('/categories'), api.get('/tags')]);
    setCategories(categoryResponse.data.data.categories);
    setTags(tagResponse.data.data.tags);
  }, []);

  useEffect(() => { loadTaxonomy().catch((requestError) => setError(getErrorMessage(requestError))); }, [loadTaxonomy]);
  useEffect(() => { const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250); return () => window.clearTimeout(timer); }, [search]);
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setModalTask(null);
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  useEffect(() => {
    if (searchParams.get('manage') === 'categories') {
      setShowTaxonomy(true);
      const next = new URLSearchParams(searchParams);
      next.delete('manage');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/tasks', { params: { view, page, limit: 30, search: debouncedSearch, priority: priority || undefined, categoryId: categoryId || undefined, tagId: tagId || undefined, dueFrom: dueFrom ? new Date(`${dueFrom}T00:00:00`).toISOString() : undefined, dueTo: dueTo ? new Date(`${dueTo}T23:59:59`).toISOString() : undefined, sort, order } });
      setTasks(data.data.tasks);
      setPagination(data.data.pagination);
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setLoading(false); }
  }, [view, page, debouncedSearch, priority, categoryId, tagId, dueFrom, dueTo, sort, order]);

  useEffect(() => { loadTasks(); }, [loadTasks]);
  useEffect(() => { setPage(1); }, [view, debouncedSearch, priority, categoryId, tagId, dueFrom, dueTo, sort, order]);

  const selectedLabel = useMemo(() => views.find(([value]) => value === view)?.[1], [view]);

  async function mutate(action, task) {
    setError('');
    try {
      if (action === 'complete') await api.post(`/tasks/${task._id}/complete`);
      if (action === 'reopen') await api.post(`/tasks/${task._id}/reopen`);
      if (action === 'pin') await api.post(`/tasks/${task._id}/pin`, { pinned: !task.pinned });
      if (action === 'archive') await api.post(`/tasks/${task._id}/${task.status === 'archived' ? 'unarchive' : 'archive'}`);
      if (action === 'delete') {
        const scope = task.recurrence?.frequency && task.recurrence.frequency !== 'none' && window.confirm(`Delete every occurrence in “${task.title}”? Choose Cancel to delete only this occurrence.`) ? 'series' : 'one';
        if (!window.confirm(`Delete “${task.title}”${scope === 'series' ? ' and its series' : ''}? This cannot be undone.`)) return;
        await api.delete(`/tasks/${task._id}`, { params: { scope } });
      }
      await loadTasks();
    } catch (requestError) { setError(getErrorMessage(requestError)); }
  }

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-medium text-slate-400">Your workspace</p><h1 className="mt-2 text-[30px] font-semibold tracking-[-.045em] text-ink">Tasks</h1><p className="mt-1 text-sm text-slate-500">Keep the next small step within reach.</p></div><div className="flex flex-wrap gap-2"><button className="secondary-button" onClick={() => setShowTaxonomy(true)}><Tags size={15} /> Organize</button><button className="primary-button !h-10 !w-auto" onClick={() => setModalTask(null)}><Plus size={16} /> Add task</button></div></div>

    <div className="task-view-tabs" role="tablist" aria-label="Task views">{views.map(([value, label]) => <button key={value} role="tab" aria-selected={view === value} className={`task-view-tab ${view === value ? 'task-view-tab-active' : ''}`} onClick={() => { const next = new URLSearchParams(searchParams); next.set('view', value); setSearchParams(next); }}>{label}</button>)}</div>

    <section className="panel !p-3.5 sm:!p-4"><div className="grid gap-2 sm:grid-cols-[minmax(180px,1fr)_repeat(4,minmax(115px,auto))]">
      <label className="search-field"><Search size={16} /><input aria-label="Search tasks" placeholder="Search tasks, details, tags…" value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>⌘ ⇧ A</kbd></label>
      <select className="filter-select" aria-label="Filter by priority" value={priority} onChange={(event) => setPriority(event.target.value)}><option value="">Any priority</option><option value="high">High priority</option><option value="medium">Medium priority</option><option value="low">Low priority</option></select>
      <select className="filter-select" aria-label="Filter by category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="">Any category</option>{categories.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select>
      <select className="filter-select" aria-label="Filter by tag" value={tagId} onChange={(event) => setTagId(event.target.value)}><option value="">Any tag</option>{tags.map((item) => <option key={item._id} value={item._id}>#{item.name}</option>)}</select>
      <label className="sort-select"><SlidersHorizontal size={14} /><select aria-label="Sort tasks" value={sort} onChange={(event) => setSort(event.target.value)}><option value="dueDate">Due date</option><option value="priority">Priority</option><option value="createdAt">Created</option><option value="updatedAt">Updated</option><option value="title">Alphabetical</option></select><button onClick={() => setOrder((current) => current === 'asc' ? 'desc' : 'asc')} aria-label={`Order ${order === 'asc' ? 'ascending' : 'descending'}`}><ChevronDown size={14} className={order === 'asc' ? '' : 'rotate-180'} /></button></label>
    </div><details className="mt-3 px-1"><summary className="w-fit cursor-pointer text-[11px] font-medium text-slate-500">Due date range</summary><div className="mt-2 flex flex-wrap items-end gap-2"><label className="form-label !text-[10px]">From<input className="settings-input !h-9 !w-[155px]" type="date" value={dueFrom} onChange={(event) => setDueFrom(event.target.value)} /></label><label className="form-label !text-[10px]">To<input className="settings-input !h-9 !w-[155px]" type="date" value={dueTo} onChange={(event) => setDueTo(event.target.value)} /></label><button className="text-[11px] font-semibold text-violet-600" onClick={() => { setDueFrom(''); setDueTo(''); }}>Clear dates</button></div></details></section>

    {error && <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert"><span>{error}</span><button className="text-xs font-semibold underline" onClick={loadTasks}>Retry</button></div>}
    <section className="panel !p-0"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="section-title">{selectedLabel}</h2><p className="section-subtitle">{pagination.total} {pagination.total === 1 ? 'task' : 'tasks'}</p></div><div className="text-[11px] text-slate-400">Sorted by {sort} <span className="mx-1">·</span> {order === 'asc' ? 'ascending' : 'descending'}</div></div>
      {loading ? <div className="space-y-2 p-4">{[0, 1, 2, 3].map((item) => <div key={item} className="skeleton h-[68px]" />)}</div> : tasks.length ? <div className="divide-y divide-slate-100 px-4">{tasks.map((task) => <TaskRow key={task._id} task={task} onEdit={setModalTask} onComplete={(item) => mutate('complete', item)} onReopen={(item) => mutate('reopen', item)} onPin={(item) => mutate('pin', item)} onArchive={(item) => mutate('archive', item)} onDelete={(item) => mutate('delete', item)} />)}</div> : <div className="empty-tasks mx-4 my-5"><span className="empty-task-mark"><Search size={19} /></span><div><p className="text-sm font-semibold text-ink">{debouncedSearch ? 'No matching tasks.' : `No ${selectedLabel.toLowerCase()} here.`}</p><p className="mt-1 text-xs leading-5 text-slate-400">{debouncedSearch ? 'Try another phrase or clear a filter.' : 'Add a task when you are ready.'}</p></div>{!debouncedSearch && <button className="secondary-button ml-auto" onClick={() => setModalTask(null)}><Plus size={14} /> Add task</button>}</div>}
      {pagination.pages > 1 && <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-5 py-3 text-xs text-slate-500"><span>Page {pagination.page} of {pagination.pages}</span><button className="icon-button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button><button className="icon-button" disabled={page >= pagination.pages} onClick={() => setPage((current) => current + 1)} aria-label="Next page"><ChevronRight size={16} /></button></div>}
    </section>

    {modalTask !== undefined && <TaskEditorModal task={modalTask} categories={categories} tags={tags} onClose={() => setModalTask(undefined)} onSaved={() => { setModalTask(undefined); loadTasks(); }} onTaxonomyChanged={loadTaxonomy} />}
    {showTaxonomy && <TaxonomyModal categories={categories} tags={tags} onClose={() => setShowTaxonomy(false)} onChanged={() => { loadTaxonomy(); loadTasks(); }} />}
    <button className="mobile-fab lg:hidden" onClick={() => setModalTask(null)} aria-label="Add task"><Plus size={22} /></button>
  </div>;
}
