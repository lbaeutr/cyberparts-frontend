import { screen, waitFor } from "@testing-library/react";
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

  it("sends the search text to the api after a short delay", async () => {
    mocks.list.mockImplementation((params) =>
      Promise.resolve(params.search ? [products[1]] : products)
    );
    const user = userEvent.setup();
    renderWithProviders(<CatalogPage />);
    await screen.findByText("Servomotor X1");

    await user.type(screen.getByLabelText("Buscar componente"), "sensor");

    await waitFor(() => {
      expect(mocks.list).toHaveBeenLastCalledWith({
        skip: 0,
        limit: 12,
        search: "sensor",
      });
    });
    expect(await screen.findByText("Sensor Termico")).toBeInTheDocument();
    expect(screen.queryByText("Servomotor X1")).not.toBeInTheDocument();
  });

  it("reads the search from the url", async () => {
    renderWithProviders(<CatalogPage />, { route: "/?q=sensor" });

    expect(screen.getByLabelText("Buscar componente")).toHaveValue("sensor");
    await waitFor(() => {
      expect(mocks.list).toHaveBeenCalledWith({ skip: 0, limit: 12, search: "sensor" });
    });
  });

  it("requests products by category", async () => {
    renderWithProviders(<CatalogPage />, { route: "/?category=Sensores" });

    expect(await screen.findByText("Módulos / Sensores")).toBeInTheDocument();
    expect(mocks.list).toHaveBeenCalledWith({
      skip: 0,
      limit: 12,
      category: "Sensores",
    });
  });

  it("paginates the catalog", async () => {
    const many = Array.from({ length: 12 }, (_, index) => ({
      ...products[0],
      id: index + 1,
      name: `Pieza ${index + 1}`,
    }));
    mocks.list.mockResolvedValue(many);
    const user = userEvent.setup();
    renderWithProviders(<CatalogPage />);
    await screen.findByText("Pieza 1");

    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    await waitFor(() => {
      expect(mocks.list).toHaveBeenLastCalledWith({ skip: 12, limit: 12 });
    });
  });

  it("shows an empty state", async () => {
    mocks.list.mockResolvedValue([]);
    renderWithProviders(<CatalogPage />);

    expect(await screen.findByText("Sin resultados en esta categoría.")).toBeInTheDocument();
  });

  it("shows an error state with a retry button", async () => {
    mocks.list.mockRejectedValueOnce(new Error("boom"));
    const user = userEvent.setup();
    renderWithProviders(<CatalogPage />);

    expect(await screen.findByText("No se pudo cargar el catálogo.")).toBeInTheDocument();
    expect(screen.queryByText("Sin resultados en esta categoría.")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("Servomotor X1")).toBeInTheDocument();
  });
});
