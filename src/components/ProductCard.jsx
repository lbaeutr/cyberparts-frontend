import { memo } from "react";
import { Link } from "react-router-dom";

import { categoryIcon, money } from "../utils/format";
import { canShop as userCanShop } from "../utils/roles";
import { safeImageUrl } from "../utils/urls";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

function ProductCard({ product }) {
  const { add } = useCart();
  const { hasRole } = useAuth();
  const canShop = userCanShop(hasRole);
  const imageUrl = safeImageUrl(product.image_url);

  return (
    <article className="card product-card">
      <div className="product-thumb">
        {imageUrl ? (
          <img className="product-thumb-img" src={imageUrl} alt={product.name} loading="lazy" />
        ) : (
          categoryIcon(product.category)
        )}
      </div>
      <div className="product-meta">
        <span className="eyebrow">{product.category}</span>
        <span>stock {product.stock}</span>
      </div>
      <h3 style={{ margin: 0, fontSize: "1rem" }}>{product.name}</h3>
      <p className="muted" style={{ margin: 0, fontSize: "0.82rem", flex: 1 }}>
        {product.description.slice(0, 90)}
        {product.description.length > 90 ? "…" : ""}
      </p>
      <div className="row">
        <span className="product-price">{money(product.price)}</span>
        <div className="right row">
          <Link
            className="btn sm ghost"
            to={`/producto/${product.id}`}
            aria-label={`Ver ${product.name}`}
          >
            Ver
          </Link>
          {canShop && (
            <button
              className="btn sm primary"
              onClick={() => add(product)}
              disabled={product.stock <= 0}
              aria-label={`Añadir ${product.name} al carrito`}
            >
              + Carrito
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default memo(ProductCard);
