import { useEffect, useState } from 'react';
import { endpoints } from '../../api/client';
import { useOps } from '../../store/ops';
import { useSession } from '../../store/session';

export default function Feedback() {
  const user = useSession((s) => s.user);
  const feedback = useOps((s) => s.feedback);
  const [ownedEventIds, setOwnedEventIds] = useState(null);
  useEffect(() => {
    if (user?.role !== 'organizer') return undefined;
    let active = true;
    endpoints.events.manage().then((data) => {
      if (active) setOwnedEventIds(new Set((data.events || []).map((event) => event._id || event.id)));
    }).catch(() => { if (active) setOwnedEventIds(new Set()); });
    return () => { active = false; };
  }, [user?.role]);
  const rows = user?.role === 'attendee'
    ? feedback.filter((f) => f.userId === user.id)
    : user?.role === 'organizer'
      ? feedback.filter((f) => ownedEventIds?.has(f.eventId))
      : feedback;
  const booths = useOps((s) => s.booths);
  const events = useOps((s) => s.events);
  return (
    <div>
      <h1 style={{ margin: 0, fontSize: 22 }}>Feedback</h1>
      <div className="panel" style={{ marginTop: 16 }}>
        {rows.length === 0 ? <p style={{ color: 'var(--muted)' }}>No feedback yet.</p> : (
          <table className="table">
            <thead><tr><th>Event</th><th>Booth</th><th>Rating</th><th>Comment</th></tr></thead>
            <tbody>{rows.map((f) => (
              <tr key={f.id}>
                <td>{events.find((e) => e.id === f.eventId)?.title}</td>
                <td>{booths.find((b) => b.id === f.boothId)?.boothNumber}</td>
                <td>★ {f.rating}</td>
                <td>{f.comment || '—'}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
