import { useEffect, useRef } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { categoryNavItems, navItems } from "../utils/navItems";

export default function Sidebar({ open, onClose }) {
  const { hasRole, user } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get("category");
  const asideRef = useRef(null);

  const isCatalog = location.pathname === "/";
  const items = navItems({ user, hasRole });
  const mainItems = items.filter((item) => item.group === "main");
  const managementItems = items.filter((item) => item.group === "management");
  const categories = categoryNavItems();

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
        {mainItems.map((item) => (
          <Link
            key={item.to}
            className={`side-link${location.pathname === item.to ? " active" : ""}`}
            to={item.to}
          >
            <span aria-hidden="true">{item.icon}</span> {item.label}
          </Link>
        ))}

        <h4>Categorías</h4>
        {categories.map((item) => (
          <Link
            key={item.category ?? item.to}
            className={`side-link${
              isCatalog && (item.category ? activeCategory === item.category : !activeCategory)
                ? " active"
                : ""
            }`}
            to={item.to}
          >
            <span aria-hidden="true">{item.icon}</span> {item.label}
          </Link>
        ))}

        {managementItems.length > 0 && (
          <>
            <h4>Gestión</h4>
            {managementItems.map((item) => (
              <Link
                key={item.to}
                className={`side-link${location.pathname === item.to ? " active" : ""}`}
                to={item.to}
              >
                <span aria-hidden="true">{item.icon}</span> {item.label}
              </Link>
            ))}
          </>
        )}
      </aside>
    </>
  );
}
