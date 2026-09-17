import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useSession } from '../store/session';

export default function VerifyEmail() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();

  const verifyEmail = useSession((s) => s.verifyEmail);
  const resendVerification = useSession((s) => s.resendVerification);

  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);

  const email = searchParams.get('email') || '';

  /*
   * Store the verification request so React StrictMode can reuse
   * the same request instead of starting another one.
   */
  const verificationRequest = useRef({
    token: null,
    promise: null,
  });

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage(
        `Please check the verification email sent to ${
          email || 'your email address'
        }, then open the verification link.`
      );
      return;
    }

    /*
     * If this token has already started verification,
     * reuse the existing promise.
     *
     * This prevents duplicate API calls caused by React StrictMode.
     */
    if (
      verificationRequest.current.token !== token ||
      !verificationRequest.current.promise
    ) {
      verificationRequest.current.token = token;

      verificationRequest.current.promise = verifyEmail(token);
    }

    const verify = async () => {
      try {
        const res = await verificationRequest.current.promise;

        if (res.ok) {
          setStatus('success');
          setMessage(
            res.message ||
              'Email verified successfully. You can now log in.'
          );
        } else {
          setStatus('error');
          setMessage(
            res.error ||
              'This verification link is invalid or has expired.'
          );
        }
      } catch (error) {
        setStatus('error');
        setMessage(
          error?.message ||
            'Unable to verify your email. Please try again.'
        );
      }
    };

    verify();
  }, [token, verifyEmail, email]);

  const resend = async () => {
    if (!email || resending) return;

    setResending(true);

    try {
      const result = await resendVerification(email);

      setMessage(
        result.message ||
          result.error ||
          'Verification email sent successfully!'
      );
    } catch {
      setMessage(
        'An error occurred while resending the verification email.'
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div
      className="public-shell"
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <div className="site-bg" />

      <div
        className="card"
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 440,
          padding: 36,
          margin: 16,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background:
              status === 'error'
                ? 'rgba(239,68,68,0.15)'
                : 'rgba(16,185,129,0.15)',
          }}
        >
          {status === 'loading' && (
            <Loader2
              size={26}
              className="spin"
              style={{ color: 'var(--accent)' }}
            />
          )}

          {status === 'success' && (
            <CheckCircle2
              size={26}
              style={{ color: 'var(--success)' }}
            />
          )}

          {status === 'error' && (
            <XCircle
              size={26}
              style={{ color: 'var(--error)' }}
            />
          )}
        </div>

        <h1
          style={{
            color: '#fff',
            fontSize: 22,
            marginTop: 20,
            marginBottom: 8,
          }}
        >
          {status === 'loading'
            ? 'Verifying your email…'
            : status === 'success'
            ? 'Email verified'
            : token
            ? 'Verification failed'
            : 'Email verification required'}
        </h1>

        <p
          style={{
            color: 'rgba(255,255,255,0.65)',
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          {message}
        </p>

        {status !== 'loading' && (
          <>
            <Link
              to="/login"
              className="btn btn-primary"
              style={{
                width: '100%',
                marginTop: 24,
              }}
            >
              {status === 'success'
                ? 'Go to sign in'
                : 'Back to sign in'}
            </Link>

            {status === 'error' && email && (
              <button
                type="button"
                className="btn btn-ghost"
                style={{
                  width: '100%',
                  marginTop: 10,
                }}
                onClick={resend}
                disabled={resending}
              >
                {resending
                  ? 'Sending…'
                  : 'Resend verification email'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}