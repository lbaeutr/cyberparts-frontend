import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { usersApi } from "../api/services";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../utils/errors";
import { ROLE_LABEL } from "../utils/format";
import { ROLES } from "../utils/roles";

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const { notify } = useToast();
  const [page, setPage] = useState(0);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.list({ limit: 200 }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["users"] });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => usersApi.setRole(id, role),
    onSuccess: () => {
      invalidate();
      notify("Rol actualizado.");
    },
    onError: (err) => notify(getErrorMessage(err, "No se pudo cambiar el rol"), "error"),
  });
  const activeMutation = useMutation({
    mutationFn: ({ id, is_active }) => usersApi.setActive(id, is_active),
    onSuccess: () => {
      invalidate();
      notify("Estado de la cuenta actualizado.");
    },
    onError: (err) => notify(getErrorMessage(err, "No se pudo cambiar el estado"), "error"),
  });
  const removeMutation = useMutation({
    mutationFn: (id) => usersApi.remove(id),
    onSuccess: () => {
      invalidate();
      notify("Usuario desactivado.");
    },
    onError: (err) => notify(getErrorMessage(err, "No se pudo desactivar el usuario"), "error"),
  });

  const header = (
    <div className="page-head">
      <div>
        <span className="eyebrow">Administración</span>
        <h1>Usuarios y roles</h1>
        <p>Asigna roles y activa o desactiva cuentas.</p>
      </div>
    </div>
  );

  if (isLoading)
    return (
      <div className="loading" role="status">
        Cargando usuarios...
      </div>
    );
  if (error) {
    return (
      <>
        {header}
        <div className="alert error" role="alert">
          No se pudieron cargar los usuarios.
        </div>
        <button className="btn ghost" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? "Reintentando..." : "Reintentar"}
        </button>
      </>
    );
  }

  const users = data ?? [];
  const stats = ROLES.map((role) => ({
    role,
    count: users.filter((u) => u.role === role).length,
  }));
  const pageCount = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const visibleUsers = users.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const isBusy = (id) =>
    (roleMutation.isPending && roleMutation.variables?.id === id) ||
    (activeMutation.isPending && activeMutation.variables?.id === id) ||
    (removeMutation.isPending && removeMutation.variables === id);

  const toggleActive = (u) => {
    if (u.is_active && !window.confirm(`¿Desactivar la cuenta de ${u.username}?`)) return;
    activeMutation.mutate({ id: u.id, is_active: !u.is_active });
  };

  const removeUser = (u) => {
    if (!window.confirm(`¿Eliminar (desactivar) la cuenta de ${u.username}?`)) return;
    removeMutation.mutate(u.id);
  };

  return (
    <>
      {header}

      <div className="stat-grid" style={{ marginBottom: "1.5rem" }}>
        {stats.map((s) => (
          <div className="stat" key={s.role}>
            <div className="value">{s.count}</div>
            <div className="label">{ROLE_LABEL[s.role]}</div>
          </div>
        ))}
        <div className="stat">
          <div className="value">{users.length}</div>
          <div className="label">Total</div>
        </div>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Usuario</th>
              <th scope="col">Correo</th>
              <th scope="col">Rol</th>
              <th scope="col">Estado</th>
              <th scope="col"></th>
            </tr>
          </thead>
          <tbody>
            {visibleUsers.map((u) => (
              <tr key={u.id}>
                <td className="muted">#{u.id}</td>
                <td>
                  {u.username} {u.id === me.id && <span className="muted">(tú)</span>}
                </td>
                <td className="muted">{u.email}</td>
                <td>
                  <select
                    aria-label={`Rol de ${u.username}`}
                    value={u.role}
                    disabled={u.id === me.id || isBusy(u.id)}
                    onChange={(e) => roleMutation.mutate({ id: u.id, role: e.target.value })}
                    style={{ maxWidth: 150 }}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <span className="badge">{u.is_active ? "Activo" : "Inactivo"}</span>
                </td>
                <td>
                  {u.id !== me.id && (
                    <div className="row" style={{ gap: "0.4rem" }}>
                      <button
                        className="btn sm ghost"
                        onClick={() => toggleActive(u)}
                        disabled={isBusy(u.id)}
                      >
                        {isBusy(u.id) ? "..." : u.is_active ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        className="btn sm danger"
                        onClick={() => removeUser(u)}
                        disabled={isBusy(u.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="row" style={{ marginTop: "1rem" }}>
          <span className="muted">
            Página {currentPage + 1} de {pageCount}
          </span>
          <div className="row right" style={{ gap: "0.5rem" }}>
            <button
              className="btn sm ghost"
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage === 0}
            >
              Anterior
            </button>
            <button
              className="btn sm ghost"
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage >= pageCount - 1}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </>
  );
}
