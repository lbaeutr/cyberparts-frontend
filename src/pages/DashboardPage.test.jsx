import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../test/render";
import DashboardPage from "./DashboardPage";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("../api/services", () => ({
  productsApi: {
    list: mocks.list,
    create: mocks.create,
    update: mocks.update,
    remove: mocks.remove,
    get: vi.fn(),
  },
}));

vi.mock("../context/AuthContext", () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({ user: { username: "smith", role: "ADMIN" }, hasRole: () => true }),
}));

const products = [
  {
    id: 1,
    name: "Servomotor X1",
    description: "Servo",
    category: "Servomotores",
    price: "99.99",
    stock: 4,
    image_url: null,
    is_active: true,
  },
  {
    id: 2,
    name: "Sensor viejo",
    description: "Sensor",
    category: "Sensores",
    price: "10.00",
    stock: 0,
    image_url: null,
    is_active: false,
  },
];

describe("DashboardPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    mocks.list.mockResolvedValue(products);
    mocks.create.mockResolvedValue({ id: 3 });
    mocks.update.mockResolvedValue({ id: 1 });
    mocks.remove.mockResolvedValue(undefined);
  });

  it("renders the product table", async () => {
    renderWithProviders(<DashboardPage />);

    expect(await screen.findByText("Servomotor X1")).toBeInTheDocument();
    expect(screen.getByText("Sensor viejo")).toBeInTheDocument();
    expect(screen.getByText("Inactivo")).toBeInTheDocument();
  });

  it("creates a product with numeric price and stock", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DashboardPage />);
    await screen.findByText("Servomotor X1");

    await user.type(screen.getByLabelText("Nombre"), "Nuevo servo");
    await user.type(screen.getByLabelText("Precio"), "25.5");
    await user.clear(screen.getByLabelText("Stock"));
    await user.type(screen.getByLabelText("Stock"), "7");
    await user.click(screen.getByRole("button", { name: "Crear producto" }));

    await waitFor(() => {
      expect(mocks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Nuevo servo",
          price: 25.5,
          stock: 7,
          image_url: null,
        })
      );
    });
  });

  it("edits an existing product", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DashboardPage />);
    await screen.findByText("Servomotor X1");

    const row = screen.getByText("Servomotor X1").closest("tr");
    await user.click(within(row).getByRole("button", { name: "Editar" }));

    const name = screen.getByLabelText("Nombre");
    expect(name).toHaveValue("Servomotor X1");
    await user.clear(name);
    await user.type(name, "Servo actualizado");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => {
      expect(mocks.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ name: "Servo actualizado" })
      );
    });
  });

  it("deactivates a product", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DashboardPage />);
    await screen.findByText("Servomotor X1");

    const row = screen.getByText("Servomotor X1").closest("tr");
    await user.click(within(row).getByRole("button", { name: "Desactivar" }));

    await waitFor(() => {
      expect(mocks.remove).toHaveBeenCalledWith(1);
    });
  });

  it("paginates the product table", async () => {
    const many = Array.from({ length: 25 }, (_, index) => ({
      ...products[0],
      id: index + 1,
      name: `Pieza ${index + 1}`,
    }));
    mocks.list.mockResolvedValue(many);
    const user = userEvent.setup();
    renderWithProviders(<DashboardPage />);
    await screen.findByText("Pieza 1");

    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    await waitFor(() => {
      expect(mocks.list).toHaveBeenLastCalledWith({
        only_active: false,
        skip: 25,
        limit: 25,
      });
    });
  });

  it("shows the load error with a retry button", async () => {
    mocks.list.mockRejectedValueOnce(new Error("boom"));
    const user = userEvent.setup();
    renderWithProviders(<DashboardPage />);

    expect(await screen.findByText("No se pudieron cargar los productos.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reintentar" }));

    await waitFor(() => expect(mocks.list).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Servomotor X1")).toBeInTheDocument();
  });

  it("does not deactivate a product when the confirmation is rejected", async () => {
    window.confirm.mockReturnValue(false);
    const user = userEvent.setup();
    renderWithProviders(<DashboardPage />);
    await screen.findByText("Servomotor X1");

    const row = screen.getByText("Servomotor X1").closest("tr");
    await user.click(within(row).getByRole("button", { name: "Desactivar" }));

    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it("shows the save error", async () => {
    mocks.create.mockRejectedValue({ response: { data: { detail: "Precio invalido" } } });
    const user = userEvent.setup();
    renderWithProviders(<DashboardPage />);
    await screen.findByText("Servomotor X1");

    await user.type(screen.getByLabelText("Nombre"), "Nuevo servo");
    await user.type(screen.getByLabelText("Precio"), "25.5");
    await user.click(screen.getByRole("button", { name: "Crear producto" }));

    expect(await screen.findByText("Precio invalido")).toBeInTheDocument();
  });
});
