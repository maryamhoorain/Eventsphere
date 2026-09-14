import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3, Bell, ClipboardList, Footprints, Globe, Heart,
  FileText, LayoutDashboard, LogOut, Map, Menu, Mic2, ScanLine, Settings, Star, Ticket, Users,
} from 'lucide-react';
import { useSession } from '../../store/session';
import { endpoints } from '../../api/client';
import { AssistantWidget } from '../common/AssistantWidget';

const NAV = [
  { label: 'Overview', items: [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'organizer', 'exhibitor'] },
    { name: 'Analytics', to: '/dashboard/analytics', icon: BarChart3, roles: ['admin', 'organizer'] },
    { name: 'Reports', to: '/dashboard/reports', icon: FileText, roles: ['admin', 'organizer', 'exhibitor'] },
  ]},
  { label: 'Operations', items: [
    { name: 'Events', to: '/dashboard/events', icon: Globe, roles: ['admin', 'organizer', 'exhibitor'] },
    { name: 'Users', to: '/dashboard/users', icon: Users, roles: ['admin'] },
    { name: 'Applications', to: '/dashboard/applications', icon: ClipboardList, roles: ['admin'] },
    { name: 'Registrations', to: '/dashboard/registrations', icon: Ticket, roles: ['admin', 'organizer'] },
    { name: 'Check-in', to: '/dashboard/check-in', icon: ScanLine, roles: ['admin', 'organizer'] },
    { name: 'Sessions', to: '/dashboard/sessions', icon: Mic2, roles: ['admin', 'organizer', 'exhibitor'] },
    { name: 'Booths', to: '/dashboard/booths', icon: Map, roles: ['admin', 'organizer', 'exhibitor'] },
    { name: 'Booth requests', to: '/dashboard/booth-requests', icon: ClipboardList, roles: ['admin'] },
    { name: 'Booth visits', to: '/dashboard/booth-visits', icon: Footprints, roles: ['admin', 'organizer', 'exhibitor'] },
    { name: 'Feedback', to: '/dashboard/feedback', icon: Star, roles: ['admin', 'organizer'] },
    { name: 'Favorites', to: '/dashboard/favorites', icon: Heart, roles: ['attendee'] },
    { name: 'Notifications', to: '/dashboard/notifications', icon: Bell, roles: ['admin', 'organizer', 'exhibitor'] },
    { name: 'Settings', to: '/dashboard/settings', icon: Settings, roles: ['admin', 'organizer', 'exhibitor'] },
  ]},
];

export function DashboardLayout() {
  const user = useSession((s) => s.user);
  const hydrated = useSession((s) => s.hydrated);
  const logout = useSession((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    if (!user) return undefined;
    let active = true;
    const loadUnread = () => endpoints.notifications.unreadCount()
      .then((response) => { if (active) setUnread(response?.count ?? response?.unreadCount ?? 0); })
      .catch(() => {});
    loadUnread();
    const timer = window.setInterval(loadUnread, 15000);
    return () => { active = false; window.clearInterval(timer); };
  }, [user]);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role === 'attendee' && location.pathname !== '/dashboard/favorites') {
      navigate('/dashboard/favorites');
    }
  }, [hydrated, user, navigate, location.pathname]);

  if (!hydrated) return <div className="dash-shell" style={{ display: 'grid', placeItems: 'center' }}>Loading…</div>;
  if (!user) return <div className="dash-shell" style={{ display: 'grid', placeItems: 'center' }}>Redirecting…</div>;

  const role = user.role;
  const Side = (
    <aside className="dashboard-sidebar" style={{ width: 250, background: 'var(--navy)', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 10, alignItems: 'center' }}>
        <img src="/logo.jpg" alt="" style={{ height: 36, width: 36, borderRadius: 8 }} />
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}><span style={{ color: 'var(--accent)' }}>Event</span>Sphere</div>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.45 }}>Console</div>
        </div>
      </div>
      <nav className="dashboard-sidebar__nav" style={{ flex: 1, overflow: 'auto', padding: '12px 8px' }}>
        {NAV.map((g) => {
          const items = g.items.filter((i) => i.roles.includes(role));
          if (!items.length) return null;
          return (
            <div key={g.label} style={{ marginBottom: 16 }}>
              <div style={{ padding: '4px 12px', fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.35 }}>{g.label}</div>
              {items.map((item) => {
                const active = item.to === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(item.to);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobile(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, marginBottom: 2,
                      fontSize: 13, fontWeight: 500,
                      background: active ? 'rgba(37,99,235,0.25)' : 'transparent',
                      color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                    }}
                  >
                    <Icon size={18} />
                    <span style={{ flex: 1 }}>
                      {item.name === 'Dashboard'
                        ? role === 'admin' ? 'Admin Dashboard' : role === 'organizer' ? 'Organizer Dashboard' : item.name
                        : item.name}
                    </span>
                    {item.name === 'Notifications' && unread > 0 && (
                      <span style={{ background: 'var(--error)', borderRadius: 999, padding: '0 6px', fontSize: 10, fontWeight: 700 }}>{unread}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
      <div className="dashboard-sidebar__account" style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{user.name}</div>
        <div style={{ fontSize: 11, opacity: 0.45, textTransform: 'capitalize' }}>{user.role}</div>
        <button type="button" onClick={() => { logout(); navigate('/'); }} style={{ marginTop: 8, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="dash-shell" style={{ display: 'flex', minHeight: '100vh' }}>
      <div className="hide-mobile dashboard-sidebar-shell">{Side}</div>
      {mobile && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
          <button type="button" aria-label="Close" onClick={() => setMobile(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.5)', border: 'none' }} />
          <div style={{ position: 'relative', height: '100%', width: 250 }}>{Side}</div>
        </div>
      )}
      <div className="dashboard-content">
        <header style={{ height: 64, borderBottom: '1px solid var(--border)', background: '#fff', display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', position: 'sticky', top: 0, zIndex: 20 }}>
          <button type="button" onClick={() => setMobile(true)} style={{ background: 'none', border: 'none', color: 'var(--muted)' }} className="show-mobile">
            <Menu size={20} />
          </button>
          <div style={{ flex: 1, fontSize: 14, color: 'var(--muted)' }}>EventSphere console</div>
          <Link
            to="/dashboard/notifications"
            aria-label={unread ? `${unread} unread notifications` : 'Notifications'}
            title="Notifications"
            style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 36, height: 36, borderRadius: 10, color: unread ? 'var(--secondary)' : 'var(--muted)', background: unread ? 'rgba(37,99,235,.08)' : 'transparent' }}
          >
            <Bell size={19} />
            {unread > 0 && <span style={{ position: 'absolute', top: -3, right: -3, minWidth: 17, height: 17, padding: '0 4px', borderRadius: 99, display: 'grid', placeItems: 'center', color: '#fff', background: 'var(--error)', fontSize: 10, fontWeight: 800 }}>{unread > 99 ? '99+' : unread}</span>}
          </Link>
          <Link to="/" style={{ fontSize: 12, fontWeight: 600, color: 'var(--secondary)' }}>View site</Link>
        </header>
        <main className="dashboard-content__main"><Outlet /></main>
      </div>
      <AssistantWidget />
    </div>
  );
}
