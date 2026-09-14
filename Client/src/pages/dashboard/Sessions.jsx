import { useEffect, useMemo, useState } from 'react';
import { endpoints } from '../../api/client';
import { toast } from 'sonner';
import { StatusPill } from '../../components/common/StatusPill';
import { useOps } from '../../store/ops';
import { useSession } from '../../store/session';

export default function Sessions() {
  const user = useSession((s) => s.user);
  const role = user?.role;
  const seedEvents = useOps((s) => s.events);
  const talkSessions = useOps((s) => s.talkSessions);
  const sessionRegs = useOps((s) => s.sessionRegs);
  const deleteTalkSession = useOps((s) => s.deleteTalkSession);
  const registerSession = useOps((s) => s.registerSession);
  const cancelSession = useOps((s) => s.cancelSession);
  const [ownedEventIds, setOwnedEventIds] = useState(null);
  const [events, setEvents] = useState([]);
  const [serverSessions, setServerSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionEventId, setSessionEventId] = useState('');
  const today = new Date().toISOString().slice(0, 10);
  useEffect(() => {
    if (!role) return undefined;
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const eventResponse = role === 'admin' || role === 'organizer'
          ? await endpoints.events.manage()
          : { events: seedEvents };
        const eventRows = eventResponse?.events || [];
        const eventIds = new Set(eventRows.map((event) => event._id || event.id));
        const sessionResults = await Promise.all(
          eventRows.map((event) => endpoints.sessions.forEvent(event._id || event.id).catch(() => ({ sessions: [] }))),
        );
        const rows = sessionResults.flatMap((result, index) => (result?.sessions || []).map((session) => ({
          ...session,
          event: session.event || eventRows[index],
          eventId: session.event?._id || session.event || eventRows[index]?._id || eventRows[index]?.id,
        })));
        if (active) {
          setEvents(eventRows);
          setOwnedEventIds(eventIds);
          setServerSessions(rows);
        }
      } catch (err) {
        if (active) setError(err.message || 'Unable to load events and sessions.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [role, seedEvents]);
  const visibleSessions = useMemo(() => ['admin', 'organizer'].includes(role)
    ? serverSessions
    : talkSessions, [role, talkSessions, serverSessions]);
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>Sessions</h1>
          <p style={{ color: 'var(--muted)', margin: '4px 0 0', fontSize: 13 }}>Plan sessions and manage attendee registrations.</p>
        </div>
        {role === 'admin' && <button type="button" className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>New session</button>}
      </div>
      <div className="panel">
        <table className="table">
          <thead><tr><th>Title</th><th>Event</th><th>When</th><th>Room</th><th></th></tr></thead>
          <tbody>
            {visibleSessions.map((s) => {
              const sessionId = s._id || s.id;
              const eventId = s.event?._id || s.event?.id || s.eventId;
              const ev = events.find((e) => (e._id || e.id) === eventId);
              const mine = sessionRegs.find((r) => (r.session?._id || r.session || r.sessionId) === sessionId && r.attendeeId === user?.id && r.status === 'registered');
              return (
                <tr key={sessionId}>
                  <td>{s.title}</td><td>{ev?.title}</td><td>{s.date} {s.startTime}</td><td>{s.location}</td>
                  <td>
                    {role === 'admin' && <button type="button" style={{ background: 'none', border: 'none', color: 'var(--error)', fontSize: 12, fontWeight: 600 }} onClick={async () => { await endpoints.sessions.remove(sessionId); setServerSessions((current) => current.filter((item) => (item._id || item.id) !== sessionId)); toast.success('Session deleted.'); }}>Delete</button>}
                    {role === 'attendee' && (mine
                      ? <button type="button" style={{ background: 'none', border: 'none', color: 'var(--error)', fontSize: 12, fontWeight: 600 }} onClick={() => cancelSession(mine.id)}>Cancel</button>
                      : <button type="button" style={{ background: 'none', border: 'none', color: 'var(--secondary)', fontSize: 12, fontWeight: 600 }} onClick={() => { const r = registerSession(user.id, sessionId); if (!r.ok) toast.error(r.error); else toast.success('Registered'); }}>Register</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {role === 'attendee' && (
        <div className="panel" style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 14, margin: '0 0 12px' }}>My session tickets</h2>
          <table className="table">
            <thead><tr><th>Session</th><th>Status</th></tr></thead>
            <tbody>
              {sessionRegs.filter((r) => r.attendeeId === user.id).map((r) => (
                <tr key={r.id}><td>{talkSessions.find((s) => s.id === r.sessionId)?.title}</td><td><StatusPill status={r.status} /></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'grid', placeItems: 'center', zIndex: 50, padding: 16 }}>
          <form className="panel dashboard-form-modal dashboard-form-modal--session" onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            try {
              const response = await endpoints.sessions.create(fd.get('eventId'), { title: fd.get('title'), topic: fd.get('topic'), speaker: { name: fd.get('speaker') }, date: fd.get('date'), startTime: fd.get('startTime'), endTime: fd.get('endTime'), location: fd.get('location'), capacity: Number(fd.get('capacity') || 100) });
              const event = events.find((item) => (item._id || item.id) === fd.get('eventId'));
              setServerSessions((current) => [{ ...response.session, event }, ...current]);
              toast.success('Session created');
              setOpen(false);
            } catch (error) {
              toast.error(error.message || 'Unable to create session.');
            }
          }}>
            <div className="dashboard-form-modal__header"><div><span className="dashboard-form-modal__eyebrow">Schedule setup</span><h3>Create session</h3><p>Add a talk or workshop to one of your events.</p></div><button type="button" className="dashboard-form-modal__close" onClick={() => setOpen(false)} aria-label="Close">×</button></div>
            <div className="dashboard-form-grid">
            <label className="dashboard-form-field dashboard-form-field--wide">Event<select className="input-light" name="eventId" required value={sessionEventId} onChange={(event) => setSessionEventId(event.target.value)}>
              <option value="" disabled>Select an event</option>
              {events.map((ev) => <option key={ev._id || ev.id} value={ev._id || ev.id}>{ev.title}</option>)}
            </select></label>
            <label className="dashboard-form-field dashboard-form-field--wide">Title<input className="input-light" name="title" required placeholder="Session title" /></label>
            <label className="dashboard-form-field">Topic<input className="input-light" name="topic" required placeholder="e.g. AI and innovation" /></label>
            <label className="dashboard-form-field">Speaker<input className="input-light" name="speaker" required placeholder="Speaker name" /></label>
            {(() => {
              const selectedEvent = events.find((event) => (event._id || event.id) === sessionEventId);
              const eventStart = selectedEvent?.startDate ? new Date(selectedEvent.startDate).toISOString().slice(0, 10) : today;
              const eventEnd = selectedEvent?.endDate ? new Date(selectedEvent.endDate).toISOString().slice(0, 10) : undefined;
              return <label className="dashboard-form-field">Date<input className="input-light" name="date" type="date" min={eventStart > today ? eventStart : today} max={eventEnd} required /></label>;
            })()}
            <label className="dashboard-form-field">Start time<input className="input-light" name="startTime" type="time" required /></label>
            <label className="dashboard-form-field">End time<input className="input-light" name="endTime" type="time" required /></label>
            <label className="dashboard-form-field dashboard-form-field--wide">Room<input className="input-light" name="location" placeholder="Main hall or room" /></label>
            </div>
            <div className="dashboard-form-modal__actions">
              <button type="button" className="btn btn-sm" onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
