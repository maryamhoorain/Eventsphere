import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useSession } from '../store/session';

export default function ResetPassword() {
  const { token } = useParams();
  const resetPassword = useSession((s) => s.resetPassword);
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  return (
    <div className="public-shell" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <div className="site-bg" />
      <form
        className="card"
        style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 400, padding: 32, margin: 16 }}
        onSubmit={async (e) => {
          e.preventDefault();
          const res = await resetPassword(token, password);
          if (!res.ok) setError(res.error);
          else { toast.success('Password updated'); navigate('/login'); }
        }}
      >
        <h1 style={{ color: '#fff', margin: 0 }}>New password</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>POST /api/auth/reset-password/:token</p>
        <input className="input" style={{ marginTop: 16 }} type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" />
        {error && <p style={{ color: '#fb7185', fontSize: 13 }}>{error}</p>}
        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 16 }}>Update password</button>
        <Link to="/login" style={{ display: 'block', textAlign: 'center', marginTop: 12, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Back to sign in</Link>
      </form>
    </div>
  );
}
