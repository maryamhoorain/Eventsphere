import { useEffect, useMemo, useState } from 'react';
import { endpoints } from '../../api/client';
import { useSession } from '../../store/session';

function MetricBar({ label, value, max, color }) {
  const percent = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="analytics-bar">
      <div><span>{label}</span><strong>{value}</strong></div>
      <div className="analytics-bar__track"><i style={{ width: `${percent}%`, background: color }} /></div>
    </div>
  );
}

export default function Analytics() {
  const role = useSession((s) => s.user?.role);
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState('');
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (role === 'admin' ? endpoints.events.list() : endpoints.events.manage())
      .then((data) => {
        const rows = data.events || [];
        setEvents(rows);
        setEventId(rows[0]?._id || rows[0]?.id || '');
      })
      .catch((err) => setError(err.message || 'Unable to load events.'));
  }, [role]);

  useEffect(() => {
    if (!eventId) { setLoading(false); return undefined; }
    let active = true;
    setLoading(true);
    endpoints.analytics.eventOverview(eventId)
      .then((data) => { if (active) setOverview(data.overview || data); })
      .catch((err) => { if (active) setError(err.message || 'Unable to load analytics.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [eventId]);

  const metrics = useMemo(() => ({
    registrations: overview?.registrations?.total || 0,
    exhibitors: overview?.exhibitors?.approved || 0,
    booths: overview?.booths?.total || 0,
    visitors: overview?.visitors?.uniqueVisitors || 0,
    feedback: overview?.feedback?.total || 0,
  }), [overview]);
  const max = Math.max(...Object.values(metrics), 1);

  return (
    <div>
      <div className="dashboard-page-heading">
        <div><h1>Analytics</h1><p>Live reports from your EventSphere REST API.</p></div>
        <select className="input-light analytics-event-select" value={eventId} onChange={(e) => setEventId(e.target.value)}>
          {events.map((event) => <option key={event._id || event.id} value={event._id || event.id}>{event.title}</option>)}
        </select>
      </div>
      {error && <p style={{ color: 'var(--error)', fontSize: 13 }}>{error}</p>}
      {loading ? <div className="panel"><p style={{ color: 'var(--muted)' }}>Loading live report…</p></div> : (
        <>
          <div className="grid-kpi analytics-kpis">
            <div className="kpi"><div className="label">Registrations</div><div className="value">{metrics.registrations}</div></div>
            <div className="kpi"><div className="label">Approved exhibitors</div><div className="value">{metrics.exhibitors}</div></div>
            <div className="kpi"><div className="label">Booths</div><div className="value">{metrics.booths}</div></div>
            <div className="kpi"><div className="label">Unique visitors</div><div className="value">{metrics.visitors}</div></div>
          </div>
          <div className="panel analytics-report">
            <h2>Event performance</h2>
            <MetricBar label="Registrations" value={metrics.registrations} max={max} color="#2563eb" />
            <MetricBar label="Approved exhibitors" value={metrics.exhibitors} max={max} color="#38bdf8" />
            <MetricBar label="Booth inventory" value={metrics.booths} max={max} color="#8b5cf6" />
            <MetricBar label="Unique visitors" value={metrics.visitors} max={max} color="#10b981" />
            <MetricBar label="Feedback submitted" value={metrics.feedback} max={max} color="#f59e0b" />
          </div>
        </>
      )}
    </div>
  );
}
