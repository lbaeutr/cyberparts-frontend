import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../test/render";
import LoginPage from "./LoginPage";

const auth = vi.hoisted(() => ({ current: {} }));

vi.mock("../context/AuthContext", () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => auth.current,
}));

function renderLogin(route = "/login") {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<div>pagina inicio</div>} />
      <Route path="/carrito" element={<div>pagina carrito</div>} />
    </Routes>,
    { route }
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    auth.current = { login: vi.fn().mockResolvedValue({ username: "neo" }) };
  });

  it("logs in and navigates home", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText("Usuario o correo"), "neo");
    await user.type(screen.getByLabelText("Contraseña"), "Matrix123!");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(auth.current.login).toHaveBeenCalledWith("neo", "Matrix123!");
    expect(await screen.findByText("pagina inicio")).toBeInTheDocument();
  });

  it("links to the GitHub OAuth flow", () => {
    renderLogin();

    expect(screen.getByRole("link", { name: "Entrar con GitHub" })).toHaveAttribute(
      "href",
      "/api/auth/oauth/github/start"
    );
  });

  it("redirects authenticated users to the catalog", async () => {
    auth.current = { user: { username: "neo" }, initializing: false, login: vi.fn() };
    renderLogin();

    expect(await screen.findByText("pagina inicio")).toBeInTheDocument();
    expect(screen.queryByLabelText("Usuario o correo")).not.toBeInTheDocument();
  });

  it("returns to the requested page after login", async () => {
    const user = userEvent.setup();
    renderLogin({ pathname: "/login", state: { from: "/carrito" } });

    await user.type(screen.getByLabelText("Usuario o correo"), "neo");
    await user.type(screen.getByLabelText("Contraseña"), "Matrix123!");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("pagina carrito")).toBeInTheDocument();
  });

  it("shows the API error message", async () => {
    auth.current.login.mockRejectedValue({
      response: { data: { detail: "Credenciales incorrectas" } },
    });
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText("Usuario o correo"), "neo");
    await user.type(screen.getByLabelText("Contraseña"), "mala");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Credenciales incorrectas")).toBeInTheDocument();
  });
});
