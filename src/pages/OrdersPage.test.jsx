import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../test/render";
import OrdersPage from "./OrdersPage";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  setStatus: vi.fn(),
  auth: { current: {} },
}));

vi.mock("../api/services", () => ({
  ordersApi: {
    list: mocks.list,
    setStatus: mocks.setStatus,
    create: vi.fn(),
    get: vi.fn(),
  },
}));

vi.mock("../context/AuthContext", () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => mocks.auth.current,
}));

const orders = [
  {
    id: 5,
    user_id: 2,
    username: "neo",
    status: "PENDING",
    total: "20.00",
    created_at: "2026-10-19T10:00:00Z",
    items: [
      { id: 1, product_id: 3, product_name: "Servomotor X1", quantity: 2, unit_price: "10.00" },
    ],
  },
];

describe("OrdersPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    mocks.list.mockResolvedValue(orders);
    mocks.setStatus.mockResolvedValue({ ...orders[0], status: "PAID" });
    mocks.auth.current = { user: { id: 2, username: "neo" }, hasRole: () => false };
  });

  it("shows only the client history without status controls", async () => {
    renderWithProviders(<OrdersPage />);

    expect(await screen.findByText("Mis pedidos")).toBeInTheDocument();
    expect(screen.getByText("Pedido #5")).toBeInTheDocument();
    expect(screen.queryByLabelText("Estado del pedido 5")).not.toBeInTheDocument();
  });

  it("shows product and user names to staff", async () => {
    mocks.auth.current = { user: { id: 1, username: "smith" }, hasRole: () => true };
    renderWithProviders(<OrdersPage />);

    expect(await screen.findByText("Servomotor X1")).toBeInTheDocument();
    expect(screen.getByText("neo")).toBeInTheDocument();
    expect(screen.queryByText("#3")).not.toBeInTheDocument();
  });

  it("lets staff change the order status", async () => {
    mocks.auth.current = { user: { id: 1, username: "smith" }, hasRole: () => true };
    const user = userEvent.setup();
    renderWithProviders(<OrdersPage />);

    expect(await screen.findByText("Todos los pedidos")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Estado del pedido 5"), "PAID");

    await waitFor(() => {
      expect(mocks.setStatus).toHaveBeenCalledWith(5, "PAID");
    });
  });

  it("does not offer invalid transitions from a terminal status", async () => {
    mocks.auth.current = { user: { id: 1, username: "smith" }, hasRole: () => true };
    mocks.list.mockResolvedValue([{ ...orders[0], status: "DELIVERED" }]);
    renderWithProviders(<OrdersPage />);

    const select = await screen.findByLabelText("Estado del pedido 5");

    expect(select).toBeDisabled();
    expect(within(select).queryByRole("option", { name: "Pagado" })).not.toBeInTheDocument();
  });

  it("shows the empty state", async () => {
    mocks.list.mockResolvedValue([]);
    renderWithProviders(<OrdersPage />);

    expect(await screen.findByText("Aún no hay pedidos.")).toBeInTheDocument();
  });

  it("filters orders by status", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OrdersPage />);
    await screen.findByText("Pedido #5");

    await user.selectOptions(screen.getByLabelText("Estado"), "PAID");

    await waitFor(() => {
      expect(mocks.list).toHaveBeenLastCalledWith({ skip: 0, limit: 20, status: "PAID" });
    });
  });

  it("paginates orders", async () => {
    const many = Array.from({ length: 20 }, (_, index) => ({
      ...orders[0],
      id: index + 1,
    }));
    mocks.list.mockResolvedValue(many);
    const user = userEvent.setup();
    renderWithProviders(<OrdersPage />);
    await screen.findByText("Pedido #1");

    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    await waitFor(() => {
      expect(mocks.list).toHaveBeenLastCalledWith({ skip: 20, limit: 20 });
    });
  });

  it("does not cancel an order when the confirmation is rejected", async () => {
    mocks.auth.current = { user: { id: 1, username: "smith" }, hasRole: () => true };
    window.confirm.mockReturnValue(false);
    const user = userEvent.setup();
    renderWithProviders(<OrdersPage />);
    await screen.findByText("Pedido #5");

    await user.selectOptions(screen.getByLabelText("Estado del pedido 5"), "CANCELLED");

    expect(mocks.setStatus).not.toHaveBeenCalled();
  });

  it("shows an error state", async () => {
    mocks.list.mockRejectedValue(new Error("boom"));
    renderWithProviders(<OrdersPage />);

    expect(await screen.findByText("No se pudieron cargar los pedidos.")).toBeInTheDocument();
  });
});
