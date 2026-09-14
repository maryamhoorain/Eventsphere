import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, Heart, MapPin, Ticket, Users } from 'lucide-react';
import { toast } from 'sonner';
import { PublicLayout } from '../components/layout/PublicLayout';
import BoothMap from '../components/events/BoothMap';
import { endpoints } from '../api/client';
import { useSession } from '../store/session';

export default function EventDetail() {
  const { slug } = useParams();
  const user = useSession((s) => s.user);
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [sessions, setSessions] = useState([]);
  const [sessionRegs, setSessionRegs] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [booths, setBooths] = useState([]);
  const [boothError, setBoothError] = useState('');
  const [fav, setFav] = useState(false);
  const [sessionFavorites, setSessionFavorites] = useState({});

  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true);
        setLoadError('');
        const eventResponse = await endpoints.events.get(slug);
        const loadedEvent = eventResponse?.event || eventResponse;
        setEvent(loadedEvent);

        const eventId = loadedEvent?._id || loadedEvent?.id;
        if (eventId) {
          const sessionsResponse = await endpoints.sessions.forEvent(eventId);
          setSessions(sessionsResponse?.sessions || []);
          if (user) {
            const [registrationsResponse, sessionRegsResponse] = await Promise.all([
              endpoints.registrations.mine(),
              endpoints.sessionRegistrations.mine(),
            ]);
            setRegistrations(registrationsResponse?.registrations || []);
            setSessionRegs(sessionRegsResponse?.registrations || []);
            if (user.role === 'attendee') {
              const [favoriteResponse, favoritesResponse] = await Promise.all([
                endpoints.favorites.checkEvent(eventId),
                endpoints.favorites.mine(),
              ]);
              setFav(!!favoriteResponse?.isFavorite);
              setSessionFavorites(Object.fromEntries(
                (favoritesResponse?.favorites || [])
                  .filter((favorite) => favorite.session)
                  .map((favorite) => [favorite.session._id || favorite.session.id || favorite.session, true]),
              ));
            }
          } else {
            setRegistrations([]);
            setSessionRegs([]);
          }

          if (user?.role === 'admin' || user?.role === 'organizer' || user?.role === 'exhibitor') {
            try {
              const boothResponse = user.role === 'exhibitor'
                ? await endpoints.booths.map(eventId)
                : await endpoints.booths.forEvent(eventId);
              setBooths(
                boothResponse?.booths
                || boothResponse?.floors?.flatMap((floor) => floor.booths || [])
                || [],
              );
            } catch (error) {
              setBoothError(error.message || 'Unable to load booth data.');
            }
          }
        }
      } catch (error) {
        setLoadError(error.message || 'Unable to load event details.');
      } finally {
        setLoading(false);
      }
    };

    if (slug) loadEvent();
  }, [slug, user?.role]);

  const eventId = event?._id || event?.id;
  const mine = useMemo(() => {
    if (!user || !eventId) return null;
    return registrations.find((r) => (r.event?._id || r.event || r.eventId) === eventId && r.status !== 'cancelled')
      || registrations.find((r) => (r.event?._id || r.event || r.eventId) === eventId);
  }, [registrations, eventId, user]);

  const toggleEventFavorite = async () => {
    if (!user) return navigate('/login');
    if (!eventId) return toast.error('Event is not ready yet. Please refresh and try again.');
    try {
      if (fav) await endpoints.favorites.removeEvent(eventId);
      else await endpoints.favorites.addEvent(eventId);
      setFav(!fav);
      toast.success(fav ? 'Removed from favorites.' : 'Event saved to favorites.');
    } catch (error) { toast.error(error.message || 'Unable to update favorite.'); }
  };

  const toggleSessionFavorite = async (sessionId) => {
    if (!user) return navigate('/login');
    const current = !!sessionFavorites[sessionId];
    try {
      if (current) await endpoints.favorites.removeSession(sessionId);
      else await endpoints.favorites.addSession(sessionId);
      setSessionFavorites((items) => ({ ...items, [sessionId]: !current }));
    } catch (error) { toast.error(error.message || 'Unable to update favorite.'); }
  };

  const openRegister = () => {
    if (!user) return navigate('/login');
    if (user.role !== 'attendee') {
      toast.error('Only attendees can register for events.');
      return;
    }
    setRegisterError('');
    setSelectedSessionId('');
    setRegisterOpen(true);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!eventId) {
      setRegisterError('No event selected.');
      return;
    }

    setRegisterLoading(true);
    setRegisterError('');

    try {
      const payload = {
        eventId,
        sessionIds: selectedSessionId ? [selectedSessionId] : [],
      };

      await endpoints.registrations.create(payload);
      const [reresponse, sessionResponse] = await Promise.all([
        endpoints.registrations.mine(),
        endpoints.sessionRegistrations.mine(),
      ]);
      setRegistrations(reresponse?.registrations || []);
      setSessionRegs(sessionResponse?.registrations || []);
      setRegisterOpen(false);
      setSelectedSessionId('');
      toast.success('Registration confirmed.');
    } catch (error) {
      setRegisterError(error.message || 'Unable to complete registration.');
    } finally {
      setRegisterLoading(false);
    }
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="container" style={{ paddingTop: 120, textAlign: 'center' }}>
          <h1 style={{ color: '#fff' }}>Loading event…</h1>
        </div>
      </PublicLayout>
    );
  }

  if (!event || loadError) {
    return (
      <PublicLayout>
        <div className="container" style={{ paddingTop: 120, textAlign: 'center' }}>
          <h1 style={{ color: '#fff' }}>{loadError || 'Event not found'}</h1>
          <Link to="/events" style={{ color: 'var(--accent)' }}>Back to events</Link>
        </div>
      </PublicLayout>
    );
  }

  const eventSessions = sessions.filter((s) => (s.event?._id || s.event || s.eventId) === eventId);
  const sessionMap = new Map((sessionRegs || []).map((r) => [(r.session?._id || r.session || r.sessionId), r]));

  return (
    <PublicLayout>
      <div style={{ position: 'relative', height: '42vh', minHeight: 260 }}>
        <img src={event.bannerImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #070b16, transparent)' }} />
        <div className="container" style={{ position: 'absolute', bottom: 24, left: 0, right: 0 }}>
          <span style={{ background: 'rgba(37,99,235,0.8)', borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>{event.category}</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, color: '#fff', margin: '12px 0 0' }}>{event.title}</h1>
        </div>
      </div>

      <div className="container" style={{ display: 'grid', gap: 32, gridTemplateColumns: '1.4fr 0.6fr', padding: '32px 16px 64px' }}>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>{event.description}</p>

          <div style={{ marginTop: 32 }}>
            <h2 style={{ color: '#fff', marginBottom: 12 }}>Sessions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {eventSessions.length ? eventSessions.map((session) => {
                const sessionId = session._id || session.id;
                const booked = !!sessionMap.get(sessionId);
                return (
                  <div key={sessionId} className="card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <div>
                      <div style={{ color: '#fff', fontWeight: 500 }}>{session.title}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                        {session.date ? new Date(session.date).toLocaleDateString() : ''} · {session.startTime}–{session.endTime} · {session.location || 'TBD'} · {session.speaker?.name || 'Speaker'}
                      </div>
                    </div>
                    {user?.role === 'attendee' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" className="btn btn-sm btn-ghost" onClick={() => toggleSessionFavorite(sessionId)} aria-label="Toggle session favorite"><Heart size={15} fill={sessionFavorites[sessionId] ? '#fb7185' : 'none'} color={sessionFavorites[sessionId] ? '#fb7185' : 'currentColor'} /></button>
                        <button type="button" disabled={booked} className="btn btn-sm btn-ghost" onClick={() => { setSelectedSessionId(sessionId); openRegister(); }}>{booked ? 'Registered' : 'Register'}</button>
                      </div>
                    )}
                  </div>
                );
              }) : <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Schedule coming soon.</p>}
            </div>
          </div>

          {(user?.role === 'admin' || user?.role === 'organizer' || user?.role === 'exhibitor') && (
            <div style={{ marginTop: 32 }}>
              <h2 style={{ color: '#fff', marginBottom: 12 }}>Booth map</h2>
              {boothError ? (
                <div className="card" style={{ padding: 18 }}>
                  <p style={{ margin: 0, color: '#fca5a5' }}>{boothError}</p>
                </div>
              ) : (
                <BoothMap booths={booths} eventTitle={event.title} />
              )}
              {user?.role === 'exhibitor' && (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ marginTop: 12 }}
                  onClick={() => navigate(`/dashboard/booths?eventId=${encodeURIComponent(eventId)}`)}
                >
                  Book a booth for this event
                </button>
              )}
            </div>
          )}
        </div>

        <aside className="card" style={{ padding: 20, height: 'fit-content' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><CalendarDays size={16} style={{ color: 'var(--accent)' }} />{new Date(event.startDate).toLocaleDateString()} – {new Date(event.endDate).toLocaleDateString()}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><MapPin size={16} style={{ color: 'var(--accent)' }} />{event.location?.venue || 'Venue'}, {event.location?.city || 'City'}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Users size={16} style={{ color: 'var(--accent)' }} />{event.capacity ? `Capacity ${event.capacity}` : 'Capacity not set'}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Ticket size={16} style={{ color: 'var(--accent)' }} />{event.ticketPrice ? `$${event.ticketPrice}` : 'Free'}</div>
          </div>

          {mine ? (
            <p style={{ marginTop: 20, background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', padding: 12, borderRadius: 12, fontSize: 14 }}>
              Registered · {mine.ticketCode || 'Ticket confirmed'}
            </p>
          ) : (
            <button type="button" className="btn btn-primary" style={{ width: '100%', marginTop: 20 }} onClick={openRegister}>
              Register for this event
            </button>
          )}

          <button type="button" style={{ marginTop: 12, background: 'none', border: 'none', color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center', fontSize: 13 }} onClick={toggleEventFavorite}>
            <Heart size={16} fill={fav ? '#fb7185' : 'none'} color={fav ? '#fb7185' : 'currentColor'} />
            Save to favorites
          </button>
        </aside>
      </div>

      {registerOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.7)', display: 'grid', placeItems: 'center', zIndex: 60, padding: 16 }}>
          <div className="card" style={{ width: '100%', maxWidth: 540, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
              <div>
                <h2 style={{ margin: 0, color: '#fff', fontFamily: 'var(--font-display)', fontSize: 28 }}>Register for event</h2>
                <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.65)' }}>{event.title}</p>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRegisterOpen(false)}>Close</button>
            </div>

            <form onSubmit={handleRegister} style={{ marginTop: 18, display: 'grid', gap: 16 }}>
              <div style={{ display: 'grid', gap: 8 }}>
                <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Event</label>
                <div className="input-light" style={{ display: 'flex', alignItems: 'center', minHeight: 42 }}>{event.title}</div>
              </div>

              <div style={{ display: 'grid', gap: 8 }}>
                <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Session</label>
                <select
                  className="input-light"
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                >
                  <option value="">No session selected</option>
                  {eventSessions.map((session) => (
                    <option key={session._id || session.id} value={session._id || session.id}>{session.title}</option>
                  ))}
                </select>
              </div>

              {registerError && (
                <div style={{ borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '10px 12px', fontSize: 13 }}>
                  {registerError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setRegisterOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={registerLoading}>{registerLoading ? 'Registering…' : 'Submit'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PublicLayout>
  );
}
