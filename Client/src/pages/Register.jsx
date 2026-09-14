import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '../store/session';

export default function Register() {
  const register = useSession((s) => s.register);
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await register({ name, email, password, phone });
    setLoading(false);
    if (!res.ok) { setError(res.error); return; }
    if (res.verificationUrl) {
      setVerificationUrl(res.verificationUrl);
      setSentTo(email);
      toast.success('Account created. Use the local verification link to activate it.');
      return;
    } else if (res.message) {
      toast.success(res.message);
    }
    navigate('/');
  };

  if (sentTo) {
    return (
      <div className="public-shell" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div className="site-bg" />
        <div className="card" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440, padding: 36, margin: 16, textAlign: 'center' }}>
          <Link to="/" className="auth-back-home"><ArrowLeft size={15} /> Back to home</Link>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(37,99,235,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
            <MailCheck size={26} style={{ color: 'var(--accent)' }} />
          </div>
          <h1 style={{ color: '#fff', fontSize: 22, marginTop: 20, marginBottom: 8 }}>Check your inbox</h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, lineHeight: 1.6 }}>
            {verificationUrl
              ? <>Email delivery is not configured on this local Server. Activate <strong style={{ color: '#fff' }}>{sentTo}</strong> with the local verification link below, then sign in.</>
              : <>We sent a verification link to <strong style={{ color: '#fff' }}>{sentTo}</strong>. Confirm your email to activate your attendee account, then sign in.</>}
          </p>
          {verificationUrl && (
            <a href={verificationUrl} className="btn btn-primary" style={{ width: '100%', marginTop: 12 }}>
              Verify this local account
            </a>
          )}
          <Link to="/login" className="btn btn-primary" style={{ width: '100%', marginTop: 24 }}>Go to sign in</Link>
          <p style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
            Didn't get it? Check spam, or <button type="button" onClick={() => setSentTo('')} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12, padding: 0 }}>try a different email</button>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="public-shell" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <div className="site-bg" />
      <form onSubmit={submit} className="card" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420, padding: 32, margin: 16 }}>
        <Link to="/" className="auth-back-home"><ArrowLeft size={15} /> Back to home</Link>
        <Link to="/" className="auth-brand">
          <img src="/logo.jpg" alt="" />
          <span style={{ color: 'var(--accent)' }}>Event</span>Sphere
        </Link>
        <h1 style={{ textAlign: 'center', color: '#fff', margin: 0 }}>Create your account</h1>
        <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
          Every account starts as an attendee
        </p>
        <input className="input" style={{ marginTop: 16 }} required placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" style={{ marginTop: 10 }} type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" style={{ marginTop: 10 }} type="password" required minLength={6} placeholder="Password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} />
        <input className="input" style={{ marginTop: 10 }} placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
        {error && <p style={{ color: '#fb7185', fontSize: 13, marginTop: 10 }}>{error}</p>}
        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 18 }} disabled={loading}>
          {loading ? 'Creating…' : 'Create account'}
        </button>
        <p style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
          Want to showcase a brand or run your own event? Sign up first — you can apply as an exhibitor or organizer from your dashboard.
        </p>
        <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
          Have an account? <Link to="/login" style={{ color: 'var(--accent)' }}>Sign in</Link>
        </p>
      </form>
    </div>
  );
}
