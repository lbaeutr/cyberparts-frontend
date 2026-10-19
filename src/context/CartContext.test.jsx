import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { CartProvider, useCart } from "./CartContext";

const STORAGE_KEY = "cyberparts-cart";

function Probe() {
  const cart = useCart();
  return (
    <div>
      <span data-testid="count">{cart.count}</span>
      <span data-testid="total">{cart.total}</span>
      <span data-testid="items">{cart.items.map((item) => `${item.name}:${item.quantity}`).join(",")}</span>
      <button onClick={() => cart.add({ id: 1, name: "Servo", price: 10, stock: 5 })}>
        add
      </button>
      <button onClick={() => cart.setQuantity(1, 3)}>quantity</button>
      <button onClick={() => cart.remove(1)}>remove</button>
      <button onClick={cart.clear}>clear</button>
    </div>
  );
}

function renderCart() {
  return render(
    <CartProvider>
      <Probe />
    </CartProvider>
  );
}

describe("CartContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts empty", () => {
    renderCart();

    expect(screen.getByTestId("count")).toHaveTextContent("0");
    expect(screen.getByTestId("total")).toHaveTextContent("0");
  });

  it("adds products and increments the quantity", async () => {
    const user = userEvent.setup();
    renderCart();

    await user.click(screen.getByRole("button", { name: "add" }));
    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(screen.getByTestId("total")).toHaveTextContent("10");

    await user.click(screen.getByRole("button", { name: "add" }));
    expect(screen.getByTestId("count")).toHaveTextContent("2");
    expect(screen.getByTestId("items")).toHaveTextContent("Servo:2");
  });

  it("updates quantity, removes and clears", async () => {
    const user = userEvent.setup();
    renderCart();

    await user.click(screen.getByRole("button", { name: "add" }));
    await user.click(screen.getByRole("button", { name: "quantity" }));
    expect(screen.getByTestId("items")).toHaveTextContent("Servo:3");

    await user.click(screen.getByRole("button", { name: "remove" }));
    expect(screen.getByTestId("count")).toHaveTextContent("0");

    await user.click(screen.getByRole("button", { name: "add" }));
    await user.click(screen.getByRole("button", { name: "clear" }));
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("restores the cart from localStorage", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ product_id: 1, name: "Servo", price: 10, stock: 5, quantity: 2 }])
    );

    renderCart();

    expect(screen.getByTestId("count")).toHaveTextContent("2");
    expect(screen.getByTestId("total")).toHaveTextContent("20");
  });

  it("persists changes in localStorage", async () => {
    const user = userEvent.setup();
    renderCart();

    await user.click(screen.getByRole("button", { name: "add" }));

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      expect(stored).toHaveLength(1);
      expect(stored[0].name).toBe("Servo");
    });
  });

});
