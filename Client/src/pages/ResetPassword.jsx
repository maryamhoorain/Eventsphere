import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '../store/session';
import {
  generateStrongPassword,
  passwordRequirements,
  validateStrongPassword,
} from '../utils/password';

export default function ResetPassword() {
  const { token } = useParams();

  const resetPassword = useSession(
    (s) => s.resetPassword
  );

  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordValidation =
    validateStrongPassword(password);

  const suggestPassword = () => {
    const suggested = generateStrongPassword();

    setPassword(suggested);
    setConfirmPassword(suggested);

    setShowPassword(true);
    setShowConfirmPassword(true);

    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();

    setError('');

    if (!token) {
      setError(
        'This password reset link is missing or invalid.'
      );
      return;
    }

    const validation =
      validateStrongPassword(password);

    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    const res = await resetPassword(
      token,
      password
    );

    setLoading(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    toast.success('Password updated successfully.');
    navigate('/login');
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
          maxWidth: 440,
          padding: 32,
          margin: 16,
        }}
      >
        <Link to="/login" className="auth-back-home">
          <ArrowLeft size={15} />
          Back to sign in
        </Link>

        <h1
          style={{
            color: '#fff',
            margin: '8px 0 8px',
            fontSize: 24,
          }}
        >
          Create a new password
        </h1>

        <p
          style={{
            fontSize: 13,
            lineHeight: 1.6,
            color: 'rgba(255,255,255,0.5)',
            margin: 0,
          }}
        >
          Choose a strong password for your EventSphere
          account.
        </p>

        {/* NEW PASSWORD */}
        <label
          style={{
            display: 'block',
            marginTop: 20,
            marginBottom: 7,
            fontSize: 12,
            color: 'rgba(255,255,255,0.55)',
          }}
        >
          New password
        </label>

        <div className="password-field">
          <input
            className="input"
            type={showPassword ? 'text' : 'password'}
            required
            minLength={8}
            maxLength={128}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            placeholder="Enter a strong password"
            autoComplete="new-password"
          />

          <button
            type="button"
            className="password-toggle"
            onClick={() =>
              setShowPassword((value) => !value)
            }
            aria-label={
              showPassword
                ? 'Hide password'
                : 'Show password'
            }
          >
            {showPassword ? (
              <EyeOff size={18} />
            ) : (
              <Eye size={18} />
            )}
          </button>
        </div>

        {/* REQUIREMENTS */}
        <div
          style={{
            marginTop: 12,
            padding: '13px 14px',
            borderRadius: 10,
            background: 'rgba(255,255,255,0.025)',
            border:
              '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.65)',
              marginBottom: 9,
            }}
          >
            Password requirements
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '7px 10px',
            }}
          >
            {passwordRequirements.map(
              (requirement) => {
                const passed =
                  requirement.test(password);

                return (
                  <div
                    key={requirement.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      fontSize: 11,
                      color: passed
                        ? 'var(--success)'
                        : 'rgba(255,255,255,0.42)',
                    }}
                  >
                    {passed ? (
                      <Check size={13} />
                    ) : (
                      <X size={13} />
                    )}

                    {requirement.label}
                  </div>
                );
              }
            )}
          </div>

          <button
            type="button"
            onClick={suggestPassword}
            style={{
              marginTop: 12,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: 0,
              border: 'none',
              background: 'transparent',
              color: 'var(--accent)',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            <Sparkles size={13} />
            Suggest a strong password
          </button>
        </div>

        {/* CONFIRM PASSWORD */}
        <label
          style={{
            display: 'block',
            marginTop: 14,
            marginBottom: 7,
            fontSize: 12,
            color: 'rgba(255,255,255,0.55)',
          }}
        >
          Confirm password
        </label>

        <div className="password-field">
          <input
            className="input"
            type={
              showConfirmPassword
                ? 'text'
                : 'password'
            }
            required
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError('');
            }}
            placeholder="Enter your password again"
            autoComplete="new-password"
          />

          <button
            type="button"
            className="password-toggle"
            onClick={() =>
              setShowConfirmPassword(
                (value) => !value
              )
            }
            aria-label={
              showConfirmPassword
                ? 'Hide confirmation password'
                : 'Show confirmation password'
            }
          >
            {showConfirmPassword ? (
              <EyeOff size={18} />
            ) : (
              <Eye size={18} />
            )}
          </button>
        </div>

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
            ? 'Updating password…'
            : 'Update password'}
        </button>

        <Link
          to="/login"
          style={{
            display: 'block',
            textAlign: 'center',
            marginTop: 14,
            fontSize: 13,
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          Back to sign in
        </Link>
      </form>
    </div>
  );
}