import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { StatusPill } from '../../components/common/StatusPill';
import { useOps } from '../../store/ops';
import { useSession } from '../../store/session';
import { endpoints } from '../../api/client';

export default function Applications() {
  const user = useSession((s) => s.user);
  const role = user?.role;
  const applications = useOps((s) => s.applications);
  const exhibitorApplies = useOps((s) => s.exhibitorApplies);
  const setApplicationStatus = useOps((s) => s.setApplicationStatus);
  const setExhibitorApplyStatus = useOps((s) => s.setExhibitorApplyStatus);
  const setRole = useSession((s) => s.setRole);
  const [serverApplications, setServerApplications] = useState([]);
  const [organizerApplications, setOrganizerApplications] = useState([]);
  const [loading, setLoading] = useState(role === 'admin' || role === 'exhibitor');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (role !== 'admin' && role !== 'exhibitor') return undefined;
    let active = true;
    const loadApplications = () => {
      setLoading(true);
      return Promise.all([endpoints.exhibitors.applications(), endpoints.organizerApplications.list()])
      .then(([data, organizerData]) => {
        if (active) setServerApplications(data.applications || data || []);
        if (active) setOrganizerApplications(organizerData?.data?.applications || []);
      })
      .catch((error) => {
        if (active) setLoadError(error.message || 'Unable to load exhibitor applications.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    };
    loadApplications();
    const refreshTimer = window.setInterval(loadApplications, 15000);
    return () => { active = false; window.clearInterval(refreshTimer); };
  }, [role]);

  const rows = serverApplications.length
    ? (role === 'exhibitor'
      ? serverApplications.filter((a) => (a.userId || a.applicantId || a.exhibitorId) === user.id)
      : serverApplications)
    : (role === 'exhibitor' ? applications.filter((a) => a.exhibitorId === user.id) : applications);

  const approveServerApplication = async (application) => {
    try {
      await endpoints.exhibitors.approve(application._id || application.id);
      setServerApplications((current) => current.map((item) => (
        (item._id || item.id) === (application._id || application.id) ? { ...item, status: 'approved' } : item
      )));
      toast.success('Exhibitor application approved');
    } catch (error) {
      toast.error(error.message || 'Unable to approve application');
    }
  };

  const decideOrganizer = async (application, action) => {
    try {
      const method = action === 'approve' ? endpoints.organizerApplications.approve : endpoints.organizerApplications.reject;
      const adminNotes = action === 'reject'
        ? (window.prompt('Why are you rejecting this application?') || '')
        : undefined;
      await method(application._id, adminNotes);
      setOrganizerApplications((current) => current.map((item) => item._id === application._id ? { ...item, status: action === 'approve' ? 'approved' : 'rejected' } : item));
      toast.success(action === 'approve' ? 'Organizer application approved' : 'Organizer application rejected');
    } catch (error) {
      toast.error(error.message || `Unable to ${action} organizer application`);
      setLoadError(error.message || `Unable to ${action} organizer application`);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Applications</h1>
        {role === 'admin' && <button type="button" className="btn btn-primary btn-sm" onClick={() => window.location.reload()}>Refresh requests</button>}
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 13 }}>Review exhibitor applications submitted from the public registration form.</p>
      {loadError && <p style={{ color: 'var(--error)', fontSize: 13 }}>{loadError}</p>}
      {loading && <p style={{ color: 'var(--muted)', fontSize: 13 }}>Loading applications…</p>}
      <div className="panel" style={{ marginTop: 16 }}>
        <table className="table">
          <thead><tr><th>Company</th><th>Event</th><th>Category</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id || r.id}>
                <td>{r.businessName || r.companyName}</td>
                <td>{r.eventTitle || 'General exhibitor application'}</td>
                <td>{r.category || r.industry || '—'}</td>
                <td><StatusPill status={r.status} /></td>
                <td>{role === 'admin' && r.status === 'pending' && (
                  <>
                    <button type="button" style={{ background: 'none', border: 'none', color: '#065f46', fontSize: 12, fontWeight: 600 }} onClick={() => {
                      if (serverApplications.length) approveServerApplication(r);
                      else { setApplicationStatus(r.id, 'approved'); toast.success('Approved'); }
                    }}>Approve</button>
                    <button type="button" style={{ background: 'none', border: 'none', color: 'var(--error)', fontSize: 12, fontWeight: 600 }} onClick={async () => {
                      if (serverApplications.length) {
                        try {
                          const adminNotes = window.prompt('Why are you rejecting this application?') || '';
                          await endpoints.exhibitors.reject(r._id || r.id, adminNotes);
                          setServerApplications((current) => current.map((item) => ((item._id || item.id) === (r._id || r.id) ? { ...item, status: 'rejected' } : item)));
                          toast.success('Application rejected');
                        } catch (error) { toast.error(error.message || 'Unable to reject application'); }
                      } else setApplicationStatus(r.id, 'rejected');
                    }}>Reject</button>
                  </>
                )}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {role === 'admin' && <div className="panel" style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 14, margin: '0 0 12px' }}>Organizer requests</h2>
        <table className="table">
          <thead><tr><th>Applicant</th><th>Organization</th><th>Reason</th><th>Status</th><th /></tr></thead>
          <tbody>{organizerApplications.map((application) => <tr key={application._id}>
            <td>{application.applicant?.name}<br /><small>{application.applicant?.email}</small></td>
            <td>{application.organizationName}</td>
            <td>{application.reason}</td>
            <td><StatusPill status={application.status} /></td>
            <td>{application.status === 'pending' && <><button type="button" className="btn btn-primary btn-sm" onClick={() => decideOrganizer(application, 'approve')}>Approve</button>{' '}<button type="button" className="btn btn-sm" onClick={() => decideOrganizer(application, 'reject')}>Reject</button></>}</td>
          </tr>)}</tbody>
        </table>
        {!organizerApplications.length && <p style={{ color: 'var(--muted)' }}>No organizer requests found.</p>}
      </div>}
      {role === 'admin' && (
        <div className="panel" style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 14, margin: '0 0 12px' }}>Become-exhibitor requests</h2>
          <table className="table">
            <thead><tr><th>Applicant</th><th>Company</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {exhibitorApplies.map((r) => (
                <tr key={r.id}>
                  <td>{r.userName}</td>
                  <td>{r.companyName}</td>
                  <td><StatusPill status={r.status} /></td>
                  <td>{r.status === 'pending' && (
                    <button type="button" style={{ background: 'none', border: 'none', color: '#065f46', fontSize: 12, fontWeight: 600 }} onClick={() => { setExhibitorApplyStatus(r.id, 'approved'); setRole(r.userId, 'exhibitor'); toast.success('Promoted'); }}>Approve</button>
                  )}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
