import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { ordersApi } from "../api/services";
import { money } from "../utils/format";

export default function CartPage() {
  const { items, setQuantity, remove, clear, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const checkout = async () => {
    setError("");
    if (!user) {
      navigate("/login", { state: { from: "/carrito" } });
      return;
    }
    setLoading(true);
    try {
      await ordersApi.create(items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })));
      clear();
      navigate("/pedidos");
    } catch (err) {
      setError(err.response?.data?.detail || "No se pudo procesar el pedido");
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

      {error && <div className="alert error">{error}</div>}

      <div className="card">
        {items.map((i) => (
          <div className="cart-line" key={i.product_id}>
            <div style={{ flex: 1 }}>
              <strong>{i.name}</strong>
              <div className="muted" style={{ fontSize: "0.8rem" }}>
                {money(i.price)} c/u
              </div>
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
            <span style={{ width: 110, textAlign: "right" }}>{money(i.price * i.quantity)}</span>
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
          <button className="btn ghost" onClick={clear}>
            Vaciar
          </button>
          <button className="btn primary right" onClick={checkout} disabled={loading}>
            {loading ? "Procesando..." : user ? "Confirmar pedido" : "Inicia sesión para pedir"}
          </button>
        </div>
      </div>
    </>
  );
}
