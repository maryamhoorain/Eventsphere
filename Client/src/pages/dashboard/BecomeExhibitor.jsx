import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Building2, CheckCircle2, ImagePlus, X } from 'lucide-react';
import { useSession } from '../../store/session';
import { endpoints } from '../../api/client';
import { StatusPill } from '../../components/common/StatusPill';

const FIELD = { width: '100%', marginTop: 6 };

export default function BecomeExhibitor() {
  const user = useSession((s) => s.user);
  const [form, setForm] = useState({
    companyName: '',
    description: '',
    industry: '',
    website: '',
    contactEmail: user?.email || '',
    contactPhone: user?.phone || '',
    logo: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState('pending');
  const [applicationLoading, setApplicationLoading] = useState(true);
  const [otherApplication, setOtherApplication] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  useEffect(() => () => {
    if (logoPreview.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
  }, [logoPreview]);

  useEffect(() => {
    if (!['attendee', 'exhibitor'].includes(user?.role)) return;
    Promise.all([
      endpoints.exhibitors.myApplication(),
      user?.role === 'attendee' ? endpoints.organizerApplications.mine().catch((requestError) => {
        if (requestError.status !== 404) throw requestError;
        return null;
      }) : Promise.resolve(null),
    ])
      .then(([response, organizerResponse]) => {
        const application = response?.application;
        if (application && application.status !== 'rejected') {
          setSubmitted(true);
          setApplicationStatus(application.status);
          setForm((current) => ({ ...current, companyName: application.companyName || '' }));
        }
        const organizerApplication = organizerResponse?.data?.application;
        if (organizerApplication && ['pending', 'approved'].includes(organizerApplication.status)) {
          setOtherApplication(organizerApplication);
        }
      })
      .catch((requestError) => setError(requestError.message || 'Unable to load exhibitor application.'))
      .finally(() => setApplicationLoading(false));
  }, [user?.role]);

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file for your company logo.');
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setLogoPreview((current) => {
      if (current.startsWith('blob:')) URL.revokeObjectURL(current);
      return previewUrl;
    });
    const image = new Image();
    image.onload = () => {
      const maxDimension = 640;
      const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      setForm((current) => ({ ...current, logo: canvas.toDataURL('image/jpeg', 0.72) }));
      URL.revokeObjectURL(previewUrl);
    };
    image.onerror = () => {
      URL.revokeObjectURL(previewUrl);
      setError('The selected image could not be read. Please choose another file.');
    };
    image.src = previewUrl;
    setError('');
  };

  const removeLogo = () => {
    setForm((current) => ({ ...current, logo: '' }));
    setLogoPreview((current) => {
      if (current.startsWith('blob:')) URL.revokeObjectURL(current);
      return '';
    });
  };

  if (submitted) {
    return (
      <div className="registration-page container">
        <h1 style={{ margin: 0, fontSize: 22 }}>Become an exhibitor</h1>
        <div className="panel" style={{ marginTop: 16, maxWidth: 480, textAlign: 'center', padding: 32 }}>
          <CheckCircle2 size={32} style={{ color: 'var(--success)' }} />
          <h2 style={{ fontSize: 16, margin: '12px 0 6px' }}>Application submitted</h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
            Your exhibitor application is currently <strong>{applicationStatus}</strong> and the form is locked until an admin reviews it.
          </p>
          <div style={{ margin: '12px auto 0', display: 'inline-flex' }}>
            <StatusPill status={applicationStatus} />
          </div>
        </div>
      </div>
    );
  }

  if (applicationLoading && ['attendee', 'exhibitor'].includes(user?.role)) {
    return <div className="registration-page container"><p style={{ color: 'var(--muted)' }}>Checking your exhibitor application…</p></div>;
  }

  if (otherApplication) {
    return <div className="registration-page container"><h1 style={{ margin: 0, fontSize: 22 }}>Become an exhibitor</h1><div className="panel" style={{ marginTop: 16, maxWidth: 520 }}><p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}><strong>Your organizer application is being reviewed.</strong><br />To keep your account role clear, you can’t apply as an exhibitor while an organizer application is pending. If your application is rejected, you’ll be welcome to apply as an exhibitor.</p><StatusPill status={otherApplication.status} /></div></div>;
  }

  if (user?.role !== 'attendee') {
    return (
      <div className="registration-page container">
        <h1 style={{ margin: 0, fontSize: 22 }}>Become an exhibitor</h1>
        <div className="panel" style={{ marginTop: 16, maxWidth: 480 }}>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>
            {user?.role === 'exhibitor'
              ? "You're already an approved exhibitor on EventSphere — manage your booths and applications from the sidebar."
              : 'Exhibitor applications are only available to attendee accounts.'}
          </p>
        </div>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.companyName || !form.description || !form.industry || !form.contactEmail || !form.contactPhone) {
      setError('Company name, description, industry, contact email and contact phone are required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        companyName: form.companyName,
        description: form.description,
        industry: form.industry,
        website: form.website,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        logo: form.logo,
      };

      const data = await endpoints.exhibitors.apply(payload);
      const nextStatus = data.application?.status || 'pending';
      setApplicationStatus(nextStatus);
      setSubmitted(true);
      toast.success(data.message || 'Exhibitor application submitted');
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Something went wrong. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-page container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(37,99,235,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Building2 size={18} style={{ color: 'var(--secondary)' }} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>Become an exhibitor</h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--muted)' }}>
            Submit your application to the EventSphere backend.
          </p>
        </div>
      </div>
      <p style={{ marginTop: 12, fontSize: 14, color: 'var(--muted)', maxWidth: 560, lineHeight: 1.6 }}>
        Showcase your company at EventSphere expos. Submit your details below — the application is reviewed by organizers, and your account is upgraded to <strong>exhibitor</strong> after approval.
      </p>
      <form onSubmit={submit} className="panel registration-form" style={{ marginTop: 20, display: 'grid', gap: 4 }}>
        <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Company name *</label>
        <input className="input-light" style={FIELD} required value={form.companyName} onChange={set('companyName')} placeholder="e.g. TechNova Solutions" />

        <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginTop: 14 }}>Description *</label>
        <textarea className="input-light" style={{ ...FIELD, height: 90, padding: '10px 0.75rem', resize: 'vertical' }} required value={form.description} onChange={set('description')} placeholder="What does your company do, and what will you showcase?" />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Industry *</label>
            <input className="input-light" style={FIELD} required value={form.industry} onChange={set('industry')} placeholder="e.g. Software" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Website</label>
            <input className="input-light" style={FIELD} value={form.website} onChange={set('website')} placeholder="https://…" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Contact email *</label>
            <input className="input-light" style={FIELD} type="email" required value={form.contactEmail} onChange={set('contactEmail')} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Contact phone *</label>
            <input className="input-light" style={FIELD} required value={form.contactPhone} onChange={set('contactPhone')} />
          </div>
        </div>

        <label className="exhibitor-logo-picker" style={{ marginTop: 14 }}>
          <ImagePlus size={22} />
          <span>{logoPreview ? 'Change company logo' : 'Upload company logo'}</span>
          <small>PNG, JPG or WEBP · up to 5 MB</small>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoChange} />
        </label>
        {logoPreview && (
          <div className="exhibitor-logo-preview">
            <img src={logoPreview} alt="Company logo preview" />
            <div><strong>Logo selected</strong><small>Your image will be sent with the application.</small></div>
            <button type="button" onClick={removeLogo} aria-label="Remove company logo"><X size={16} /></button>
          </div>
        )}

        {error && <p style={{ color: 'var(--error)', fontSize: 13, marginTop: 10 }}>{error}</p>}
        <button type="submit" className="btn btn-primary" style={{ marginTop: 20 }} disabled={loading}>
          {loading ? 'Submitting…' : 'Submit application'}
        </button>
      </form>
    </div>
  );
}
