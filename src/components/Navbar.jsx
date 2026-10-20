import { Link, NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { ROLE_LABEL } from "../utils/format";

const linkClass = ({ isActive }) => `nav-item${isActive ? " active" : ""}`;

export default function Navbar({ onToggleSidebar, sidebarOpen }) {
  const { user, logout, hasRole } = useAuth();
  const { count } = useCart();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <button
        className="icon-btn"
        onClick={onToggleSidebar}
        title="Menú"
        aria-label="Menú"
        aria-expanded={sidebarOpen}
      >
        ☰
      </button>

      <Link to="/" className="brand">
        <span className="logo">⬢</span>
        CYBER<span className="brand-sub">PARTS</span>
      </Link>

      <div className="nav-links">
        <NavLink to="/" className={linkClass} end>
          Catálogo
        </NavLink>
        <NavLink to="/carrito" className={linkClass}>
          Carrito {count > 0 && `(${count})`}
        </NavLink>
        {user && (
          <NavLink to="/pedidos" className={linkClass}>
            Pedidos
          </NavLink>
        )}
        {hasRole("ADMIN", "GESTOR") && (
          <NavLink to="/panel" className={linkClass}>
            Panel
          </NavLink>
        )}
        {hasRole("ADMIN") && (
          <NavLink to="/admin/usuarios" className={linkClass}>
            Usuarios
          </NavLink>
        )}
      </div>

      <div className="spacer" />

      <button
        className="icon-btn"
        onClick={toggle}
        title="Cambiar tema"
        aria-label={theme === "dark" ? "Activar tema claro" : "Activar tema oscuro"}
      >
        {theme === "dark" ? "☀" : "☾"}
      </button>

      {user ? (
        <div className="row" style={{ gap: "0.5rem" }}>
          <span className={`badge role-${user.role} hide-sm`}>{ROLE_LABEL[user.role]}</span>
          <span className="mono hide-sm" style={{ fontSize: "0.85rem" }}>
            {user.username}
          </span>
          <button className="btn sm ghost" onClick={handleLogout}>
            Salir
          </button>
        </div>
      ) : (
        <div className="row" style={{ gap: "0.5rem" }}>
          <Link className="btn sm ghost" to="/login">
            Entrar
          </Link>
          <Link className="btn sm primary" to="/register">
            Registrarse
          </Link>
        </div>
      )}
    </nav>
  );
}
