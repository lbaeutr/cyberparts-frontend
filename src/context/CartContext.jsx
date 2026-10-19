import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "cyberparts-cart";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const add = (product, quantity = 1) =>
    setItems((prev) => {
      const found = prev.find((i) => i.product_id === product.id);
      if (found) {
        return prev.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          price: Number(product.price),
          stock: product.stock,
          quantity,
        },
      ];
    });

  const setQuantity = (productId, quantity) =>
    setItems((prev) =>
      prev.map((i) => (i.product_id === productId ? { ...i, quantity } : i))
    );

  const remove = (productId) =>
    setItems((prev) => prev.filter((i) => i.product_id !== productId));

  const clear = () => setItems([]);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  const value = useMemo(
    () => ({ items, add, setQuantity, remove, clear, total, count }),
    [items, total, count]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}
