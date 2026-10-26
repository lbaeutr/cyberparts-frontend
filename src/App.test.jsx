import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";
import { renderWithProviders } from "./test/render";

const mocks = vi.hoisted(() => ({
  listProducts: vi.fn(),
}));

vi.mock("./api/client", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    refreshSession: vi.fn().mockRejectedValue(new Error("sin sesion")),
  };
});

vi.mock("./api/services", () => ({
  authApi: { login: vi.fn(), register: vi.fn(), logout: vi.fn() },
  productsApi: {
    list: mocks.listProducts,
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
  usersApi: { list: vi.fn(), setRole: vi.fn(), setActive: vi.fn(), remove: vi.fn() },
  ordersApi: { list: vi.fn(), create: vi.fn(), setStatus: vi.fn() },
}));

const product = {
  id: 1,
  name: "Servomotor de prueba",
  description: "Servo",
  category: "Servomotores",
  price: "10.00",
  stock: 2,
  image_url: null,
};

describe("App routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listProducts.mockResolvedValue([product]);
  });

  it("renders the catalog with lazy loading", async () => {
    renderWithProviders(<App />, { route: "/" });

    expect(await screen.findByText("Servomotor de prueba")).toBeInTheDocument();
  });

  it("renders the login page", async () => {
    renderWithProviders(<App />, { route: "/login" });

    expect(await screen.findByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();
  });

  it("redirects anonymous users away from protected routes", async () => {
    renderWithProviders(<App />, { route: "/pedidos" });

    expect(await screen.findByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();
  });

  it("protects the profile route", async () => {
    renderWithProviders(<App />, { route: "/perfil" });

    expect(await screen.findByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();
  });

  it("shows the not found page", async () => {
    renderWithProviders(<App />, { route: "/ruta-inexistente" });

    expect(await screen.findByText("Señal perdida")).toBeInTheDocument();
  });
});
