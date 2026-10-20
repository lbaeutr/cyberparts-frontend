import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import ProductCard from "../components/ProductCard";
import { productsApi } from "../api/services";

const PAGE_SIZE = 12;
const SEARCH_DELAY_MS = 300;

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") || "";
  const query = searchParams.get("q") || "";
  const requestedPage = Number.parseInt(searchParams.get("page") || "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const [searchText, setSearchText] = useState(query);

  useEffect(() => {
    if (searchText.trim() === query) return;
    const timer = setTimeout(() => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const value = searchText.trim();
          if (value) next.set("q", value);
          else next.delete("q");
          next.delete("page");
          return next;
        },
        { replace: true }
      );
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [searchText, query, setSearchParams]);

  const params = { skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE };
  if (category) params.category = category;
  if (query) params.search = query;

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["products", { category, query, page }],
    queryFn: () => productsApi.list(params),
    placeholderData: keepPreviousData,
  });

  const products = data ?? [];
  const goToPage = (nextPage) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (nextPage <= 1) next.delete("page");
      else next.set("page", String(nextPage));
      return next;
    });
  };

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
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        {isFetching && !isLoading && <span className="muted">Actualizando...</span>}
      </div>

      {isLoading && (
        <div className="loading" role="status">
          Cargando catálogo...
        </div>
      )}

      {error && (
        <>
          <div className="alert error" role="alert">
            No se pudo cargar el catálogo.
          </div>
          <button className="btn ghost" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? "Reintentando..." : "Reintentar"}
          </button>
        </>
      )}

      {!isLoading && !error && products.length === 0 && (
        <div className="card center muted">
          {query ? `Sin resultados para "${query}".` : "Sin resultados en esta categoría."}
        </div>
      )}

      <div className="grid">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {!error && (products.length === PAGE_SIZE || page > 1) && (
        <div className="row" style={{ marginTop: "1rem" }}>
          <span className="muted">Página {page}</span>
          <div className="row right" style={{ gap: "0.5rem" }}>
            <button
              className="btn sm ghost"
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
            >
              Anterior
            </button>
            <button
              className="btn sm ghost"
              onClick={() => goToPage(page + 1)}
              disabled={products.length < PAGE_SIZE}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </>
  );
}
