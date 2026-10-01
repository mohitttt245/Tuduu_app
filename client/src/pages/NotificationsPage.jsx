import { useCallback, useEffect, useState } from 'react';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import api, { getErrorMessage } from '../services/api.js';

const typeLabels = { task_reminder: 'Task reminder', task_overdue: 'Overdue task', recurring_task: 'Recurring task', milestone: 'Milestone', system: 'Workspace update' };

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const { data } = await api.get('/notifications'); setNotifications(data.data.notifications); setUnreadCount(data.data.unreadCount); }
    catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function markRead(id) {
    try { await api.put(`/notifications/${id}/read`); await load(); }
    catch (requestError) { setError(getErrorMessage(requestError)); }
  }
  async function markAllRead() {
    try { await api.put('/notifications/read-all'); await load(); }
    catch (requestError) { setError(getErrorMessage(requestError)); }
  }
  async function remove(notification) {
    if (!window.confirm('Delete this notification?')) return;
    try { await api.delete(`/notifications/${notification._id}`); await load(); }
    catch (requestError) { setError(getErrorMessage(requestError)); }
  }

  return <div className="mx-auto max-w-[900px] space-y-6"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-medium text-slate-400">Stay in the loop</p><h1 className="mt-2 text-[30px] font-semibold tracking-[-.045em] text-ink">Notifications</h1><p className="mt-1 text-sm text-slate-500">Task reminders and updates from your workspace.</p></div>{unreadCount > 0 && <button className="secondary-button" onClick={markAllRead}><CheckCheck size={15} /> Mark all read</button>}</div>
    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error} <button className="ml-2 underline" onClick={load}>Retry</button></div>}
    <section className="panel !p-0">{loading ? <div className="space-y-3 p-5">{[0, 1, 2].map((item) => <div className="skeleton h-16" key={item} />)}</div> : notifications.length ? <div className="divide-y divide-slate-100">{notifications.map((notification) => <article className={`notification-row ${notification.isRead ? '' : 'notification-row-unread'}`} key={notification._id}><span className="notification-type-icon"><Bell size={16} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-xs font-semibold text-ink">{notification.title}</h2><span className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{typeLabels[notification.type] || 'Update'}</span></div><p className="mt-1 text-xs text-slate-500">{notification.message}{notification.taskId?.title ? ` · ${notification.taskId.title}` : ''}</p><p className="mt-1.5 text-[10px] text-slate-400">{new Date(notification.createdAt).toLocaleString()}</p></div><div className="flex gap-1">{!notification.isRead && <button className="icon-button" onClick={() => markRead(notification._id)} aria-label="Mark notification read"><Check size={15} /></button>}<button className="icon-button icon-button-danger" onClick={() => remove(notification)} aria-label="Delete notification"><Trash2 size={15} /></button></div></article>)}</div> : <div className="flex flex-col items-center px-5 py-16 text-center"><span className="empty-chart-icon"><Bell size={18} /></span><h2 className="mt-3 text-sm font-semibold text-ink">All caught up.</h2><p className="mt-1 text-xs text-slate-400">New task reminders will appear here.</p></div>}</section>
  </div>;
}
