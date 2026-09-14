import { Link } from 'react-router-dom';
import { CalendarDays, MapPin } from 'lucide-react';
import { useSession } from '../../store/session';

export function EventCard({ event }) {
  const role = useSession((state) => state.user?.role);
  const eventId = event._id || event.id;
  const destination = role === 'exhibitor'
    ? `/dashboard/booths?eventId=${encodeURIComponent(eventId)}`
    : `/events/${eventId}`;
  return (
    <Link to={destination} className="card" style={{ display: 'flex', flexDirection: 'column', transition: 'transform 0.2s' }}>
      <div style={{ height: 160, overflow: 'hidden' }}>
        <img src={event.bannerImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)' }}>{event.category}</span>
        <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: '#fff' }}>{event.title}</h3>
        <div style={{ marginTop: 'auto', fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CalendarDays size={12} /> {new Date(event.startDate).toLocaleDateString()}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={12} /> {event.location?.city}, {event.location?.country}</span>
        </div>
      </div>
    </Link>
  );
}
