import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { endpoints } from '../../api/client';

const idOf = (value) => value?._id || value?.id || value;

export default function BoothRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const loadRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await endpoints.booths.pending();
      setRequests(response?.requests || []);
    } catch (err) {
      setError(err.message || 'Unable to load booth requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRequests(); }, []);

  const decide = async (request, action) => {
    const requestId = idOf(request);
    setBusyId(requestId);
    try {
      if (action === 'approve') await endpoints.booths.approveRequest(requestId);
      else await endpoints.booths.rejectRequest(requestId);
      setRequests((current) => current.filter((item) => idOf(item) !== requestId));
      toast.success(action === 'approve' ? 'Booth request approved' : 'Booth request rejected');
    } catch (err) {
      toast.error(err.message || `Unable to ${action} booth request.`);
    } finally {
      setBusyId('');
    }
  };

  return (
    <div>
      <h1 style={{ margin: 0, fontSize: 22 }}>Booth requests</h1>
      <p style={{ color: 'var(--muted)', fontSize: 13 }}>Review exhibitor booth selections before they become occupied.</p>
      {error && <div className="card" style={{ marginTop: 16, padding: 16, color: 'var(--error)' }}>{error}</div>}
      <div className="panel" style={{ marginTop: 16, overflowX: 'auto' }}>
        {loading ? <p style={{ color: 'var(--muted)' }}>Loading booth requests…</p> : (
          <table className="table" style={{ minWidth: 850 }}>
            <thead><tr><th>Booth</th><th>Event</th><th>Exhibitor</th><th>Size</th><th>Location</th><th>Floor</th><th>Price</th><th>Requested</th><th>Actions</th></tr></thead>
            <tbody>
              {requests.map((request) => {
                const requestId = idOf(request);
                const booth = request;
                const exhibitor = request.exhibitor || {};
                return (
                  <tr key={requestId}>
                    <td><strong>{booth.boothNumber}</strong></td>
                    <td>{booth.event?.title || '—'}</td>
                    <td>{exhibitor.name || exhibitor.companyName || '—'}<br /><small>{exhibitor.email || ''}</small></td>
                    <td>{booth.size || '—'}</td>
                    <td>{booth.location || '—'}</td>
                    <td>{booth.floor || '—'}</td>
                    <td>{booth.price ? `$${booth.price}` : '—'}</td>
                    <td>{booth.requestedAt ? new Date(booth.requestedAt).toLocaleString() : '—'}</td>
                    <td>
                      <button type="button" className="btn btn-primary btn-sm" disabled={busyId === requestId} onClick={() => decide(request, 'approve')}>Approve</button>{' '}
                      <button type="button" className="btn btn-sm" disabled={busyId === requestId} onClick={() => decide(request, 'reject')}>Reject</button>
                    </td>
                  </tr>
                );
              })}
              {!requests.length && <tr><td colSpan="9" style={{ color: 'var(--muted)' }}>No pending booth requests.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
