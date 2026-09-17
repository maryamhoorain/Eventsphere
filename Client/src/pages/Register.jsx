import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  MailCheck,
  Check,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '../store/session';

// ======================================================
// PASSWORD VALIDATION
// Keep these rules identical to the backend.
// ======================================================

const getPasswordChecks = (password) => {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
};

const isStrongPassword = (password) => {
  const checks = getPasswordChecks(password);

  return (
    checks.length &&
    checks.uppercase &&
    checks.lowercase &&
    checks.number &&
    checks.special
  );
};

export default function Register() {
  const register = useSession((s) => s.register);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [sentTo, setSentTo] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');

  const passwordChecks = getPasswordChecks(password);
  const passwordIsStrong = isStrongPassword(password);

  // ======================================================
  // SUBMIT
  // ======================================================

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    // ------------------------------------------
    // Frontend password validation
    // ------------------------------------------

    if (!passwordIsStrong) {
      setError(
        'Please choose a stronger password. Your password must contain at least 8 characters, including uppercase, lowercase, a number, and a special character.'
      );
      return;
    }

    setLoading(true);

    try {
      const res = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
      });

      if (!res.ok) {
        setError(res.error || 'Unable to create your account.');
        return;
      }

      // ------------------------------------------
      // Local verification link
      // ------------------------------------------

      if (res.verificationUrl) {
        setVerificationUrl(res.verificationUrl);
        setSentTo(email.trim());

        toast.success(
          'Account created. Use the local verification link to activate it.'
        );

        return;
      }

      // ------------------------------------------
      // Normal email verification
      // ------------------------------------------

      if (res.message) {
        toast.success(res.message);
      }

      setSentTo(email.trim());
    } catch (err) {
      setError(
        err?.message || 'Something went wrong while creating your account.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // VERIFICATION SUCCESS / CHECK INBOX SCREEN
  // ======================================================

  if (sentTo) {
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

        <div
          className="card"
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            maxWidth: 460,
            padding: '40px 36px',
            margin: '16px',
            textAlign: 'center',
          }}
        >
          <Link to="/" className="auth-back-home">
            <ArrowLeft size={15} />
            Back to home
          </Link>

          {/* Icon */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '20px auto 0',
            }}
          >
            <MailCheck
              size={28}
              style={{ color: 'var(--success)' }}
            />
          </div>

          <h1
            style={{
              color: '#fff',
              fontSize: 24,
              marginTop: 22,
              marginBottom: 10,
            }}
          >
            Check your inbox
          </h1>

          <p
            style={{
              color: 'rgba(255,255,255,0.65)',
              fontSize: 14,
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            {verificationUrl ? (
              <>
                Email delivery is not configured on this local server.
                Activate{' '}
                <strong style={{ color: '#fff' }}>
                  {sentTo}
                </strong>{' '}
                using the local verification link below.
              </>
            ) : (
              <>
                We sent a verification link to{' '}
                <strong style={{ color: '#fff' }}>
                  {sentTo}
                </strong>
                . Confirm your email to activate your attendee account.
              </>
            )}
          </p>

          {verificationUrl && (
            <a
              href={verificationUrl}
              className="btn btn-primary"
              style={{
                width: '100%',
                marginTop: 22,
              }}
            >
              Verify this local account
            </a>
          )}

          <Link
            to="/login"
            className="btn btn-primary"
            style={{
              width: '100%',
              marginTop: verificationUrl ? 10 : 24,
            }}
          >
            Go to sign in
          </Link>

          <p
            style={{
              marginTop: 18,
              fontSize: 12,
              color: 'rgba(255,255,255,0.45)',
              lineHeight: 1.6,
            }}
          >
            Didn't get the email? Check your spam folder, or{' '}
            <button
              type="button"
              onClick={() => {
                setSentTo('');
                setVerificationUrl('');
                setError('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                fontSize: 12,
                padding: 0,
                cursor: 'pointer',
              }}
            >
              try a different email
            </button>
            .
          </p>
        </div>
      </div>
    );
  }

  // ======================================================
  // REGISTER FORM
  // ======================================================

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
        onSubmit={submit}
        className="card"
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 440,
          padding: '32px',
          margin: 16,
        }}
      >
        {/* Back */}
        <Link to="/" className="auth-back-home">
          <ArrowLeft size={15} />
          Back to home
        </Link>

        {/* Brand */}
        <Link to="/" className="auth-brand">
          <img src="/logo.jpg" alt="" />
          <span style={{ color: 'var(--accent)' }}>Event</span>
          Sphere
        </Link>

        {/* Heading */}
        <h1
          style={{
            textAlign: 'center',
            color: '#fff',
            margin: 0,
            fontSize: 24,
          }}
        >
          Create your account
        </h1>

        <p
          style={{
            textAlign: 'center',
            fontSize: 13,
            color: 'rgba(255,255,255,0.5)',
            marginTop: 8,
            marginBottom: 0,
          }}
        >
          Every account starts as an attendee
        </p>

        {/* Name */}
        <input
          className="input"
          style={{ marginTop: 20 }}
          required
          autoComplete="name"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* Email */}
        <input
          className="input"
          style={{ marginTop: 10 }}
          type="email"
          required
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password */}
        <div
          style={{
            position: 'relative',
            marginTop: 10,
          }}
        >
          <input
            className="input"
            style={{
              width: '100%',
              paddingRight: 46,
            }}
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="new-password"
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError('');
            }}
          />

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              padding: 4,
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {showPassword ? (
              <EyeOff size={18} />
            ) : (
              <Eye size={18} />
            )}
          </button>
        </div>

        {/* Password requirements */}
        {password.length > 0 && (
          <div
            style={{
              marginTop: 12,
              padding: '12px 14px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.035)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <p
              style={{
                margin: '0 0 8px',
                fontSize: 12,
                color: 'rgba(255,255,255,0.55)',
              }}
            >
              Password requirements
            </p>

            <PasswordRequirement
              valid={passwordChecks.length}
              text="At least 8 characters"
            />

            <PasswordRequirement
              valid={passwordChecks.uppercase}
              text="One uppercase letter"
            />

            <PasswordRequirement
              valid={passwordChecks.lowercase}
              text="One lowercase letter"
            />

            <PasswordRequirement
              valid={passwordChecks.number}
              text="One number"
            />

            <PasswordRequirement
              valid={passwordChecks.special}
              text="One special character"
            />

            {passwordIsStrong && (
              <p
                style={{
                  margin: '10px 0 0',
                  color: 'var(--success)',
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                ✓ Strong password
              </p>
            )}
          </div>
        )}

        {/* Phone */}
        <input
          className="input"
          style={{ marginTop: 10 }}
          type="tel"
          autoComplete="tel"
          placeholder="Phone (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        {/* Error */}
        {error && (
          <div
            style={{
              marginTop: 12,
              padding: '10px 12px',
              borderRadius: 9,
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.18)',
            }}
          >
            <p
              style={{
                color: '#fb7185',
                fontSize: 13,
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {error}
            </p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="btn btn-primary"
          style={{
            width: '100%',
            marginTop: 18,
          }}
          disabled={loading || !passwordIsStrong}
        >
          {loading ? 'Creating…' : 'Create account'}
        </button>

        {/* Account information */}
        <p
          style={{
            textAlign: 'center',
            marginTop: 14,
            fontSize: 12,
            color: 'rgba(255,255,255,0.4)',
            lineHeight: 1.5,
          }}
        >
          Want to showcase a brand or run your own event? Sign up
          first — you can apply as an exhibitor or organizer from
          your dashboard.
        </p>

        {/* Login */}
        <p
          style={{
            textAlign: 'center',
            marginTop: 14,
            fontSize: 13,
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          Have an account?{' '}
          <Link
            to="/login"
            style={{ color: 'var(--accent)' }}
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

// ======================================================
// PASSWORD REQUIREMENT COMPONENT
// ======================================================

function PasswordRequirement({ valid, text }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginTop: 6,
        fontSize: 12,
        color: valid
          ? 'var(--success)'
          : 'rgba(255,255,255,0.42)',
      }}
    >
      <span
        style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: valid
            ? 'rgba(16,185,129,0.12)'
            : 'rgba(255,255,255,0.05)',
          flexShrink: 0,
        }}
      >
        {valid ? <Check size={10} /> : <X size={10} />}
      </span>

      {text}
    </div>
  );
}