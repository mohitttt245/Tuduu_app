import { useCallback, useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';

export default function NotificationBell() {
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  const refresh = useCallback(() => api.get('/notifications', { params: { limit: 1 } }).then(({ data }) => setCount(data.data.unreadCount)).catch(() => {}), []);
  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(timer);
  }, [refresh]);
  return <button className="notification-bell" onClick={() => navigate('/notifications')} aria-label={`Notifications${count ? `, ${count} unread` : ''}`} title="Notifications"><Bell size={17} />{count > 0 && <span className="notification-count">{count > 99 ? '99+' : count}</span>}</button>;
}
