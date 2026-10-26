import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/errors";

const ERROR_MESSAGES = {
  access_denied: "Cancelaste la autorización en GitHub.",
  invalid_state: "La sesión de autorización caducó. Inténtalo de nuevo.",
  invalid_request: "GitHub devolvió una respuesta incompleta. Inténtalo de nuevo.",
  email_in_use:
    "Ya existe una cuenta con ese correo. Inicia sesión con tu contraseña para conservar tus datos.",
  email_unverified:
    "GitHub no proporcionó un correo verificado. Verifica tu correo en GitHub e inténtalo de nuevo.",
  account_disabled: "Tu cuenta está desactivada. Contacta con el administrador.",
  not_configured: "El acceso con GitHub no está configurado en este entorno.",
  oauth_unavailable: "No se pudo contactar con GitHub. Inténtalo más tarde.",
};

export default function OAuthCallbackPage() {
  const { completeOAuth } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const startedRef = useRef(false);
  const [error, setError] = useState("");

  const code = searchParams.get("code");
  const errorCode = searchParams.get("error");

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    window.history.replaceState({}, "", window.location.pathname);

    if (errorCode) {
      setError(ERROR_MESSAGES[errorCode] || "No se pudo completar el acceso con GitHub.");
      return;
    }
    if (!code) {
      setError("GitHub devolvió una respuesta incompleta. Inténtalo de nuevo.");
      return;
    }

    completeOAuth(code)
      .then(() => navigate("/", { replace: true }))
      .catch((err) =>
        setError(
          getErrorMessage(err, "No se pudo completar el acceso con GitHub. Inténtalo de nuevo.")
        )
      );
  }, [code, errorCode, completeOAuth, navigate]);

  return (
    <div className="auth-wrap">
      <div className="card">
        <span className="eyebrow">GitHub OAuth</span>
        <h1>{error ? "Acceso no completado" : "Conectando..."}</h1>
        {error ? (
          <>
            <div className="alert error" role="alert">
              {error}
            </div>
            <p className="muted center" style={{ fontSize: "0.85rem" }}>
              <Link to="/login">Volver al inicio de sesión</Link>
            </p>
          </>
        ) : (
          <p className="muted" role="status">
            Estamos validando tu identidad con GitHub. Esto solo tarda un momento.
          </p>
        )}
      </div>
    </div>
  );
}
