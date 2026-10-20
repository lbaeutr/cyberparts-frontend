import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../test/render";
import RegisterPage from "./RegisterPage";

const auth = vi.hoisted(() => ({ current: {} }));

vi.mock("../context/AuthContext", () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => auth.current,
}));

function renderRegister() {
  return renderWithProviders(
    <Routes>
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<div>pagina inicio</div>} />
    </Routes>,
    { route: "/register" }
  );
}

async function fillForm(password = "Matrix123!") {
  renderRegister();
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Usuario"), "neo");
  await user.type(screen.getByLabelText("Correo"), "neo@matrix.dev");
  await user.type(screen.getByLabelText("Contraseña (mín. 8)"), password);
  return user;
}

describe("RegisterPage", () => {
  beforeEach(() => {
    auth.current = { register: vi.fn().mockResolvedValue({ username: "neo" }) };
  });

  it("redirects authenticated users to the catalog", async () => {
    auth.current = { user: { username: "neo" }, initializing: false, register: vi.fn() };
    renderRegister();

    expect(await screen.findByText("pagina inicio")).toBeInTheDocument();
    expect(screen.queryByLabelText("Usuario")).not.toBeInTheDocument();
  });

  it("registers and navigates home", async () => {
    const user = await fillForm();

    await user.click(screen.getByRole("button", { name: "Registrarme" }));

    expect(auth.current.register).toHaveBeenCalledWith({
      username: "neo",
      email: "neo@matrix.dev",
      password: "Matrix123!",
    });
    expect(await screen.findByText("pagina inicio")).toBeInTheDocument();
  });

  it("rejects short passwords without calling the API", async () => {
    const user = await fillForm("corta");

    await user.click(screen.getByRole("button", { name: "Registrarme" }));

    expect(
      await screen.findByText("La contraseña debe tener al menos 8 caracteres.")
    ).toBeInTheDocument();
    expect(auth.current.register).not.toHaveBeenCalled();
  });

  it("shows the API error message", async () => {
    auth.current.register.mockRejectedValue({
      response: { data: { detail: "El usuario o correo ya esta registrado" } },
    });
    const user = await fillForm();

    await user.click(screen.getByRole("button", { name: "Registrarme" }));

    expect(await screen.findByText("El usuario o correo ya esta registrado")).toBeInTheDocument();
  });
});
