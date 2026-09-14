import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../store/session';

export default function ForgotPassword() {
  const forgotPassword = useSession((s) => s.forgotPassword);
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  return (
    <div className="public-shell" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <div className="site-bg" />
      <form
        className="card"
        style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 400, padding: 32, margin: 16 }}
        onSubmit={async (e) => {
          e.preventDefault();
          setError('');
          const res = await forgotPassword(email);
          if (!res.ok) setError(res.error);
          else {
            setMsg('If an account exists, a reset link will be sent.');
            if (res.resetToken) setToken(res.resetToken);
          }
        }}
      >
        <h1 style={{ color: '#fff', margin: 0 }}>Reset password</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>POST /api/auth/forgot-password</p>
        <input className="input" style={{ marginTop: 16 }} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
        {error && <p style={{ color: '#fb7185', fontSize: 13 }}>{error}</p>}
        {msg && <p style={{ color: '#6ee7b7', fontSize: 13 }}>{msg}</p>}
        {token && (
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', wordBreak: 'break-all' }}>
            Preview token: <Link to={`/reset-password/${token}`} style={{ color: 'var(--accent)' }}>{token}</Link>
          </p>
        )}
        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 16 }}>Send reset link</button>
        <Link to="/login" style={{ display: 'block', textAlign: 'center', marginTop: 12, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Back to sign in</Link>
      </form>
    </div>
  );
}
