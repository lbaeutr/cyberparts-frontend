import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
    status: "PENDING",
    total: "20.00",
    created_at: "2026-10-19T10:00:00Z",
    items: [{ id: 1, product_id: 3, quantity: 2, unit_price: "10.00" }],
  },
];

describe("OrdersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it("shows the empty state", async () => {
    mocks.list.mockResolvedValue([]);
    renderWithProviders(<OrdersPage />);

    expect(await screen.findByText("Aún no hay pedidos.")).toBeInTheDocument();
  });

  it("shows an error state", async () => {
    mocks.list.mockRejectedValue(new Error("boom"));
    renderWithProviders(<OrdersPage />);

    expect(
      await screen.findByText("No se pudieron cargar los pedidos.")
    ).toBeInTheDocument();
  });
});
