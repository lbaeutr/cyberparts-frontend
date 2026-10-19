import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { usersApi } from "../api/services";
import { useAuth } from "../context/AuthContext";
import { ROLE_LABEL } from "../utils/format";

const ROLES = ["ADMIN", "GESTOR", "CLIENTE"];

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const { user: me } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.list(),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["users"] });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => usersApi.setRole(id, role),
    onSuccess: invalidate,
  });
  const activeMutation = useMutation({
    mutationFn: ({ id, is_active }) => usersApi.setActive(id, is_active),
    onSuccess: invalidate,
  });
  const removeMutation = useMutation({
    mutationFn: (id) => usersApi.remove(id),
    onSuccess: invalidate,
  });

  if (isLoading) return <div className="loading">Cargando usuarios...</div>;
  if (error) return <div className="alert error">No se pudieron cargar los usuarios.</div>;

  const stats = ROLES.map((r) => ({ role: r, count: data.filter((u) => u.role === r).length }));

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Administración</span>
          <h1>Usuarios y roles</h1>
          <p>Asigna roles y activa o desactiva cuentas.</p>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: "1.5rem" }}>
        {stats.map((s) => (
          <div className="stat" key={s.role}>
            <div className="value">{s.count}</div>
            <div className="label">{ROLE_LABEL[s.role]}</div>
          </div>
        ))}
        <div className="stat">
          <div className="value">{data.length}</div>
          <div className="label">Total</div>
        </div>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.map((u) => (
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
                    disabled={u.id === me.id}
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
                        onClick={() => activeMutation.mutate({ id: u.id, is_active: !u.is_active })}
                      >
                        {u.is_active ? "Desactivar" : "Activar"}
                      </button>
                      <button className="btn sm danger" onClick={() => removeMutation.mutate(u.id)}>
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
    </>
  );
}
