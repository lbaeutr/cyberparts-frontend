import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import GitHubLoginButton from "../components/GitHubLoginButton";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/errors";

export default function LoginPage() {
  const { user, initializing, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!initializing && user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate(location.state?.from || "/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo iniciar sesión"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="card">
        <span className="eyebrow">Acceso</span>
        <h1>Iniciar sesión</h1>
        <p className="muted" style={{ fontSize: "0.85rem" }}>
          Autenticación con JWT + refresh token (cookie httpOnly).
        </p>

        {error && (
          <div className="alert error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="login-username">Usuario o correo</label>
            <input
              id="login-username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              autoComplete="username"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="login-password">Contraseña</label>
            <input
              id="login-password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="current-password"
              required
            />
          </div>
          <button className="btn primary" style={{ width: "100%" }} disabled={loading}>
            {loading ? "Verificando..." : "Entrar"}
          </button>
        </form>

        <div className="auth-divider">o</div>
        <GitHubLoginButton />

        <p className="muted center" style={{ fontSize: "0.85rem", marginTop: "1rem" }}>
          ¿Sin cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}
