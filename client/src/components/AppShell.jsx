import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, CalendarDays, CircleHelp, Clock3, Command, Ellipsis, Flame, Home, LogOut, Settings2, Sparkles, SquareCheckBig, Tag } from 'lucide-react';
import Brand from './Brand.jsx';
import NotificationBell from './NotificationBell.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
const workspaceLinks = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/tasks?view=today', label: 'Today', icon: SquareCheckBig },
  { to: '/tasks?view=upcoming', label: 'Upcoming', icon: CalendarDays },
  { to: '/tasks?view=all', label: 'All tasks', icon: Command },
  { to: '/tasks?view=important', label: 'Important', icon: Sparkles },
  { to: '/tasks?view=completed', label: 'Completed', icon: SquareCheckBig },
];
const personalLinks = [
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/tasks?manage=categories', label: 'Categories & tags', icon: Tag },
  { to: '/habits', label: 'Habits', icon: Flame },
];
const insightsLinks = [
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/pomodoro', label: 'Focus timer', icon: Clock3 },
  { to: '/notifications', label: 'Notifications', icon: Sparkles },
  { to: '/assistant', label: 'AI assistant', icon: Sparkles },
];

function SidebarLink({ item, location }) {
  const [path, query = ''] = item.to.split('?');
  const active = location.pathname === path && (!query || location.search === `?${query}`);
  const Icon = item.icon;
  return <Link to={item.to} className={`nav-link ${active ? 'nav-link-active' : ''}`} aria-current={active ? 'page' : undefined}><Icon size={17} />{item.label}</Link>;
}

function MoreSheet({ onClose, onSignOut }) {
  const links = [...insightsLinks, { to: '/help', label: 'Help & support', icon: CircleHelp }, { to: '/settings', label: 'Settings', icon: Settings2 }];
  return <div className="more-sheet-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="more-sheet" role="dialog" aria-modal="true" aria-label="More navigation"><div className="flex items-center justify-between px-4 pb-3"><h2 className="text-sm font-semibold text-ink">More in Tuduu</h2><button className="icon-button" onClick={onClose} aria-label="Close navigation">×</button></div>{links.map((item) => { const Icon = item.icon; return <Link key={item.to} to={item.to} className="more-sheet-link" onClick={onClose}><Icon size={17} />{item.label}</Link>; })}<button className="more-sheet-link text-rose-600" onClick={onSignOut}><LogOut size={17} />Sign out</button></section></div>;
}

export default function AppShell() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate('/login', { replace: true });
  }

  useEffect(() => {
    function onShortcut(event) {
      const target = event.target;
      const editingText = target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'a' && !editingText) {
        event.preventDefault();
        navigate('/tasks?view=all&new=1');
      }
    }
    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, [navigate]);

  const pageName = location.pathname === '/settings' ? 'Settings'
    : location.pathname === '/tasks' ? 'Tasks'
      : location.pathname === '/calendar' ? 'Calendar'
        : location.pathname === '/habits' ? 'Habits'
          : location.pathname === '/analytics' ? 'Analytics'
            : location.pathname === '/pomodoro' ? 'Focus timer'
              : location.pathname === '/notifications' ? 'Notifications'
                : location.pathname === '/assistant' ? 'AI Assistant'
                  : location.pathname === '/help' ? 'Help & support' : 'Dashboard';

  return (
    <div className="min-h-screen bg-canvas text-ink lg:flex">
      <aside className="sidebar hidden lg:fixed lg:inset-y-0 lg:flex lg:w-[252px] lg:flex-col">
        <div className="px-7 pb-8 pt-7"><Brand /></div>
        <div className="sidebar-links">
          <p className="nav-heading">WORKSPACE</p>{workspaceLinks.map((item) => <SidebarLink key={item.to} item={item} location={location} />)}
          <div className="mt-7"><p className="nav-heading">PERSONAL</p>{personalLinks.map((item) => <SidebarLink key={item.to} item={item} location={location} />)}</div>
          <div className="mt-7"><p className="nav-heading">PRODUCTIVITY</p>{insightsLinks.map((item) => <SidebarLink key={item.to} item={item} location={location} />)}</div>
        </div>
        <div className="mt-auto px-5 pb-5">
          <div className="mb-3 rounded-2xl border border-violet-100 bg-violet-50/80 p-4"><div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm"><Sparkles size={16} /></div><p className="text-xs font-semibold text-ink">A little at a time.</p><p className="mt-1 text-[11px] leading-relaxed text-slate-500">Small steps are still progress.</p></div>
          <div className="profile-menu"><Link to="/settings" className="flex min-w-0 flex-1 items-center gap-2"><span className="avatar">{initials(user?.name)}</span><span className="min-w-0 text-left"><span className="block truncate text-xs font-semibold text-ink">{user?.name}</span><span className="block truncate text-[11px] text-slate-400">{user?.email}</span></span></Link><button className="icon-button" aria-label="Sign out" title="Sign out" onClick={handleSignOut}><LogOut size={15} /></button></div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 lg:ml-[252px]">
        <header className="app-header flex h-[68px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <div className="lg:hidden"><Brand /></div>
          <div className="hidden items-center gap-2 text-xs text-slate-400 lg:flex"><span>Workspace</span><span>/</span><span className="font-medium text-slate-600">{pageName}</span></div>
          <div className="ml-auto flex items-center gap-2"><button className="help-button hidden sm:grid" onClick={() => navigate('/tasks?view=all&new=1')} aria-label="Quick add task" title="Quick add task"><Command size={17} /></button><NotificationBell /><button className="help-button" onClick={() => navigate('/help')} aria-label="Help and support" title="Help and support"><CircleHelp size={18} /></button></div>
        </header>
        <main className="mx-auto w-full max-w-[1360px] px-5 pb-28 pt-7 sm:px-8 sm:pt-9 lg:px-10 lg:pb-12"><Outlet /></main>
      </div>

      <nav className="mobile-nav lg:hidden" aria-label="Main navigation">
        <Link to="/" className={`mobile-nav-link ${location.pathname === '/' ? 'mobile-nav-active' : ''}`}><Home size={19} /><span>Home</span></Link>
        <Link to="/tasks?view=all" className={`mobile-nav-link ${location.pathname === '/tasks' ? 'mobile-nav-active' : ''}`}><SquareCheckBig size={19} /><span>Tasks</span></Link>
        <Link to="/calendar" className={`mobile-nav-link ${location.pathname === '/calendar' ? 'mobile-nav-active' : ''}`}><CalendarDays size={19} /><span>Calendar</span></Link>
        <Link to="/habits" className={`mobile-nav-link ${location.pathname === '/habits' ? 'mobile-nav-active' : ''}`}><Flame size={19} /><span>Habits</span></Link>
        <button className={`mobile-nav-link ${moreOpen ? 'mobile-nav-active' : ''}`} onClick={() => setMoreOpen(true)}><Ellipsis size={19} /><span>More</span></button>
      </nav>
      {moreOpen && <MoreSheet onClose={() => setMoreOpen(false)} onSignOut={handleSignOut} />}
    </div>
  );
}
