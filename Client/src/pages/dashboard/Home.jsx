import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowUpRight, Building2, CalendarDays, CheckCircle2, ShieldCheck, Users, Zap } from 'lucide-react';
import { StatusPill } from '../../components/common/StatusPill';
import { useOps } from '../../store/ops';
import { useSession } from '../../store/session';
import OrganizerDashboard from './OrganizerDashboard';
import { endpoints } from '../../api/client';

function AdminBarChart({ values }) {
  const safeValues = values.length ? values : [{ label: 'No data', value: 0, color: '#cbd5e1' }];
  const max = Math.max(...safeValues.map((item) => item.value), 1);
  return <div className="home-chart"><div className="home-chart__grid"><span /><span /><span /><span /></div><div className="home-chart__bars">{safeValues.map((item) => <div className="home-chart__bar-wrap" key={item.label}><strong>{item.value}</strong><div className="home-chart__bar" style={{ height: `${Math.max(8, (item.value / max) * 100)}%`, background: item.color }} /><span>{item.label}</span></div>)}</div></div>;
}

const chartColors = ['#2563eb', '#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e'];
const chartValues = (rows = []) => rows.map((row, index) => ({
  label: String(row.label || 'Unknown').replace(/_/g, ' '),
  value: Number(row.value || 0),
  color: chartColors[index % chartColors.length],
}));

function AdminRing({ published, total }) {
  const percent = total ? Math.round((published / total) * 100) : 0;
  return <div className="home-ring-wrap"><div className="home-ring" style={{ background: `conic-gradient(#38bdf8 ${percent}%, #e2e8f0 0)` }}><div><strong>{percent}%</strong><span>published</span></div></div></div>;
}

export default function DashboardHome() {
  const user = useSession((s) => s.user);
  const listUsers = useSession((s) => s.listUsers);
  const events = useOps((s) => s.events);
  const registrations = useOps((s) => s.registrations);
  const applications = useOps((s) => s.applications);
  const exhibitorApplies = useOps((s) => s.exhibitorApplies);
  const sessionRegs = useOps((s) => s.sessionRegs);
  const boothVisits = useOps((s) => s.boothVisits);
  const role = user?.role;
  const [dashboard, setDashboard] = useState(null);
  const [dashboardError, setDashboardError] = useState('');
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    if (!role) return undefined;
    const loader = role === 'admin' ? endpoints.dashboard.admin
      : role === 'exhibitor' ? endpoints.dashboard.exhibitor
        : role === 'attendee' ? endpoints.dashboard.attendee : null;
    if (!loader) return undefined;
    let active = true;
    loader().then((data) => {
      if (active) setDashboard(data);
    }).catch((error) => {
      if (active) setDashboardError(error.message || 'Unable to load dashboard data.');
    });
    if (role === 'admin') {
      endpoints.chat.contacts().then((data) => {
        if (active) setUserCount((data.contacts || []).length + 1);
      }).catch((error) => {
        if (active && !dashboardError) setDashboardError(error.message || 'Unable to load users.');
      });
    }
    return () => { active = false; };
  }, [role]);

  if (role === 'attendee') {
    return (
      <div>
        <h1 style={{ margin: 0, fontSize: 22 }}>Welcome, {user.name.split(' ')[0]}</h1>
        <p style={{ color: 'var(--muted)', marginTop: 4 }}>Your EventSphere attendee hub</p>
        <div className="grid-kpi" style={{ marginTop: 20 }}>
          <div className="kpi"><div className="label">Registrations</div><div className="value">{dashboard?.statistics?.totalRegistrations ?? registrations.filter((r) => r.email === user.email).length}</div></div>
          <div className="kpi"><div className="label">Upcoming events</div><div className="value">{dashboard?.statistics?.upcomingEvents ?? registrations.filter((r) => r.email === user.email).length}</div></div>
          <div className="kpi"><div className="label">Booth visits</div><div className="value">{boothVisits.filter((v) => v.attendeeId === user.id).length}</div></div>
        </div>
        <div className="panel" style={{ marginTop: 20 }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>Grow with EventSphere</h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>Turn your attendee account into a business presence or run your own events.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <Link className="btn btn-primary btn-sm" to="/register/exhibitor"><Building2 size={15} /> Register as Exhibitor</Link>
            <Link className="btn btn-sm" to="/register/organizer"><ShieldCheck size={15} /> Register as Organizer</Link>
          </div>
        </div>
      </div>
    );
  }

  if (role === 'exhibitor') {
    const mine = applications.filter((a) => a.exhibitorId === user.id);
    return (
      <div>
        <h1 style={{ margin: 0, fontSize: 22 }}>Welcome, {user.name.split(' ')[0]}</h1>
        <p style={{ color: 'var(--muted)', marginTop: 4 }}>Your live exhibitor dashboard</p>
        <div className="grid-kpi" style={{ marginTop: 20 }}>
          <div className="kpi"><div className="label">Applications</div><div className="value">{dashboard?.statistics?.totalApplications ?? mine.length}</div></div>
          <div className="kpi"><div className="label">Pending</div><div className="value">{dashboard?.statistics?.pendingApplications ?? mine.filter((a) => a.status === 'pending').length}</div></div>
          <div className="kpi"><div className="label">Approved</div><div className="value">{dashboard?.statistics?.approvedApplications ?? mine.filter((a) => a.status === 'approved').length}</div></div>
        </div>
        <div className="panel" style={{ marginTop: 20 }}>
          <h2 style={{ fontSize: 14, margin: '0 0 12px' }}>Your applications</h2>
          <table className="table"><thead><tr><th>Company</th><th>Event</th><th>Status</th></tr></thead>
            <tbody>{mine.map((a) => <tr key={a.id}><td>{a.companyName}</td><td>{a.eventTitle}</td><td><StatusPill status={a.status} /></td></tr>)}</tbody>
          </table>
        </div>
      </div>
    );
  }

  if (role === 'organizer') {
    return <OrganizerDashboard />;
  }

  const users = listUsers();
  const stats = dashboard?.statistics || {};
  const metrics = {
    users: stats.totalUsers || userCount || users.length,
    events: stats.totalEvents ?? events.length,
    published: stats.publishedEvents ?? events.filter((e) => e.status === 'published').length,
    registrations: stats.totalRegistrations ?? registrations.filter((r) => r.status === 'registered').length,
    pending: stats.pendingApplications ?? applications.filter((a) => a.status === 'pending').length + exhibitorApplies.filter((a) => a.status === 'pending').length,
    upcoming: stats.upcomingEvents ?? 0,
    attendees: stats.totalAttendees ?? 0,
    exhibitors: stats.totalExhibitors ?? 0,
    sessions: stats.totalSessions ?? 0,
    booths: stats.totalBooths ?? 0,
    visits: stats.totalBoothVisits ?? 0,
    feedback: stats.totalFeedback ?? 0,
    rating: stats.averageRating ?? '0.00',
  };
  const charts = dashboard?.charts || {};
  return (
    <div>
      <div className="dashboard-welcome"><div><div className="dashboard-welcome__eyebrow"><Zap size={14} /> Platform pulse</div><h1>Welcome, {user?.name?.split(' ')[0]}</h1><p>Here’s what’s happening across EventSphere today.</p></div><div className="dashboard-welcome__date"><CalendarDays size={16} /> Live overview</div></div>
      {dashboardError && <p style={{ color: 'var(--error)', fontSize: 13 }}>{dashboardError}</p>}
      <div className="grid-kpi home-admin-kpis">
        <div className="kpi home-stat home-stat--blue"><div className="home-stat__icon"><Users size={17} /></div><div className="label">Total users</div><div className="value">{metrics.users}</div><span><Activity size={12} /> Active community</span></div>
        <div className="kpi home-stat home-stat--violet"><div className="home-stat__icon"><CalendarDays size={17} /></div><div className="label">Total events</div><div className="value">{metrics.events}</div><span><ArrowUpRight size={12} /> {metrics.upcoming} upcoming</span></div>
        <div className="kpi home-stat home-stat--green"><div className="home-stat__icon"><CheckCircle2 size={17} /></div><div className="label">Registrations</div><div className="value">{metrics.registrations}</div><span><Activity size={12} /> Attendee demand</span></div>
        <div className="kpi home-stat home-stat--amber"><div className="home-stat__icon"><Building2 size={17} /></div><div className="label">Pending apps</div><div className="value">{metrics.pending}</div><span><Activity size={12} /> Need review</span></div>
      </div>
      <div className="home-dashboard-grid">
        <section className="panel home-visual-card"><div className="home-section-heading"><div><span className="home-section-kicker">Performance</span><h2>Platform activity</h2></div><span className="home-live-dot">Live</span></div><AdminBarChart values={[{ label: 'Users', value: metrics.users, color: '#2563eb' }, { label: 'Events', value: metrics.events, color: '#7c3aed' }, { label: 'Published', value: metrics.published, color: '#06b6d4' }, { label: 'Registrations', value: metrics.registrations, color: '#10b981' }, { label: 'Pending', value: metrics.pending, color: '#f59e0b' }]} /></section>
        <section className="panel home-visual-card home-health-card"><div className="home-section-heading"><div><span className="home-section-kicker">Event health</span><h2>Publishing progress</h2></div><CheckCircle2 size={19} color="#10b981" /></div><div className="home-health-content"><AdminRing published={metrics.published} total={metrics.events} /><div className="home-health-list"><div><span className="home-health-dot home-health-dot--blue" /> Published <strong>{metrics.published}</strong></div><div><span className="home-health-dot home-health-dot--gray" /> Draft / other <strong>{Math.max(0, metrics.events - metrics.published)}</strong></div><div><span className="home-health-dot home-health-dot--green" /> Attendees <strong>{metrics.attendees}</strong></div><div><span className="home-health-dot home-health-dot--violet" /> Exhibitors <strong>{metrics.exhibitors}</strong></div></div></div></section>
      </div>
      <div className="home-dashboard-grid" style={{ marginTop: 20 }}>
        <section className="panel home-visual-card"><div className="home-section-heading"><div><span className="home-section-kicker">Users</span><h2>Community by role</h2></div></div><AdminBarChart values={chartValues(charts.usersByRole)} /></section>
        <section className="panel home-visual-card"><div className="home-section-heading"><div><span className="home-section-kicker">Events</span><h2>Event status</h2></div></div><AdminBarChart values={chartValues(charts.eventsByStatus)} /></section>
      </div>
      <div className="home-dashboard-grid" style={{ marginTop: 20 }}>
        <section className="panel home-visual-card"><div className="home-section-heading"><div><span className="home-section-kicker">Operations</span><h2>Registrations and applications</h2></div></div><AdminBarChart values={chartValues([...(charts.registrationsByStatus || []), ...(charts.applicationsByStatus || [])])} /></section>
        <section className="panel home-visual-card"><div className="home-section-heading"><div><span className="home-section-kicker">Inventory</span><h2>Booths by status</h2></div></div><AdminBarChart values={chartValues(charts.boothsByStatus)} /></section>
      </div>
      <section className="panel home-quick-panel" style={{ marginTop: 20 }}><div className="home-section-heading"><div><span className="home-section-kicker">Platform totals</span><h2>All live data</h2></div></div><div className="grid-kpi"><div className="kpi"><div className="label">Sessions</div><div className="value">{metrics.sessions}</div></div><div className="kpi"><div className="label">Booths</div><div className="value">{metrics.booths}</div></div><div className="kpi"><div className="label">Booth visits</div><div className="value">{metrics.visits}</div></div><div className="kpi"><div className="label">Feedback</div><div className="value">{metrics.feedback}</div></div><div className="kpi"><div className="label">Average rating</div><div className="value">{metrics.rating}</div></div></div></section>
      <section className="panel home-quick-panel"><div className="home-section-heading"><div><span className="home-section-kicker">Quick actions</span><h2>Keep the platform moving</h2></div></div><div className="home-quick-actions"><Link to="/dashboard/events"><CalendarDays size={17} /><span>Manage events</span><ArrowUpRight size={15} /></Link><Link to="/dashboard/users"><Users size={17} /><span>View users</span><ArrowUpRight size={15} /></Link><Link to="/dashboard/booth-requests"><Building2 size={17} /><span>Review booth requests</span><ArrowUpRight size={15} /></Link><Link to="/dashboard/analytics"><Activity size={17} /><span>Open analytics</span><ArrowUpRight size={15} /></Link></div></section>
    </div>
  );
}
