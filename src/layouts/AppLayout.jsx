import { Suspense, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 860);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 860);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return isMobile;
}

export default function AppLayout() {
  const [open, setOpen] = useState(() => window.innerWidth > 860);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile || !open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isMobile, open]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <Navbar onToggleSidebar={() => setOpen((v) => !v)} sidebarOpen={open} />
      <div className="body-row">
        <Sidebar open={open} onClose={() => setOpen(false)} />
        <main id="contenido" className="content" tabIndex={-1}>
          <Suspense
            fallback={
              <div className="loading" role="status">
                Cargando página...
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
      <footer className="footer">
        CyberParts © {new Date().getFullYear()} — Tienda de piezas robóticas · PPS
      </footer>
    </div>
  );
}
