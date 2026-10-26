import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { authApi } from "../api/services";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../utils/errors";
import { ROLE_LABEL } from "../utils/format";
import { redirectTo } from "../utils/navigation";

const OAUTH_MESSAGES = {
  access_denied: "Cancelaste la autorización en GitHub.",
  github_in_use: "Esa cuenta de GitHub ya está vinculada a otro usuario.",
  github_already_linked: "Tu usuario ya tiene otra cuenta de GitHub vinculada.",
  invalid_state: "La sesión de autorización caducó. Inténtalo de nuevo.",
  account_disabled: "Tu cuenta está desactivada. Contacta con el administrador.",
  not_configured: "El acceso con GitHub no está configurado en este entorno.",
  oauth_unavailable: "No se pudo contactar con GitHub. Inténtalo más tarde.",
};

export default function ProfilePage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [passwordError, setPasswordError] = useState("");
  const [linkError, setLinkError] = useState("");
  const [linking, setLinking] = useState(false);

  const accountsQuery = useQuery({
    queryKey: ["oauth-accounts"],
    queryFn: authApi.oauthAccounts,
  });

  useEffect(() => {
    const linked = searchParams.get("oauth");
    const oauthError = searchParams.get("oauth_error");
    if (!linked && !oauthError) return;

    if (linked === "linked") {
      notify("Cuenta de GitHub vinculada.", "ok");
      queryClient.invalidateQueries({ queryKey: ["oauth-accounts"] });
    }
    if (oauthError) {
      setLinkError(OAUTH_MESSAGES[oauthError] || "No se pudo vincular la cuenta de GitHub.");
    }
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams, notify, queryClient]);

  const changePassword = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      setPasswordError("");
      setForm({ current: "", next: "", confirm: "" });
      notify("Contraseña actualizada.", "ok");
    },
    onError: (err) => {
      setPasswordError(getErrorMessage(err, "No se pudo cambiar la contraseña."));
    },
  });

  const unlink = useMutation({
    mutationFn: authApi.unlinkGithub,
    onSuccess: () => {
      setLinkError("");
      queryClient.invalidateQueries({ queryKey: ["oauth-accounts"] });
      notify("Cuenta de GitHub desvinculada.", "ok");
    },
    onError: (err) => {
      setLinkError(getErrorMessage(err, "No se pudo desvincular GitHub."));
    },
  });

  const submitPassword = (event) => {
    event.preventDefault();
    setPasswordError("");

    if (form.next.length < 8) {
      setPasswordError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (form.next !== form.confirm) {
      setPasswordError("La confirmación no coincide con la nueva contraseña.");
      return;
    }

    changePassword.mutate({
      current_password: user.has_password ? form.current : undefined,
      new_password: form.next,
    });
  };

  const startLink = async () => {
    setLinkError("");
    setLinking(true);
    try {
      const { authorize_url } = await authApi.startGithubLink();
      redirectTo(authorize_url);
    } catch (err) {
      setLinkError(getErrorMessage(err, "No se pudo iniciar la vinculación con GitHub."));
    } finally {
      setLinking(false);
    }
  };

  const confirmUnlink = () => {
    if (!window.confirm("¿Desvincular tu cuenta de GitHub?")) return;
    unlink.mutate();
  };

  const github = accountsQuery.data?.github ?? null;

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Cuenta</span>
          <h1>Mi perfil</h1>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h3>Datos de la cuenta</h3>
          <p>
            <strong>{user.username}</strong>
          </p>
          <p className="muted">{user.email}</p>
          <span className={`badge role-${user.role}`}>{ROLE_LABEL[user.role]}</span>
        </div>

        <div className="card">
          <h3>Contraseña</h3>
          {!user.has_password && (
            <p className="muted" style={{ fontSize: "0.85rem" }}>
              Tu cuenta entra solo con GitHub. Define una contraseña para poder acceder sin GitHub y
              desvincular la cuenta.
            </p>
          )}
          {passwordError && (
            <div className="alert error" role="alert">
              {passwordError}
            </div>
          )}
          <form onSubmit={submitPassword}>
            {user.has_password && (
              <div className="field">
                <label htmlFor="current-password">Contraseña actual</label>
                <input
                  id="current-password"
                  type="password"
                  value={form.current}
                  onChange={(e) => setForm({ ...form, current: e.target.value })}
                  autoComplete="current-password"
                  required
                />
              </div>
            )}
            <div className="field">
              <label htmlFor="new-password">Nueva contraseña</label>
              <input
                id="new-password"
                type="password"
                value={form.next}
                onChange={(e) => setForm({ ...form, next: e.target.value })}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="confirm-password">Repetir nueva contraseña</label>
              <input
                id="confirm-password"
                type="password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <button className="btn primary" disabled={changePassword.isPending}>
              {changePassword.isPending ? "Guardando..." : "Cambiar contraseña"}
            </button>
          </form>
        </div>

        <div className="card">
          <h3>GitHub</h3>
          {linkError && (
            <div className="alert error" role="alert">
              {linkError}
            </div>
          )}
          {accountsQuery.isLoading ? (
            <p className="muted" role="status">
              Comprobando la vinculación...
            </p>
          ) : accountsQuery.isError ? (
            <p className="alert error" role="alert">
              No se pudo comprobar la vinculación con GitHub.
            </p>
          ) : github ? (
            <>
              <p>
                Vinculado como <strong>@{github.username}</strong>
              </p>
              <p className="muted" style={{ fontSize: "0.85rem" }}>
                {github.email}
              </p>
              <button
                className="btn danger"
                onClick={confirmUnlink}
                disabled={!user.has_password || unlink.isPending}
                title={
                  user.has_password
                    ? undefined
                    : "Define una contraseña antes de desvincular GitHub"
                }
              >
                {unlink.isPending ? "Desvinculando..." : "Desvincular GitHub"}
              </button>
            </>
          ) : (
            <>
              <p className="muted" style={{ fontSize: "0.85rem" }}>
                Vincula tu cuenta de GitHub para entrar con ella manteniendo el mismo usuario.
              </p>
              <button className="btn github" onClick={startLink} disabled={linking}>
                {linking ? "Redirigiendo..." : "Vincular GitHub"}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
