import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProductCard from "./ProductCard";

const mocks = vi.hoisted(() => ({
  add: vi.fn(),
  hasRole: vi.fn(),
}));

vi.mock("../context/CartContext", () => ({
  useCart: () => ({ add: mocks.add }),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ hasRole: mocks.hasRole }),
}));

const product = {
  id: 7,
  name: "Servomotor X1",
  description: "Servo de alta precision para brazos roboticos",
  category: "Servomotores",
  price: "99.99",
  stock: 4,
};

function renderCard(overrides = {}) {
  return render(
    <MemoryRouter>
      <ProductCard product={{ ...product, ...overrides }} />
    </MemoryRouter>
  );
}

describe("ProductCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hasRole.mockReturnValue(false);
  });

  it("renders the product information", () => {
    renderCard();

    expect(screen.getByText("Servomotor X1")).toBeInTheDocument();
    expect(screen.getByText("Servomotores")).toBeInTheDocument();
    expect(screen.getByText("stock 4")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver Servomotor X1" })).toHaveAttribute(
      "href",
      "/producto/7"
    );
  });

  it("renders the product image when the url is valid", () => {
    renderCard({ image_url: "https://cdn.example.com/servo.png" });

    const image = screen.getByRole("img", { name: "Servomotor X1" });
    expect(image).toHaveAttribute("src", "https://cdn.example.com/servo.png");
    expect(image).toHaveAttribute("loading", "lazy");
  });

  it("ignores unsafe image urls", () => {
    renderCard({ image_url: "javascript:alert(1)" });

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("adds the product to the cart", async () => {
    const user = userEvent.setup();
    renderCard();

    await user.click(screen.getByRole("button", { name: "Añadir Servomotor X1 al carrito" }));

    expect(mocks.add).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }));
  });

  it("disables the add button when there is no stock", () => {
    renderCard({ stock: 0 });

    expect(screen.getByRole("button", { name: "Añadir Servomotor X1 al carrito" })).toBeDisabled();
  });

  it("hides the add button for staff", () => {
    mocks.hasRole.mockImplementation(
      (...roles) => roles.includes("ADMIN") || roles.includes("GESTOR")
    );

    renderCard();

    expect(
      screen.queryByRole("button", { name: "Añadir Servomotor X1 al carrito" })
    ).not.toBeInTheDocument();
  });

  it("shows the add button for clients", () => {
    mocks.hasRole.mockImplementation((role) => role === "CLIENTE");

    renderCard();

    expect(
      screen.getByRole("button", { name: "Añadir Servomotor X1 al carrito" })
    ).toBeInTheDocument();
  });
});
