import { useMemo, useState } from 'react';
import { BookOpen, CalendarDays, CircleHelp, Clock3, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const topics = [
  { title: 'How do I add and organize a task?', group: 'Tasks', text: 'Open All tasks and choose Add task. You can set a due date, priority, reminder, repeat schedule, category, tags, and subtasks. Use the Organize button to manage your categories and tags.', icon: BookOpen },
  { title: 'How do recurring tasks work?', group: 'Tasks', text: 'Choose a repeat schedule while creating or editing a task. Completing an occurrence keeps its history and schedules the next one. Deleting a recurring task lets you choose whether to remove one occurrence or the whole series.', icon: CalendarDays },
  { title: 'Is there a quick-add shortcut?', group: 'Tasks', text: 'Press Ctrl+Shift+A on Windows or Cmd+Shift+A on Mac when you are not typing in a field to open the task creator. The task list also has a search field for titles, details, categories, and tags.', icon: BookOpen },
  { title: 'Where do reminders appear?', group: 'Reminders', text: 'Task and habit reminders appear in the notification center while the server is running. Task reminders use the selected time before a due date. Habit reminders run on scheduled days at the chosen local time.', icon: Clock3 },
  { title: 'How are habit streaks counted?', group: 'Habits', text: 'A streak counts consecutive scheduled days that you checked in. Unscheduled days do not break the run. If today is scheduled but is not complete yet, the current streak is counted through the previous scheduled day.', icon: Sparkles },
  { title: 'Can I keep a focus session running in the background?', group: 'Focus timer', text: 'Yes. The timer uses elapsed time rather than relying only on a repeating browser tick, so it catches up when you return to the tab. Completed focus sessions are saved to your account.', icon: Clock3 },
  { title: 'How does the AI assistant use my tasks?', group: 'AI assistant', text: 'Day planning and priority suggestions send your pending task titles, descriptions, due dates, and priorities to the AI provider configured by the app owner. The assistant only suggests changes; it does not change or delete tasks without your action. Configure AI_API_KEY and AI_MODEL on the server to enable it.', icon: ShieldCheck },
  { title: 'How do I change the appearance?', group: 'Appearance', text: 'Open Settings and choose Light, Dark, or System. System follows your device preference. Your selection is saved in this browser.', icon: Sparkles },
  { title: 'How do I change my account details or password?', group: 'Account', text: 'Open Settings to update your display name or change your password. Password reset is available from the sign-in screen if you cannot sign in.', icon: ShieldCheck },
];

export default function HelpPage() {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? topics.filter((item) => `${item.title} ${item.group} ${item.text}`.toLowerCase().includes(query)) : topics;
  }, [search]);

  return <div className="mx-auto max-w-[1000px] space-y-6">
    <div><p className="text-xs font-medium text-slate-400">Tuduu guide</p><h1 className="mt-2 text-[30px] font-semibold tracking-[-.045em] text-ink">Help & support</h1><p className="mt-1 text-sm text-slate-500">Answers for tasks, habits, focus sessions, and settings.</p></div>
    <label className="search-field help-search"><Search size={16} /><input aria-label="Search help" placeholder="Search for an answer…" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
    <section className="help-topic-list" aria-label="Help topics">{filtered.map(({ title, text, group, icon: Icon }) => <details className="panel help-topic" key={title}><summary><span className="settings-icon"><Icon size={17} /></span><span className="min-w-0 flex-1"><span className="help-topic-group">{group}</span><span className="help-topic-title">{title}</span></span><CircleHelp className="help-topic-chevron" size={16} /></summary><p>{text}</p></details>)}</section>
    {!filtered.length && <div className="panel text-center"><h2 className="text-sm font-semibold text-ink">No matching help topics</h2><p className="mt-1 text-xs text-slate-500">Try a different search phrase.</p></div>}
    <section className="panel flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="section-title">Still need a hand?</h2><p className="section-subtitle">Open a guide or tell Tuduu what you’re trying to do.</p></div><div className="flex flex-wrap gap-2"><Link className="secondary-button" to="/tasks?view=all"><BookOpen size={14} /> Browse tasks</Link><Link className="primary-button !h-10 !w-auto" to="/assistant"><Sparkles size={14} /> Ask the assistant</Link></div></section>
  </div>;
}
