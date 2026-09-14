import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CalendarCog, CheckCircle2, ClipboardList, LineChart, ShieldCheck } from 'lucide-react';
import { useSession } from '../../store/session';
import { StatusPill } from '../../components/common/StatusPill';
import { endpoints } from '../../api/client';

const PERKS = [
  { icon: CalendarCog, title: 'Publish your own events', body: 'Create, edit and publish expos on EventSphere once your organizer request is approved.' },
  { icon: ClipboardList, title: 'Manage exhibitors & booths', body: 'Review exhibitor applications, assign booths, and run check-in for your events.' },
  { icon: LineChart, title: 'Live analytics', body: 'Track registrations, booth visits and feedback for everything you organize.' },
];

const FIELD = { width: '100%', marginTop: 6 };

export default function BecomeOrganizer() {
  const user = useSession((s) => s.user);
  const [requested, setRequested] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState('pending');
  const [applicationLoading, setApplicationLoading] = useState(true);
  const [otherApplication, setOtherApplication] = useState(null);
  const [form, setForm] = useState({
    companyName: '',
    website: '',
    contactEmail: user?.email || '',
    contactPhone: user?.phone || '',
    description: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!['attendee', 'organizer'].includes(user?.role)) return;
    Promise.all([
      endpoints.organizerApplications.mine().catch((requestError) => {
        if (requestError.status !== 404) throw requestError;
        return null;
      }),
      user?.role === 'attendee' ? endpoints.exhibitors.myApplication() : Promise.resolve(null),
    ])
      .then(([response, exhibitorResponse]) => {
        const application = response?.data?.application;
        if (application && application.status !== 'rejected') {
          setRequested(true);
          setApplicationStatus(application.status);
        }
        const exhibitorApplication = exhibitorResponse?.application;
        if (exhibitorApplication && ['pending', 'approved'].includes(exhibitorApplication.status)) {
          setOtherApplication(exhibitorApplication);
        }
      })
      .catch((requestError) => {
        if (requestError.status !== 404) setError(requestError.message || 'Unable to load organizer application.');
      })
      .finally(() => setApplicationLoading(false));
  }, [user?.role]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  if (user?.role === 'admin') {
    return (
      <div className="registration-page container">
        <h1 style={{ margin: 0, fontSize: 22 }}>Organizer access</h1>
        <div className="panel" style={{ marginTop: 16, maxWidth: 480 }}>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>Your account already has full organizer/admin permissions — you can create and publish events from Dashboard → Events.</p>
        </div>
      </div>
    );
  }

  if (requested) {
    return (
      <div className="registration-page container">
        <h1 style={{ margin: 0, fontSize: 22 }}>Become an organizer</h1>
        <div className="panel" style={{ marginTop: 16, maxWidth: 520, textAlign: 'center', padding: 28 }}>
          <CheckCircle2 size={32} style={{ color: 'var(--success)' }} />
          <h2 style={{ fontSize: 16, margin: '12px 0 8px' }}>Request submitted</h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
            Your organizer request is currently <strong>{applicationStatus}</strong> and the form is locked until an admin reviews it.
          </p>
          <div style={{ marginTop: 14, display: 'inline-flex' }}>
            <StatusPill status={applicationStatus} />
          </div>
        </div>
      </div>
    );
  }

  if (applicationLoading && ['attendee', 'organizer'].includes(user?.role)) {
    return <div className="registration-page container"><p style={{ color: 'var(--muted)' }}>Checking your organizer application…</p></div>;
  }

  if (otherApplication) {
    return <div className="registration-page container"><h1 style={{ margin: 0, fontSize: 22 }}>Become an organizer</h1><div className="panel" style={{ marginTop: 16, maxWidth: 520 }}><p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}><strong>Your exhibitor application is being reviewed.</strong><br />To keep your account role clear, you can’t apply as an organizer while an exhibitor application is pending. If your application is rejected, you’ll be welcome to apply as an organizer.</p><StatusPill status={otherApplication.status} /></div></div>;
  }

  if (user?.role !== 'attendee') {
    return (
      <div className="registration-page container">
        <h1 style={{ margin: 0, fontSize: 22 }}>Organizer access</h1>
        <div className="panel" style={{ marginTop: 16, maxWidth: 480 }}>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>Organizer registration is available to attendee accounts only.</p>
        </div>
      </div>
    );
  }

  const submit = (e) => {
    e.preventDefault();
    setError('');

    if (!form.companyName || !form.description || !form.contactEmail || !form.contactPhone) {
      setError('Company name, organization description, contact email and contact phone are required.');
      return;
    }

    setLoading(true);
    endpoints.organizerApplications.submit({
      organizationName: form.companyName,
      organizationDescription: form.description,
      reason: form.description,
      experience: form.website,
      website: form.website,
    }).then(() => {
      setRequested(true);
      toast.success('Organizer registration received — it is pending review.');
    }).catch((requestError) => {
      setError(requestError.message || 'Unable to submit organizer request.');
    }).finally(() => setLoading(false));
  };

  return (
    <div className="registration-page container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(56,189,248,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ShieldCheck size={18} style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>Become an organizer</h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--muted)' }}>Run your own events on EventSphere</p>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 20, maxWidth: 640 }}>
        <div style={{ display: 'inline-block', background: '#fef3c7', color: '#92400e', borderRadius: 999, padding: '4px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Organizer request
        </div>
        <p style={{ marginTop: 14, fontSize: 14, color: 'var(--ink)', lineHeight: 1.6 }}>
          Submit your organization information below. An admin will review your request before granting organizer access.
        </p>

        <div style={{ display: 'grid', gap: 14, marginTop: 20 }}>
          {PERKS.map(({ icon: Icon, title, body }) => (
            <div key={title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 9, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} style={{ color: 'var(--secondary)' }} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>{title}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2, lineHeight: 1.5 }}>{body}</div>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="registration-form" style={{ marginTop: 22, display: 'grid', gap: 8 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Company Name *</label>
            <input className="input-light" style={FIELD} required value={form.companyName} onChange={set('companyName')} placeholder="ABC Events Pvt Ltd" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Website</label>
              <input className="input-light" style={FIELD} value={form.website} onChange={set('website')} placeholder="https://example.com" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Contact email *</label>
              <input className="input-light" style={FIELD} type="email" required value={form.contactEmail} onChange={set('contactEmail')} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Contact phone *</label>
            <input className="input-light" style={FIELD} required value={form.contactPhone} onChange={set('contactPhone')} placeholder="+1 555 123 4567" />
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Organization description *</label>
            <textarea className="input-light" style={{ ...FIELD, minHeight: 90, resize: 'vertical', paddingTop: 10, paddingBottom: 10 }} required value={form.description} onChange={set('description')} placeholder="Tell us about your organization and the events you plan to run." />
          </div>

          {error && <p style={{ color: 'var(--error)', fontSize: 13, marginTop: 4 }}>{error}</p>}

          <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }} disabled={loading}>
            {loading ? 'Sending…' : 'Submit organizer request'}
          </button>
        </form>
      </div>
    </div>
  );
}
