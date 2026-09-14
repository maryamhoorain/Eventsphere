import { toast } from 'sonner';
import { StatusPill } from '../../components/common/StatusPill';
import { useEffect, useState } from 'react';
import { endpoints } from '../../api/client';
import { useOps } from '../../store/ops';
import { useSession } from '../../store/session';

export default function Registrations() {
  const user = useSession((s) => s.user);
  const role = user?.role;
  const registrations = useOps((s) => s.registrations);
  const cancelRegistration = useOps((s) => s.cancelRegistration);
  const [ownedEventIds, setOwnedEventIds] = useState(null);
  useEffect(() => {
    if (role !== 'organizer') return undefined;
    let active = true;
    endpoints.events.manage().then((data) => {
      if (active) setOwnedEventIds(new Set((data.events || []).map((event) => event._id || event.id)));
    }).catch(() => { if (active) setOwnedEventIds(new Set()); });
    return () => { active = false; };
  }, [role]);
  const rows = role === 'attendee'
    ? registrations.filter((r) => r.email === user.email)
    : role === 'organizer'
      ? registrations.filter((r) => ownedEventIds?.has(r.eventId))
      : registrations;
  return (
    <div>
      <h1 style={{ margin: 0, fontSize: 22 }}>Registrations</h1>
      <div className="panel" style={{ marginTop: 16 }}>
        <table className="table">
          <thead><tr><th>Attendee</th><th>Event</th><th>Ticket</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.attendeeName}</td>
                <td>{r.eventTitle}</td>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.ticketCode}</td>
                <td><StatusPill status={r.status} /></td>
                <td>{role === 'attendee' && r.status === 'registered' && (
                  <button type="button" style={{ background: 'none', border: 'none', color: 'var(--error)', fontSize: 12, fontWeight: 600 }} onClick={() => { cancelRegistration(r.id); toast.message('Cancelled'); }}>Cancel</button>
                )}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
