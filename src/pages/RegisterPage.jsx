import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import GitHubLoginButton from "../components/GitHubLoginButton";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/errors";

export default function RegisterPage() {
  const { user, initializing, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!initializing && user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigate("/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo completar el registro"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="card">
        <span className="eyebrow">Nuevo operador</span>
        <h1>Crear cuenta</h1>
        <p className="muted" style={{ fontSize: "0.85rem" }}>
          Tu contraseña se almacena hasheada con bcrypt. Los nuevos registros se crean como rol{" "}
          <strong>Cliente</strong>.
        </p>

        {error && (
          <div className="alert error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="register-username">Usuario</label>
            <input
              id="register-username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              minLength={3}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="register-email">Correo</label>
            <input
              id="register-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="register-password">Contraseña (mín. 8)</label>
            <input
              id="register-password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={8}
              required
            />
          </div>
          <button className="btn primary" style={{ width: "100%" }} disabled={loading}>
            {loading ? "Creando..." : "Registrarme"}
          </button>
        </form>

        <div className="auth-divider">o</div>
        <GitHubLoginButton label="Registrarme con GitHub" />

        <p className="muted center" style={{ fontSize: "0.85rem", marginTop: "1rem" }}>
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
