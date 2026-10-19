import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../test/render";
import AppLayout from "./AppLayout";

const auth = vi.hoisted(() => ({ current: {} }));

vi.mock("../context/AuthContext", () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => auth.current,
}));

function renderLayout() {
  return renderWithProviders(
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<div>pagina inicio</div>} />
        <Route path="carrito" element={<div>pagina carrito</div>} />
      </Route>
    </Routes>
  );
}

describe("AppLayout", () => {
  beforeEach(() => {
    auth.current = {
      user: { username: "smith", role: "ADMIN" },
      hasRole: (...roles) => roles.includes("ADMIN") || roles.includes("GESTOR"),
      logout: vi.fn(),
    };
  });

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  it("shows the admin navigation links and the session user", () => {
    renderLayout();

    expect(screen.getByText("smith")).toBeInTheDocument();
    expect(screen.getByText("Administrador")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Panel" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Usuarios" }).length).toBeGreaterThan(0);
  });

  it("hides management links for clients", () => {
    auth.current = {
      user: { username: "neo", role: "CLIENTE" },
      hasRole: () => false,
      logout: vi.fn(),
    };

    renderLayout();

    expect(screen.queryByRole("link", { name: "Panel" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Usuarios" })).not.toBeInTheDocument();
  });

  it("shows the cart count", () => {
    localStorage.setItem(
      "cyberparts-cart",
      JSON.stringify([{ product_id: 1, name: "Servo", price: 10, stock: 5, quantity: 3 }])
    );

    renderLayout();

    expect(screen.getByRole("link", { name: /Carrito \(3\)/ })).toBeInTheDocument();
  });

  it("toggles the theme", async () => {
    const user = userEvent.setup();
    renderLayout();
    await waitFor(() =>
      expect(document.documentElement).toHaveAttribute("data-theme", "dark")
    );

    await user.click(screen.getByTitle("Cambiar tema"));

    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it("toggles the sidebar on small screens", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 500,
    });
    const user = userEvent.setup();
    renderLayout();

    const toggle = screen.getByRole("button", { name: "Menú" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("logs out and navigates home", async () => {
    const user = userEvent.setup();
    renderLayout();

    await user.click(screen.getByRole("button", { name: "Salir" }));

    expect(auth.current.logout).toHaveBeenCalled();
  });
});
