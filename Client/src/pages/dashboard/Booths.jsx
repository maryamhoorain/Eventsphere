import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { endpoints } from '../../api/client';
import BoothMap from '../../components/events/BoothMap';
import { useSession } from '../../store/session';

export default function Booths() {
  const user = useSession((s) => s.user);
  const [searchParams] = useSearchParams();
  const requestedEventId = searchParams.get('eventId') || '';
  const [booths, setBooths] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [floor, setFloor] = useState('Floor 1');
  const [requesting, setRequesting] = useState(false);
  const [selectedBooth, setSelectedBooth] = useState('');
  const [assignedBooths, setAssignedBooths] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      setError('');
      try {
        if (user.role === 'exhibitor') {
          const eventsResponse = await endpoints.events.list();
          const eventRows = eventsResponse?.events || [];
          setEvents(eventRows);
          setSelectedEvent((current) => current || requestedEventId || eventRows[0]?._id || eventRows[0]?.id || '');
          const response = await endpoints.booths.mine();
          const requestResponse = await endpoints.booths.myRequests();
          const mine = response?.booths || [];
          setPendingRequests(requestResponse?.requests || []);
          setAssignedBooths(mine);
          setBooths(mine);
        } else if (user.role === 'admin' || user.role === 'organizer') {
          const eventsResponse = await endpoints.events.manage();
          const events = eventsResponse?.events || [];
          setEvents(events);
          setSelectedEvent((current) => current || events[0]?._id || events[0]?.id || '');
          const firstEvent = events.find((event) => (event._id || event.id) === (requestedEventId || selectedEvent)) || events[0];
          if (!firstEvent) {
            setBooths([]);
            return;
          }
          const eventId = firstEvent._id || firstEvent.id;
          const response = await endpoints.booths.map(eventId);
          setBooths(response?.booths || response?.floors?.flatMap((item) => item.booths || []) || []);
        } else {
          setBooths([]);
        }
      } catch (err) {
        setError(err.message || 'Unable to load booth data.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.role, user?._id, user?.id, requestedEventId]);

  useEffect(() => {
    if (!['admin', 'organizer'].includes(user?.role) || !selectedEvent) return undefined;
    let active = true;
    endpoints.booths.map(selectedEvent).then((response) => {
      if (active) setBooths(response?.booths || response?.floors?.flatMap((item) => item.booths || []) || []);
    }).catch((err) => { if (active) setError(err.message || 'Unable to load booth map.'); });
    return () => { active = false; };
  }, [selectedEvent, user?.role]);

  useEffect(() => {
    if (user?.role !== 'exhibitor' || !selectedEvent) return undefined;
    let active = true;
    endpoints.booths.map(selectedEvent).then((response) => {
      if (!active) return;
      const requestedIds = new Set(
        pendingRequests
          .filter((request) => (request.event?._id || request.event?.id || request.event) === selectedEvent)
          .map((request) => request._id || request.id),
      );
      const mapped = (response?.booths || response?.floors?.flatMap((item) => item.booths || []) || [])
        .map((booth) => (requestedIds.has(booth._id || booth.id) ? { ...booth, status: 'pending' } : booth));
      setBooths(mapped);
      if (mapped.length && !mapped.some((booth) => {
        const value = String(booth.floor ?? '').toLowerCase();
        return value === '1' || value.includes('ground');
      })) {
        setFloor('First Floor');
      }
      setSelectedBooth((current) => current && mapped.some((booth) => (booth._id || booth.id) === current && booth.status === 'available') ? current : '');
    }).catch((err) => {
      if (active) setError(err.message || 'Unable to load available booths.');
    });
    return () => { active = false; };
  }, [selectedEvent, user?.role, assignedBooths, pendingRequests]);

  const requestBooth = async () => {
    if (!selectedEvent) return;
    setRequesting(true);
    try {
      if (!selectedBooth) {
        setError('Select an available booth on the floor map before requesting it.');
        return;
      }
      const booth = booths.find((item) => (item._id || item.id) === selectedBooth);
      await endpoints.booths.request(selectedBooth);
      setPendingRequests((current) => [...current, { _id: selectedBooth, event: { _id: selectedEvent }, status: 'pending' }]);
      setBooths((current) => current.map((item) => (
        (item._id || item.id) === selectedBooth ? { ...item, status: 'pending', exhibitor: user } : item
      )));
      setSelectedBooth('');
      toast.success(`Booth ${booth?.boothNumber || ''} requested for admin approval`);
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to request a booth.');
    } finally {
      setRequesting(false);
    }
  };

  const floors = useMemo(() => ['Ground Floor', 'First Floor'], []);
  const normalizedFloor = (booth) => {
    const value = String(booth.floor ?? '').trim().toLowerCase();
    return value === '2' || value.includes('first') || value.includes('second') ? 'First Floor' : 'Ground Floor';
  };
  const visibleBooths = booths.filter((booth) => normalizedFloor(booth) === floor);
  const selectedBoothDetails = booths.find((booth) => (booth._id || booth.id) === selectedBooth);
  const selectedEventDetails = events.find((event) => (event._id || event.id) === selectedEvent);
  const boothRows = useMemo(() => visibleBooths.map((booth) => ({
    key: booth._id || booth.id,
    label: booth.boothNumber || 'Booth',
    status: booth.status || 'available',
    size: booth.size || '—',
    location: booth.location || '—',
    price: booth.price ?? 0,
    exhibitor: booth.exhibitor?.name || booth.exhibitor || 'Unassigned',
    event: booth.event?.title || 'Event',
  })), [visibleBooths]);

  if (!user) {
    return <div className="card" style={{ padding: 24 }}><p style={{ margin: 0, color: 'rgba(255,255,255,0.7)' }}>Sign in to view booth information.</p></div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, color: 'var(--ink)' }}>Booth booking</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13 }}>Choose a booth from the live floor plan and send it for approval.</p>
        </div>
      </div>
      {user.role === 'exhibitor' && (
        <div className="card booth-request-card">
          <div><h2>Request a booth</h2><p>Select an available booth from the floor map and send your request for admin approval.</p></div>
          <select className="input-light" value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
            {events.map((event) => <option key={event._id || event.id} value={event._id || event.id}>{event.title}</option>)}
          </select>
          <button type="button" className="btn btn-primary btn-sm" onClick={requestBooth} disabled={requesting || !selectedEvent || !selectedBooth}>{requesting ? 'Requesting…' : 'Request selected booth'}</button>
          {selectedBoothDetails && (
            <div>
              <strong>Selected booth: {selectedBoothDetails.boothNumber}</strong>
              <span>
                {selectedEventDetails?.title || 'Event'} · {selectedBoothDetails.size || 'Size not listed'} · {selectedBoothDetails.location || 'Location not listed'} · ${selectedBoothDetails.price || 0} · {selectedBoothDetails.status || 'available'}
              </span>
              <button type="button" className="btn btn-sm" onClick={() => setSelectedBooth('')}>Cancel</button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="card" style={{ marginTop: 16, padding: 18 }}>
          <p style={{ margin: 0, color: '#fca5a5' }}>{error}</p>
        </div>
      )}

      <div className="card" style={{ marginTop: 16, padding: 18 }}>
        {booths.length > 0 && (
          <div className="booth-floor-toolbar">
            <div><strong style={{ color: 'var(--ink)' }}>Floor map</strong><span style={{ color: 'var(--muted)' }}>{visibleBooths.length} booth{visibleBooths.length === 1 ? '' : 's'} shown</span></div>
            <select className="input-light" value={floor} onChange={(e) => setFloor(e.target.value)}>
              {floors.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
        )}
        {loading ? (
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)' }}>Loading booth map…</p>
        ) : boothRows.length ? (
          <>
            <BoothMap booths={visibleBooths.map((booth) => ({ ...booth, isSelected: (booth._id || booth.id) === selectedBooth }))} eventTitle={`${floor} map`} onSelect={user.role === 'exhibitor' ? setSelectedBooth : undefined} />
            <div style={{ marginTop: 16, overflow: 'auto' }}>
              <table className="table" style={{ minWidth: 700 }}>
                <thead>
                  <tr>
                    <th>Booth</th>
                    <th>Event</th>
                    <th>Status</th>
                    <th>Location</th>
                    <th>Size</th>
                    <th>Price</th>
                    <th>Exhibitor</th>
                  </tr>
                </thead>
                <tbody>
                  {boothRows.map((row) => (
                    <tr key={row.key}>
                      <td>{row.label}</td>
                      <td>{row.event}</td>
                      <td>{row.status}</td>
                      <td>{row.location}</td>
                      <td>{row.size}</td>
                      <td>{row.price ? `$${row.price}` : '—'}</td>
                      <td>{row.exhibitor === 'Unassigned' ? row.exhibitor : <span>{row.exhibitor} <Link to="/chat" title="Chat with exhibitor" style={{ color: 'var(--secondary)', marginLeft: 6 }}>Chat</Link></span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)' }}>No booth data available for this account.</p>
        )}
      </div>
    </div>
  );
}
