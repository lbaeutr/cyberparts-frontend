import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import ProductCard from "../components/ProductCard";
import { productsApi } from "../api/services";

export default function CatalogPage() {
  const [searchParams] = useSearchParams();
  const category = searchParams.get("category") || "";
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["products", category],
    queryFn: () => productsApi.list(category ? { category, limit: 100 } : { limit: 100 }),
  });

  const products = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    );
  }, [data, search]);

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Catálogo</span>
          <h1>{category ? `Módulos / ${category}` : "Piezas robóticas"}</h1>
          <p>Componentes de grado militar para tus ensamblajes cyberpunk.</p>
        </div>
      </div>

      <div className="toolbar">
        <input
          aria-label="Buscar componente"
          placeholder="Buscar componente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
      </div>

      {isLoading && <div className="loading">Cargando catálogo...</div>}
      {error && <div className="alert error">No se pudo cargar el catálogo.</div>}
      {!isLoading && products.length === 0 && (
        <div className="card center muted">Sin resultados en esta categoría.</div>
      )}

      <div className="grid">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </>
  );
}
