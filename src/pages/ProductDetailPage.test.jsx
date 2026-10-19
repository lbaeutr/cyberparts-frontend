import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../test/render";
import ProductDetailPage from "./ProductDetailPage";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  auth: { current: {} },
}));

vi.mock("../api/services", () => ({
  productsApi: {
    get: mocks.get,
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock("../context/AuthContext", () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => mocks.auth.current,
}));

const product = {
  id: 3,
  name: "Servomotor X1",
  description: "Servo de alta precision",
  category: "Servomotores",
  price: "99.99",
  stock: 4,
  is_active: true,
};

function renderDetail() {
  return renderWithProviders(
    <Routes>
      <Route path="/producto/:id" element={<ProductDetailPage />} />
      <Route path="/carrito" element={<div>pagina carrito</div>} />
    </Routes>,
    { route: "/producto/3" }
  );
}

describe("ProductDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.get.mockResolvedValue(product);
    mocks.auth.current = { hasRole: () => false };
  });

  it("renders the product details", async () => {
    renderDetail();

    expect(await screen.findByText("Servomotor X1")).toBeInTheDocument();
    expect(screen.getByText("Servo de alta precision")).toBeInTheDocument();
    expect(screen.getByText(/99,99/)).toBeInTheDocument();
    expect(screen.getByText(/4 unidades/)).toBeInTheDocument();
  });

  it("adds the selected quantity to the cart and navigates", async () => {
    const user = userEvent.setup();
    renderDetail();
    await screen.findByText("Servomotor X1");

    fireEvent.change(screen.getByLabelText("Cantidad"), { target: { value: "2" } });
    await user.click(screen.getByRole("button", { name: "Añadir al carrito" }));

    expect(await screen.findByText("pagina carrito")).toBeInTheDocument();
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("cyberparts-cart"));
      expect(stored[0]).toEqual(expect.objectContaining({ product_id: 3, quantity: 2 }));
    });
  });

  it("hides the cart controls for staff", async () => {
    mocks.auth.current = {
      hasRole: (...roles) => roles.includes("ADMIN") || roles.includes("GESTOR"),
    };
    renderDetail();
    await screen.findByText("Servomotor X1");

    expect(
      screen.queryByRole("button", { name: "Añadir al carrito" })
    ).not.toBeInTheDocument();
  });

  it("shows an error when the product does not exist", async () => {
    mocks.get.mockRejectedValue(new Error("404"));
    renderDetail();

    expect(await screen.findByText("Producto no encontrado.")).toBeInTheDocument();
  });
});
