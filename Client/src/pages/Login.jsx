import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useSession } from "../store/session";

export default function Login() {
  const login = useSession((s) => s.login);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    const res = await login(email.trim(), password);

    setLoading(false);

    if (!res.ok) {
      if (res.requiresVerification) {
        navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`);
        return;
      }

      setError(res.error);
      return;
    }

    navigate("/");
  };

  return (
    <div
      className="public-shell"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px 16px",
      }}
    >
      <div className="site-bg" />

      <form
        onSubmit={submit}
        className="card"
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 400,
          padding: 32,
          margin: 16,
        }}
      >
        <Link to="/" className="auth-back-home">
          <ArrowLeft size={15} />
          Back to home
        </Link>

        <Link to="/" className="auth-brand">
          <img src="/logo.jpg" alt="" />
          <span style={{ color: "var(--accent)" }}>Event</span>
          Sphere
        </Link>

        <h1
          style={{
            textAlign: "center",
            color: "#fff",
            margin: 0,
          }}
        >
          Sign in
        </h1>

        <p
          style={{
            textAlign: "center",
            fontSize: 13,
            color: "rgba(255,255,255,0.5)",
            marginTop: 6,
          }}
        >
          Sign in with your EventSphere account
        </p>

        <label
          style={{
            display: "block",
            marginTop: 20,
            marginBottom: 7,
            fontSize: 12,
            color: "rgba(255,255,255,0.55)",
          }}
        >
          Email
        </label>

        <input
          className="input"
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          autoComplete="email"
          placeholder="Enter your email"
        />

        <label
          style={{
            display: "block",
            marginTop: 12,
            fontSize: 12,
            color: "rgba(255,255,255,0.55)",
          }}
        >
          Password
        </label>

        <div className="password-field" style={{ marginTop: 6 }}>
          <input
            className="input"
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
          />

          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
        <div
          style={{
            textAlign: "right",
            marginTop: 9,
          }}
        >
          <Link
            to="/forgot-password"
            style={{
              fontSize: 12,
              color: "var(--accent)",
            }}
          >
            Forgot password?
          </Link>
        </div>

        {error && (
          <p
            style={{
              color: "#fb7185",
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
            width: "100%",
            marginTop: 20,
          }}
          disabled={loading}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <p
          style={{
            textAlign: "center",
            marginTop: 16,
            fontSize: 13,
            color: "rgba(255,255,255,0.5)",
          }}
        >
          New here?{" "}
          <Link to="/register" style={{ color: "var(--accent)" }}>
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}
