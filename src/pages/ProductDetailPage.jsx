import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { productsApi } from "../api/services";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { categoryIcon, money } from "../utils/format";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const { hasRole } = useAuth();
  const [qty, setQty] = useState(1);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productsApi.get(id),
  });

  if (isLoading) return <div className="loading">Cargando componente...</div>;
  if (error) return <div className="alert error">Producto no encontrado.</div>;

  const canShop = !hasRole("ADMIN", "GESTOR") || hasRole("CLIENTE");

  return (
    <>
      <div className="page-head">
        <Link className="btn sm ghost" to="/">
          ← Volver al catálogo
        </Link>
      </div>

      <div className="card detail-grid">
        <div className="product-thumb" style={{ height: 220, fontSize: "4rem" }}>
          {categoryIcon(product.category)}
        </div>
        <div>
          <span className="eyebrow">{product.category}</span>
          <h1>{product.name}</h1>
          <p className="muted">{product.description}</p>
          <p className="product-price" style={{ fontSize: "1.6rem" }}>
            {money(product.price)}
          </p>
          <p className="muted" style={{ fontSize: "0.85rem" }}>
            Disponibilidad: {product.stock} unidades
          </p>

          {canShop && (
            <div className="row" style={{ marginTop: "1rem" }}>
              <input
                aria-label="Cantidad"
                type="number"
                className="qty-input"
                min={1}
                max={product.stock}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
              />
              <button
                className="btn primary"
                disabled={product.stock <= 0}
                onClick={() => {
                  add(product, qty);
                  navigate("/carrito");
                }}
              >
                Añadir al carrito
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
