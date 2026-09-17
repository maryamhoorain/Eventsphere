import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Mail,
} from 'lucide-react';
import { useSession } from '../store/session';

export default function ForgotPassword() {
  const forgotPassword = useSession(
    (s) => s.forgotPassword
  );

  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    setError('');
    setMsg('');
    setToken('');
    setLoading(true);

    const res = await forgotPassword(email.trim());

    setLoading(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    setMsg(
      'If an account with that email exists, a password reset link has been sent.'
    );

    if (res.resetToken) {
      setToken(res.resetToken);
    }
  };

  return (
    <div
      className="public-shell"
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '24px 16px',
      }}
    >
      <div className="site-bg" />

      <form
        className="card"
        onSubmit={submit}
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 420,
          padding: 32,
          margin: 16,
        }}
      >
        <Link to="/login" className="auth-back-home">
          <ArrowLeft size={15} />
          Back to sign in
        </Link>

        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            background:
              'rgba(53,198,217,0.10)',
            border:
              '1px solid rgba(53,198,217,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '20px auto 18px',
          }}
        >
          <Mail
            size={25}
            style={{ color: 'var(--accent)' }}
          />
        </div>

        <h1
          style={{
            color: '#fff',
            margin: 0,
            textAlign: 'center',
            fontSize: 24,
          }}
        >
          Forgot your password?
        </h1>

        <p
          style={{
            fontSize: 13,
            lineHeight: 1.7,
            color: 'rgba(255,255,255,0.5)',
            textAlign: 'center',
            marginTop: 8,
          }}
        >
          Enter the email address associated with your
          EventSphere account and we'll send you a secure
          password reset link.
        </p>

        <label
          style={{
            display: 'block',
            marginTop: 20,
            marginBottom: 7,
            fontSize: 12,
            color: 'rgba(255,255,255,0.55)',
          }}
        >
          Email address
        </label>

        <input
          className="input"
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError('');
            setMsg('');
          }}
          placeholder="you@example.com"
          autoComplete="email"
        />

        {error && (
          <p
            style={{
              color: '#fb7185',
              fontSize: 13,
              marginTop: 12,
              lineHeight: 1.5,
            }}
          >
            {error}
          </p>
        )}

        {msg && (
          <div
            style={{
              display: 'flex',
              gap: 9,
              alignItems: 'flex-start',
              marginTop: 14,
              padding: '12px 13px',
              borderRadius: 10,
              background:
                'rgba(16,185,129,0.08)',
              border:
                '1px solid rgba(16,185,129,0.16)',
              color: '#6ee7b7',
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            <CheckCircle2
              size={16}
              style={{
                flexShrink: 0,
                marginTop: 1,
              }}
            />

            <span>{msg}</span>
          </div>
        )}

        {/* LOCAL DEVELOPMENT ONLY */}
        {token && (
          <div
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 9,
              background:
                'rgba(255,255,255,0.025)',
              border:
                '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.45)',
                margin: '0 0 7px',
              }}
            >
              Local development reset link
            </p>

            <Link
              to={`/reset-password/${token}`}
              style={{
                color: 'var(--accent)',
                fontSize: 12,
                wordBreak: 'break-all',
              }}
            >
              Open reset page
            </Link>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          style={{
            width: '100%',
            marginTop: 18,
          }}
          disabled={loading}
        >
          {loading
            ? 'Sending…'
            : 'Send reset link'}
        </button>

        <Link
          to="/login"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 5,
            marginTop: 16,
            fontSize: 13,
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      </form>
    </div>
  );
}