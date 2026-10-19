import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProtectedRoute from "./ProtectedRoute";

const auth = vi.hoisted(() => ({ current: {} }));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => auth.current,
}));

function renderProtected(path = "/privado", roles = ["ADMIN"]) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/privado"
          element={
            <ProtectedRoute roles={roles}>
              <div>contenido privado</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>pagina login</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    auth.current = { user: null, initializing: true };
  });

  it("shows a loading state while the session is restored", () => {
    renderProtected();

    expect(screen.getByText("Cargando sesión...")).toBeInTheDocument();
  });

  it("redirects anonymous users to login", () => {
    auth.current = { user: null, initializing: false };

    renderProtected();

    expect(screen.getByText("pagina login")).toBeInTheDocument();
  });

  it("denies access when the role is not allowed", () => {
    auth.current = { user: { role: "CLIENTE" }, initializing: false };

    renderProtected();

    expect(screen.getByText("Acceso denegado")).toBeInTheDocument();
    expect(screen.queryByText("contenido privado")).not.toBeInTheDocument();
  });

  it("renders the content when the role is allowed", () => {
    auth.current = { user: { role: "ADMIN" }, initializing: false };

    renderProtected();

    expect(screen.getByText("contenido privado")).toBeInTheDocument();
  });

  it("renders the content when no roles are required", () => {
    auth.current = { user: { role: "CLIENTE" }, initializing: false };

    renderProtected("/privado", null);

    expect(screen.getByText("contenido privado")).toBeInTheDocument();
  });
});
