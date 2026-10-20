import { useEffect, useRef } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { CATEGORIES, categoryIcon } from "../utils/format";

export default function Sidebar({ open, onClose }) {
  const { hasRole, user } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get("category");
  const asideRef = useRef(null);

  const isCatalog = location.pathname === "/";

  useEffect(() => {
    if (!open) return;
    const node = asideRef.current;
    const isMobile = window.innerWidth <= 860;
    const previouslyFocused = document.activeElement;

    const focusableItems = () =>
      node
        ? Array.from(
            node.querySelectorAll(
              'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
          )
        : [];

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !isMobile) return;
      const items = focusableItems();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    if (isMobile) focusableItems()[0]?.focus();

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (isMobile && previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open, onClose]);

  return (
    <>
      <div
        className={`sidebar-backdrop${open ? " open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        ref={asideRef}
        className={`sidebar${open ? " open" : " collapsed"}`}
        aria-hidden={!open}
        inert={open ? undefined : ""}
        onClick={() => {
          if (window.innerWidth <= 860) onClose();
        }}
      >
        <h4>Navegación</h4>
        <Link className={`side-link${location.pathname === "/" ? " active" : ""}`} to="/">
          <span>◈</span> Catálogo
        </Link>
        <Link
          className={`side-link${location.pathname === "/carrito" ? " active" : ""}`}
          to="/carrito"
        >
          <span>▤</span> Carrito
        </Link>
        {user && (
          <Link
            className={`side-link${location.pathname === "/pedidos" ? " active" : ""}`}
            to="/pedidos"
          >
            <span>⌘</span> Pedidos
          </Link>
        )}

        <h4>Categorías</h4>
        <Link className={`side-link${isCatalog && !activeCategory ? " active" : ""}`} to="/">
          <span>⬡</span> Todas
        </Link>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            className={`side-link${isCatalog && activeCategory === cat ? " active" : ""}`}
            to={`/?category=${encodeURIComponent(cat)}`}
          >
            <span>{categoryIcon(cat)}</span> {cat}
          </Link>
        ))}

        {hasRole("ADMIN", "GESTOR") && (
          <>
            <h4>Gestión</h4>
            <Link
              className={`side-link${location.pathname === "/panel" ? " active" : ""}`}
              to="/panel"
            >
              <span>⚙</span> Panel gestor
            </Link>
            {hasRole("ADMIN") && (
              <Link
                className={`side-link${location.pathname === "/admin/usuarios" ? " active" : ""}`}
                to="/admin/usuarios"
              >
                <span>☰</span> Usuarios
              </Link>
            )}
          </>
        )}
      </aside>
    </>
  );
}
