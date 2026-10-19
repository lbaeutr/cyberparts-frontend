import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../test/render";
import CartPage from "./CartPage";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  auth: { current: { user: null } },
}));

vi.mock("../api/services", () => ({
  ordersApi: {
    create: mocks.create,
    list: vi.fn(),
    get: vi.fn(),
    setStatus: vi.fn(),
  },
}));

vi.mock("../context/AuthContext", () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => mocks.auth.current,
}));

const STORAGE_KEY = "cyberparts-cart";
const savedItem = { product_id: 1, name: "Servo", price: 10, stock: 5, quantity: 2 };

function seedCart(items = [savedItem]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function renderCart() {
  return renderWithProviders(
    <Routes>
      <Route path="/carrito" element={<CartPage />} />
      <Route path="/pedidos" element={<div>pagina pedidos</div>} />
      <Route path="/login" element={<div>pagina login</div>} />
    </Routes>,
    { route: "/carrito" }
  );
}

describe("CartPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.auth.current = { user: { username: "neo", role: "CLIENTE" } };
    mocks.create.mockResolvedValue({ id: 1 });
  });

  it("shows the empty state", () => {
    renderCart();

    expect(screen.getByText("Tu carrito está vacío")).toBeInTheDocument();
  });

  it("shows the saved items and total", () => {
    seedCart();
    renderCart();

    expect(screen.getByText("Servo")).toBeInTheDocument();
    expect(screen.getAllByText(/20,00/).length).toBeGreaterThan(0);
  });

  it("updates the quantity and total", async () => {
    seedCart();
    const user = userEvent.setup();
    renderCart();

    fireEvent.change(screen.getByLabelText("Cantidad de Servo"), { target: { value: "3" } });

    expect(screen.getAllByText(/30,00/).length).toBeGreaterThan(0);
  });

  it("removes items from the cart", async () => {
    seedCart();
    const user = userEvent.setup();
    renderCart();

    await user.click(screen.getByRole("button", { name: "Quitar" }));

    expect(screen.getByText("Tu carrito está vacío")).toBeInTheDocument();
  });

  it("submits the order and navigates to orders", async () => {
    seedCart();
    const user = userEvent.setup();
    renderCart();

    await user.click(screen.getByRole("button", { name: "Confirmar pedido" }));

    expect(mocks.create).toHaveBeenCalledWith([{ product_id: 1, quantity: 2 }]);
    expect(await screen.findByText("pagina pedidos")).toBeInTheDocument();
    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual([]);
    });
  });

  it("redirects anonymous users to login", async () => {
    mocks.auth.current = { user: null };
    seedCart();
    const user = userEvent.setup();
    renderCart();

    await user.click(screen.getByRole("button", { name: "Inicia sesión para pedir" }));

    expect(await screen.findByText("pagina login")).toBeInTheDocument();
  });

  it("shows the checkout error", async () => {
    mocks.create.mockRejectedValue({
      response: { data: { detail: "Stock insuficiente" } },
    });
    seedCart();
    const user = userEvent.setup();
    renderCart();

    await user.click(screen.getByRole("button", { name: "Confirmar pedido" }));

    expect(await screen.findByText("Stock insuficiente")).toBeInTheDocument();
  });
});
