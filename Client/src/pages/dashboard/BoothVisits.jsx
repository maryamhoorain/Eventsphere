import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { endpoints } from '../../api/client';
import { useOps } from '../../store/ops';
import { useSession } from '../../store/session';

export default function BoothVisits() {
  const user = useSession((s) => s.user);
  const role = user?.role;
  const booths = useOps((s) => s.booths);
  const events = useOps((s) => s.events);
  const boothVisits = useOps((s) => s.boothVisits);
  const feedback = useOps((s) => s.feedback);
  const createFeedback = useOps((s) => s.createFeedback);
  const [ownedEventIds, setOwnedEventIds] = useState(null);
  useEffect(() => {
    if (role !== 'organizer') return undefined;
    let active = true;
    endpoints.events.manage().then((data) => {
      if (active) setOwnedEventIds(new Set((data.events || []).map((event) => event._id || event.id)));
    }).catch(() => { if (active) setOwnedEventIds(new Set()); });
    return () => { active = false; };
  }, [role]);
  const mineBooths = role === 'exhibitor' ? booths.filter((b) => b.exhibitorId === user.id || b.exhibitor === user.companyName) : booths;
  const visibleBooths = role === 'organizer'
    ? booths.filter((booth) => ownedEventIds?.has(booth.eventId || booth.event?._id || booth.event?.id))
    : booths;
  const [managedVisits, setManagedVisits] = useState([]);
  const databaseVisits = ['admin', 'organizer', 'exhibitor'].includes(role) ? managedVisits : boothVisits;
  const visits = useMemo(() => role === 'attendee'
    ? databaseVisits.filter((v) => v.attendeeId === user.id)
    : databaseVisits, [role, databaseVisits, user?.id]);
  const [boothId, setBoothId] = useState(mineBooths[0]?.id || '');
  const [code, setCode] = useState('');
  const [rateId, setRateId] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  useEffect(() => {
    if (!['admin', 'organizer', 'exhibitor'].includes(role)) return undefined;
    let active = true;
    endpoints.boothVisits.managed()
      .then((response) => { if (active) setManagedVisits(response?.visits || []); })
      .catch(() => { if (active) setManagedVisits([]); });
    return () => { active = false; };
  }, [role]);
  return (
    <div>
      <h1 style={{ margin: 0, fontSize: 22 }}>Booth visits</h1>
      <p style={{ color: 'var(--muted)', fontSize: 13 }}>Track visitors, booth traffic, and feedback.</p>
      {role === 'exhibitor' && (
        <div className="panel" style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 14, margin: '0 0 12px' }}>Record a visit</h2>
          <form style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }} onSubmit={(e) => {
            e.preventDefault();
            endpoints.boothVisits.record(boothId, code)
              .then((response) => { toast.success(`Visit recorded for ${response.visit?.attendee?.name || 'attendee'}`); setCode(''); setManagedVisits((current) => [response.visit, ...current]); })
              .catch((error) => toast.error(error.message || 'Unable to record visit.'));
          }}>
            <select className="input-light" style={{ width: 'auto' }} value={boothId} onChange={(e) => setBoothId(e.target.value)}>
              {mineBooths.map((b) => <option key={b.id} value={b.id}>{b.boothNumber}</option>)}
            </select>
            <input className="input-light" style={{ flex: 1, minWidth: 160 }} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ticket code" />
            <button type="submit" className="btn btn-primary btn-sm">Record</button>
          </form>
        </div>
      )}
      <div className="panel" style={{ marginTop: 16 }}>
        <table className="table">
          <thead><tr><th>Attendee</th><th>Booth</th><th>Event</th><th>When</th><th></th></tr></thead>
          <tbody>
            {visits.map((v) => {
              const visitId = v._id || v.id;
              const existing = feedback.find((f) => f.boothVisitId === visitId);
              return (
                <tr key={visitId}>
                  <td>{v.attendee?.name || v.attendeeName}</td>
                  <td>{v.booth?.boothNumber || visibleBooths.find((b) => b.id === v.boothId)?.boothNumber}</td>
                  <td>{v.event?.title || events.find((e) => e.id === v.eventId)?.title}</td>
                  <td>{new Date(v.visitedAt).toLocaleString()}</td>
                  <td>
                    {role === 'attendee' && (existing ? `★ ${existing.rating}` : (
                      <button type="button" style={{ background: 'none', border: 'none', color: 'var(--secondary)', fontSize: 12, fontWeight: 600 }} onClick={() => setRateId(visitId)}>Feedback</button>
                    ))}
                    {role !== 'attendee' && <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v.ticketCode}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rateId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'grid', placeItems: 'center', zIndex: 50, padding: 16 }}>
          <form className="panel" style={{ width: '100%', maxWidth: 400 }} onSubmit={(e) => {
            e.preventDefault();
            const res = createFeedback({ userId: user.id, boothVisitId: rateId, rating, comment });
            if (!res.ok) toast.error(res.error); else { toast.success('Thanks!'); setRateId(null); }
          }}>
            <h3 style={{ margin: 0 }}>Booth feedback</h3>
            <label style={{ display: 'block', marginTop: 12, fontSize: 13 }}>Rating: {rating}</label>
            <input type="range" min={1} max={5} value={rating} onChange={(e) => setRating(Number(e.target.value))} style={{ width: '100%' }} />
            <textarea className="input-light" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Comment" style={{ marginTop: 8, height: 72, paddingTop: 8 }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button type="button" className="btn btn-sm" onClick={() => setRateId(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm">Submit</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
