import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { endpoints } from '../../api/client';

export default function FavoritesList({ favorites = [], onChange }) {
  const events = favorites.filter((item) => item.event);
  const sessions = favorites.filter((item) => item.session);
  const remove = async (item) => {
    const id = item.event?._id || item.event?.id || item.session?._id || item.session?.id;
    try {
      if (item.event) await endpoints.favorites.removeEvent(id);
      else await endpoints.favorites.removeSession(id);
      onChange(favorites.filter((entry) => entry !== item));
      toast.success('Removed from favorites.');
    } catch (error) {
      toast.error(error.message || 'Unable to remove favorite.');
    }
  };
  const section = (title, rows, session) => (
    <section key={title} style={{ marginTop: 18 }}>
      <h2 style={{ fontSize: 16 }}>{title}</h2>
      {rows.length ? rows.map((item) => {
        const value = session ? item.session : item.event;
        const id = value?._id || value?.id;
        const eventId = session ? value?.event?._id || value?.event : id;
        return <div key={id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
          <Link to={session ? `/events/${eventId}` : `/events/${value?.slug || id}`}>{value?.title || 'Untitled'}</Link>
          <button type="button" className="btn btn-sm" onClick={() => remove(item)}>Remove</button>
        </div>;
      }) : <p style={{ color: 'var(--muted)' }}>No favorites yet.</p>}
    </section>
  );
  return <>{section('Favorite events', events, false)}{section('Favorite sessions', sessions, true)}</>;
}
