import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueries, useQueryClient } from "@tanstack/react-query";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { ordersApi, productsApi } from "../api/services";
import { money } from "../utils/format";
import { getErrorMessage } from "../utils/errors";

export default function CartPage() {
  const { items, setQuantity, remove, clear } = useCart();
  const { user } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const productQueries = useQueries({
    queries: items.map((item) => ({
      queryKey: ["product", item.product_id],
      queryFn: () => productsApi.get(item.product_id),
      retry: false,
    })),
  });

  const lines = items.map((item, index) => {
    const current = productQueries[index]?.data;
    const missing = Boolean(productQueries[index]?.isError);
    return {
      ...item,
      name: current?.name ?? item.name,
      price: current ? Number(current.price) : item.price,
      stock: current ? current.stock : item.stock,
      available: !missing && current?.is_active !== false,
    };
  });

  const total = lines.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const unavailable = lines.some((i) => !i.available);
  const overStock = lines.some((i) => i.available && i.stock < i.quantity);

  const checkout = async () => {
    setError("");
    if (!user) {
      navigate("/login", { state: { from: "/carrito" } });
      return;
    }
    setLoading(true);
    try {
      await ordersApi.create(
        lines.map((i) => ({ product_id: i.product_id, quantity: i.quantity }))
      );
      clear();
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      notify("Pedido creado correctamente.");
      navigate("/pedidos");
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo procesar el pedido"));
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <>
        <div className="page-head">
          <div>
            <span className="eyebrow">Carrito</span>
            <h1>Tu carrito está vacío</h1>
          </div>
        </div>
        <Link className="btn primary" to="/">
          Explorar catálogo
        </Link>
      </>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Carrito</span>
          <h1>Resumen del pedido</h1>
        </div>
      </div>

      {error && (
        <div className="alert error" role="alert">
          {error}
        </div>
      )}
      {unavailable && (
        <div className="alert error" role="alert">
          Algunos productos ya no están disponibles. Quítalos para continuar.
        </div>
      )}
      {overStock && (
        <div className="alert error" role="alert">
          Hay cantidades por encima del stock actual. Ajusta el carrito para continuar.
        </div>
      )}

      <div className="card">
        {lines.map((i) => (
          <div className="cart-line" key={i.product_id}>
            <div style={{ flex: 1 }}>
              <strong>{i.name}</strong>
              <div className="muted" style={{ fontSize: "0.8rem" }}>
                {i.available ? `${money(i.price)} c/u` : "No disponible"}
              </div>
              {i.available && i.stock < i.quantity && (
                <div className="muted" style={{ fontSize: "0.8rem" }}>
                  Stock actual: {i.stock}
                </div>
              )}
            </div>
            <input
              aria-label={`Cantidad de ${i.name}`}
              type="number"
              className="qty-input"
              min={1}
              max={i.stock}
              value={i.quantity}
              onChange={(e) => setQuantity(i.product_id, Math.max(1, Number(e.target.value)))}
            />
            <span className="cart-line-total">{money(i.price * i.quantity)}</span>
            <button className="btn sm danger" onClick={() => remove(i.product_id)}>
              Quitar
            </button>
          </div>
        ))}

        <div className="row" style={{ marginTop: "1rem" }}>
          <span className="mono muted">Total</span>
          <span className="product-price right">{money(total)}</span>
        </div>

        <div className="row" style={{ marginTop: "1rem" }}>
          <button
            className="btn ghost"
            onClick={() => {
              if (!window.confirm("¿Vaciar el carrito?")) return;
              clear();
            }}
          >
            Vaciar
          </button>
          <button
            className="btn primary right"
            onClick={checkout}
            disabled={loading || unavailable || overStock}
          >
            {loading ? "Procesando..." : user ? "Confirmar pedido" : "Inicia sesión para pedir"}
          </button>
        </div>
      </div>
    </>
  );
}
