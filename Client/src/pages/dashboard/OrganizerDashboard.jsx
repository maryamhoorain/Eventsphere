import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Building2, CalendarRange, ClipboardList, MapPinned, ShieldCheck, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useSession } from '../../store/session';
import { StatusPill } from '../../components/common/StatusPill';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date);
}

export default function OrganizerDashboard() {
  const user = useSession((s) => s.user);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [events, setEvents] = useState([]);
  const [eventSummaries, setEventSummaries] = useState([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      if (user.role !== 'organizer') {
        navigate('/dashboard', { replace: true });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const allEventsResponse = await api('/api/events/manage');
        const allEvents = allEventsResponse?.events || [];

        const mine = allEvents.filter((event) => {
          const organizerId = event.organizer?._id || event.organizer;
          const current = organizerId && (typeof organizerId === 'string' ? organizerId : organizerId.toString());
          return current && user.id && current === user.id.toString();
        });

        setEvents(mine);

        const summaries = await Promise.all(
          mine.map(async (event) => {
            const [overviewResponse, registrationsResponse] = await Promise.all([
              api(`/api/analytics/events/${event._id}/overview`),
              api(`/api/registrations/event/${event._id}`),
            ]);

            return {
              event,
              overview: overviewResponse?.overview || null,
              registrations: registrationsResponse?.registrations || [],
            };
          }),
        );

        if (active) {
          setEventSummaries(summaries);
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Unable to load organizer dashboard data.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [user, navigate]);

  const totals = useMemo(() => {
    return eventSummaries.reduce(
      (acc, item) => {
        const overview = item.overview || {};
        acc.totalRegistrations += overview.registrations?.total || 0;
        acc.approvedExhibitors += overview.exhibitors?.approved || 0;
        acc.totalBooths += overview.booths?.total || 0;
        acc.uniqueVisitors += overview.visitors?.uniqueVisitors || 0;
        acc.feedbackCount += overview.feedback?.total || 0;
        return acc;
      },
      {
        totalRegistrations: 0,
        approvedExhibitors: 0,
        totalBooths: 0,
        uniqueVisitors: 0,
        feedbackCount: 0,
      },
    );
  }, [eventSummaries]);

  if (!user || !['organizer', 'admin'].includes(user.role)) {
    return (
      <div>
        <h1 style={{ margin: 0, fontSize: 22 }}>Organizer dashboard</h1>
        <div className="panel" style={{ marginTop: 16, maxWidth: 480 }}>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>
            This dashboard is available to organizers and administrator users only.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <h1 style={{ margin: 0, fontSize: 22 }}>Organizer dashboard</h1>
        <div className="panel" style={{ marginTop: 16, maxWidth: 560 }}>
          <p style={{ margin: 0, color: 'var(--muted)' }}>Loading organizer data…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 style={{ margin: 0, fontSize: 22 }}>Organizer dashboard</h1>
        <div className="panel" style={{ marginTop: 16, maxWidth: 560 }}>
          <p style={{ margin: 0, color: 'var(--error)' }}>{error}</p>
        </div>
      </div>
    );
  }

  const registrationRows = eventSummaries.flatMap(({ event, registrations }) =>
    (registrations || []).slice(0, 6).map((reg) => ({ eventTitle: event.title, ...reg })),
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>Organizer dashboard</h1>
          <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 13 }}>
            {user.name || 'Organizer'} • {user.companyName || 'Organization'}
          </p>
        </div>
        <Link to="/dashboard" className="btn btn-sm" style={{ background: '#fff', border: '1px solid var(--border)', color: 'var(--ink)' }}>
          Back to overview
        </Link>
      </div>

      <div className="grid-kpi" style={{ marginTop: 20 }}>
        <div className="kpi">
          <div className="label">My events</div>
          <div className="value">{events.length}</div>
        </div>
        <div className="kpi">
          <div className="label">Registrations</div>
          <div className="value">{totals.totalRegistrations}</div>
        </div>
        <div className="kpi">
          <div className="label">Approved exhibitors</div>
          <div className="value">{totals.approvedExhibitors}</div>
        </div>
        <div className="kpi">
          <div className="label">Unique visitors</div>
          <div className="value">{totals.uniqueVisitors}</div>
        </div>
      </div>

      {eventSummaries.length === 0 ? (
        <div className="panel" style={{ marginTop: 20 }}>
          <p style={{ margin: 0, color: 'var(--muted)' }}>You do not currently have any organizer-owned events in the system.</p>
        </div>
      ) : (
        <>
          <div className="panel" style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ fontSize: 14, margin: 0 }}>My events</h2>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Registrations</th>
                </tr>
              </thead>
              <tbody>
                {eventSummaries.map(({ event, overview }) => (
                  <tr key={event._id || event.id}>
                    <td>{event.title}</td>
                    <td>{event.category || '—'}</td>
                    <td>{formatDate(event.startDate)}{event.endDate ? ` – ${formatDate(event.endDate)}` : ''}</td>
                    <td><StatusPill status={event.status || 'draft'} /></td>
                    <td>{overview?.registrations?.total || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel" style={{ marginTop: 20 }}>
            <h2 style={{ fontSize: 14, margin: '0 0 12px' }}>Event performance</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {eventSummaries.map(({ event, overview }) => (
                <div key={event._id || event.id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{event.title}</div>
                    <StatusPill status={event.status || 'draft'} />
                  </div>
                  <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>Regs</div>
                      <div style={{ fontWeight: 700 }}>{overview?.registrations?.total || 0}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>Visitors</div>
                      <div style={{ fontWeight: 700 }}>{overview?.visitors?.uniqueVisitors || 0}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>Exhibitors</div>
                      <div style={{ fontWeight: 700 }}>{overview?.exhibitors?.approved || 0}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>Avg rating</div>
                      <div style={{ fontWeight: 700 }}>{overview?.feedback?.averageRating || 0}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel" style={{ marginTop: 20 }}>
            <h2 style={{ fontSize: 14, margin: '0 0 12px' }}>Recent registrations</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Attendee</th>
                  <th>Status</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {registrationRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ color: 'var(--muted)' }}>No registrations yet.</td>
                  </tr>
                ) : (
                  registrationRows.map((row, index) => (
                    <tr key={`${row.eventTitle}-${row._id || index}`}>
                      <td>{row.eventTitle}</td>
                      <td>{row.attendee?.name || '—'}</td>
                      <td><StatusPill status={row.status || 'registered'} /></td>
                      <td>{formatDate(row.registrationDate)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="panel" style={{ marginTop: 20 }}>
            <h2 style={{ fontSize: 14, margin: '0 0 12px' }}>Operational summary</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <div style={{ background: 'rgba(37,99,235,0.05)', borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)' }}><Users size={14} /> Exhibitors</div>
                <div style={{ fontWeight: 700, fontSize: 24, marginTop: 8 }}>{totals.approvedExhibitors}</div>
              </div>
              <div style={{ background: 'rgba(14,165,233,0.05)', borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)' }}><MapPinned size={14} /> Booths</div>
                <div style={{ fontWeight: 700, fontSize: 24, marginTop: 8 }}>{totals.totalBooths}</div>
              </div>
              <div style={{ background: 'rgba(16,185,129,0.05)', borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)' }}><ClipboardList size={14} /> Feedback</div>
                <div style={{ fontWeight: 700, fontSize: 24, marginTop: 8 }}>{totals.feedbackCount}</div>
              </div>
              <div style={{ background: 'rgba(234,179,8,0.06)', borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)' }}><BarChart3 size={14} /> Analytics</div>
                <div style={{ fontWeight: 700, fontSize: 24, marginTop: 8 }}>{eventSummaries.length}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
