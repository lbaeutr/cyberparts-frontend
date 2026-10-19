import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../test/render";
import CatalogPage from "./CatalogPage";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  auth: { current: { user: null, hasRole: () => false } },
}));

vi.mock("../api/services", () => ({
  productsApi: {
    list: mocks.list,
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock("../context/AuthContext", () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => mocks.auth.current,
}));

const products = [
  {
    id: 1,
    name: "Servomotor X1",
    description: "Servo de alta precision",
    category: "Servomotores",
    price: "99.99",
    stock: 4,
  },
  {
    id: 2,
    name: "Sensor Termico",
    description: "Sensor de temperatura",
    category: "Sensores",
    price: "49.90",
    stock: 2,
  },
];

describe("CatalogPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.list.mockResolvedValue(products);
  });

  it("renders the product list", async () => {
    renderWithProviders(<CatalogPage />);

    expect(await screen.findByText("Servomotor X1")).toBeInTheDocument();
    expect(screen.getByText("Sensor Termico")).toBeInTheDocument();
  });

  it("filters products by search text", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CatalogPage />);
    await screen.findByText("Servomotor X1");

    await user.type(screen.getByLabelText("Buscar componente"), "sensor");

    expect(screen.getByText("Sensor Termico")).toBeInTheDocument();
    expect(screen.queryByText("Servomotor X1")).not.toBeInTheDocument();
  });

  it("requests products by category", async () => {
    renderWithProviders(<CatalogPage />, { route: "/?category=Sensores" });

    expect(await screen.findByText("Módulos / Sensores")).toBeInTheDocument();
    expect(mocks.list).toHaveBeenCalledWith({ category: "Sensores", limit: 100 });
  });

  it("shows an empty state", async () => {
    mocks.list.mockResolvedValue([]);
    renderWithProviders(<CatalogPage />);

    expect(await screen.findByText("Sin resultados en esta categoría.")).toBeInTheDocument();
  });

  it("shows an error state", async () => {
    mocks.list.mockRejectedValue(new Error("boom"));
    renderWithProviders(<CatalogPage />);

    expect(await screen.findByText("No se pudo cargar el catálogo.")).toBeInTheDocument();
  });
});
