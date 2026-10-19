import { useState } from "react";
import { Outlet } from "react-router-dom";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function AppLayout() {
  const [open, setOpen] = useState(() => window.innerWidth > 860);

  return (
    <div className="app-shell">
      <Navbar onToggleSidebar={() => setOpen((v) => !v)} sidebarOpen={open} />
      <div className="body-row">
        <Sidebar open={open} onClose={() => setOpen(false)} />
        <main className="content">
          <Outlet />
        </main>
      </div>
      <footer className="footer">
        CyberParts © {new Date().getFullYear()} — Tienda de piezas robóticas · PPS
      </footer>
    </div>
  );
}
