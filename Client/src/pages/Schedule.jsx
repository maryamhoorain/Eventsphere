import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PublicLayout } from '../components/layout/PublicLayout';
import { endpoints } from '../api/client';
import { useSession } from '../store/session';

export default function Schedule() {
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState('');
  const [favorites, setFavorites] = useState({});
  const user = useSession((s) => s.user);
  const navigate = useNavigate();
  const toggleFavorite = async (sessionId) => {
    if (!user) return navigate('/login');
    if (user.role !== 'attendee') return;
    const current = !!favorites[sessionId];
    try {
      if (current) await endpoints.favorites.removeSession(sessionId);
      else await endpoints.favorites.addSession(sessionId);
      setFavorites((items) => ({ ...items, [sessionId]: !current }));
    } catch (e) { toast.error(e.message || 'Unable to update favorite.'); }
  };
  useEffect(() => {
    endpoints.events.list().then(async (response) => {
      const events = response?.events || [];
      const rows = await Promise.all(events.map((event) => endpoints.sessions.forEvent(event._id || event.id)
        .then((result) => (result?.sessions || []).map((session) => ({ ...session, event })))
        .catch(() => [])));
      setSessions(rows.flat());
      if (user?.role === 'attendee') {
        const favoriteResponse = await endpoints.favorites.mine();
        const favoriteIds = Object.fromEntries(
          (favoriteResponse?.favorites || [])
            .filter((favorite) => favorite.session)
            .map((favorite) => [favorite.session._id || favorite.session.id || favorite.session, true]),
        );
        setFavorites(favoriteIds);
      }
    }).catch((e) => setError(e.message));
  }, [user?.role]);
  return (
    <PublicLayout>
      <div className="container" style={{ paddingTop: 112, paddingBottom: 64 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: '#fff' }}>Schedule</h1>
        <p style={{ color: 'rgba(255,255,255,0.55)' }}>Sessions across published events</p>
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {error && <p style={{ color: '#fb7185' }}>{error}</p>}
          {!error && !sessions.length && <p style={{ color: 'rgba(255,255,255,0.55)' }}>No sessions are available.</p>}
          {sessions.map((s) => {
            const ev = s.event;
            return (
              <Link to={`/events/${ev?._id || ev?.id}`} key={s._id || s.id} className="card schedule-card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ color: '#fff', fontWeight: 600 }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{ev?.title} · {s.topic}</div>
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{s.date} {s.startTime}–{s.endTime} · {s.location}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {user?.role === 'attendee' && <button type="button" className="btn btn-sm btn-ghost" onClick={(event) => { event.preventDefault(); toggleFavorite(s._id || s.id); }} aria-label="Toggle session favorite"><Heart size={15} fill={favorites[s._id || s.id] ? '#fb7185' : 'none'} color={favorites[s._id || s.id] ? '#fb7185' : 'currentColor'} /></button>}
                  <span className="btn btn-primary btn-sm">View & register</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </PublicLayout>
  );
}
