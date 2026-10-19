import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ roles, children }) {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <div className="loading">Cargando sesión...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="card">
        <h3>Acceso denegado</h3>
        <p className="muted">No tienes permisos para ver esta sección.</p>
      </div>
    );
  }
  return children;
}
