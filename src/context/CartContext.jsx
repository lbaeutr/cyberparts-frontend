import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { SESSION_RESET_EVENT } from "../utils/events";

const CartContext = createContext(null);
const STORAGE_KEY = "cyberparts-cart";

function sanitizeItems(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const productId = Number(item?.product_id);
    const price = Number(item?.price);
    const quantity = Math.floor(Number(item?.quantity));
    if (!Number.isInteger(productId) || !Number.isFinite(price)) return [];
    if (!Number.isFinite(quantity) || quantity < 1) return [];
    return [
      {
        product_id: productId,
        name: typeof item.name === "string" && item.name ? item.name : `Producto #${productId}`,
        price,
        stock: Number.isFinite(Number(item.stock)) ? Number(item.stock) : 0,
        quantity,
      },
    ];
  });
}

function readStoredItems() {
  try {
    return sanitizeItems(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch {
    return [];
  }
}

function writeStoredItems(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Sin almacenamiento (modo privado o cuota llena): el carrito sigue en memoria.
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readStoredItems);

  useEffect(() => {
    writeStoredItems(items);
  }, [items]);

  useEffect(() => {
    const reset = () => setItems([]);
    window.addEventListener(SESSION_RESET_EVENT, reset);
    return () => window.removeEventListener(SESSION_RESET_EVENT, reset);
  }, []);

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
    setItems((prev) => prev.map((i) => (i.product_id === productId ? { ...i, quantity } : i)));

  const remove = (productId) => setItems((prev) => prev.filter((i) => i.product_id !== productId));

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
