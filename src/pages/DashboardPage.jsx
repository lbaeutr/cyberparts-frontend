import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { productsApi } from "../api/services";
import { CATEGORIES, categoryIcon, money } from "../utils/format";

const EMPTY = {
  name: "",
  category: CATEGORIES[0],
  price: "",
  stock: 0,
  description: "",
  image_url: "",
  is_active: true,
};

export default function DashboardPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["products", "all"],
    queryFn: () => productsApi.list({ only_active: false, limit: 100 }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["products"] });

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editingId ? productsApi.update(editingId, payload) : productsApi.create(payload),
    onSuccess: () => {
      invalidate();
      setForm(EMPTY);
      setEditingId(null);
      setError("");
      setMessage(editingId ? "Producto actualizado." : "Producto creado.");
    },
    onError: (err) => setError(err.response?.data?.detail || "Error al guardar"),
  });

  const removeMutation = useMutation({
    mutationFn: (id) => productsApi.remove(id),
    onSuccess: () => {
      invalidate();
      setMessage("Producto desactivado.");
    },
  });

  const submit = (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    saveMutation.mutate({
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
      image_url: form.image_url || null,
    });
  };

  const edit = (p) => {
    setEditingId(p.id);
    setMessage("");
    setForm({
      name: p.name,
      category: p.category,
      price: p.price,
      stock: p.stock,
      description: p.description,
      image_url: p.image_url || "",
      is_active: p.is_active,
    });
  };

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Panel gestor</span>
          <h1>Gestión de productos</h1>
          <p>Crea, edita y desactiva piezas del catálogo.</p>
        </div>
      </div>

      {message && <div className="alert ok">{message}</div>}
      {error && <div className="alert error">{error}</div>}

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3>{editingId ? `Editando producto #${editingId}` : "Nuevo producto"}</h3>
        <form onSubmit={submit} className="form-grid">
          <div className="field">
            <label htmlFor="product-name">Nombre</label>
            <input
              id="product-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="product-category">Categoría</label>
            <select
              id="product-category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="product-price">Precio</label>
            <input
              id="product-price"
              type="number"
              step="0.01"
              min="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="product-stock">Stock</label>
            <input
              id="product-stock"
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
          </div>
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="product-description">Descripción</label>
            <textarea
              id="product-description"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="product-image">URL imagen (opcional)</label>
            <input
              id="product-image"
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            />
          </div>
          <div className="field" style={{ justifyContent: "flex-end" }}>
            <label>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                style={{ width: "auto", marginRight: 8 }}
              />
              Activo
            </label>
          </div>
          <div className="row" style={{ gridColumn: "1 / -1" }}>
            <button className="btn primary" disabled={saveMutation.isPending}>
              {editingId ? "Guardar cambios" : "Crear producto"}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  setEditingId(null);
                  setForm(EMPTY);
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="loading">Cargando...</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
            <thead>
              <tr>
                <th></th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data?.map((p) => (
                <tr key={p.id}>
                  <td style={{ color: "var(--accent)" }}>{categoryIcon(p.category)}</td>
                  <td>{p.name}</td>
                  <td className="muted">{p.category}</td>
                  <td>{money(p.price)}</td>
                  <td>{p.stock}</td>
                  <td>
                    <span className="badge">{p.is_active ? "Activo" : "Inactivo"}</span>
                  </td>
                  <td>
                    <div className="row" style={{ gap: "0.4rem" }}>
                      <button className="btn sm ghost" onClick={() => edit(p)}>
                        Editar
                      </button>
                      {p.is_active && (
                        <button className="btn sm danger" onClick={() => removeMutation.mutate(p.id)}>
                          Desactivar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </>
  );
}
