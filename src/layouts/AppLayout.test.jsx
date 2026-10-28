import { screen, waitFor, within } from "@testing-library/react";
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
    expect(screen.getAllByRole("link", { name: "Panel" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Usuarios" })).toHaveLength(2);
  });

  it("renders the same main navigation in the navbar and the sidebar", () => {
    renderLayout();

    const navbar = within(screen.getByRole("navigation"));
    const sidebar = within(screen.getByRole("complementary"));

    for (const name of ["Catálogo", "Carrito", "Pedidos", "Panel", "Usuarios"]) {
      expect(navbar.getByRole("link", { name })).toBeInTheDocument();
      expect(sidebar.getByRole("link", { name })).toBeInTheDocument();
    }
    expect(sidebar.getByRole("link", { name: "Mi perfil" })).toHaveAttribute("href", "/perfil");
    expect(navbar.queryByRole("link", { name: "Mi perfil" })).not.toBeInTheDocument();
  });

  it("shows only the panel link to gestors", () => {
    auth.current = {
      user: { username: "trinity", role: "GESTOR" },
      hasRole: (...roles) => roles.includes("GESTOR"),
      logout: vi.fn(),
    };

    renderLayout();

    expect(screen.getAllByRole("link", { name: "Panel" })).toHaveLength(2);
    expect(screen.queryAllByRole("link", { name: "Usuarios" })).toHaveLength(0);
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
    await waitFor(() => expect(document.documentElement).toHaveAttribute("data-theme", "dark"));

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

  it("moves focus into the sidebar when it opens on small screens", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 500,
    });
    const user = userEvent.setup();
    renderLayout();

    await user.click(screen.getByRole("button", { name: "Menú" }));

    const sidebar = screen.getByRole("complementary");
    const firstLink = within(sidebar).getAllByRole("link")[0];
    expect(firstLink).toHaveFocus();
  });

  it("closes the sidebar with Escape on small screens", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 500,
    });
    const user = userEvent.setup();
    renderLayout();

    const toggle = screen.getByRole("button", { name: "Menú" });
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");

    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("offers a skip link to the main content", () => {
    renderLayout();

    expect(screen.getByRole("link", { name: "Saltar al contenido" })).toHaveAttribute(
      "href",
      "#contenido"
    );
    expect(document.querySelector("main")).toHaveAttribute("id", "contenido");
  });

  it("logs out and navigates home", async () => {
    const user = userEvent.setup();
    renderLayout();

    await user.click(screen.getByRole("button", { name: "Salir" }));

    expect(auth.current.logout).toHaveBeenCalled();
  });
});
