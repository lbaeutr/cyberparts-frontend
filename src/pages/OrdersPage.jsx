import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ordersApi } from "../api/services";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../utils/errors";
import { ORDER_STATUS, money } from "../utils/format";
import { allowedTransitions } from "../utils/orders";

const PAGE_SIZE = 20;

export default function OrdersPage() {
  const { hasRole } = useAuth();
  const isStaff = hasRole("ADMIN", "GESTOR");
  const qc = useQueryClient();
  const { notify } = useToast();
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["orders", statusFilter, page],
    queryFn: () =>
      ordersApi.list({
        skip: page * PAGE_SIZE,
        limit: PAGE_SIZE,
        ...(statusFilter ? { status: statusFilter } : {}),
      }),
    placeholderData: keepPreviousData,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }) => ordersApi.setStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      notify("Estado del pedido actualizado.");
    },
    onError: (err) => notify(getErrorMessage(err, "No se pudo cambiar el estado"), "error"),
  });

  const header = (
    <div className="page-head">
      <div>
        <span className="eyebrow">Pedidos</span>
        <h1>{isStaff ? "Todos los pedidos" : "Mis pedidos"}</h1>
        <p>
          {isStaff
            ? "Gestiona el estado de los pedidos de los clientes."
            : "Historial de tus compras."}
        </p>
      </div>
    </div>
  );

  if (isLoading)
    return (
      <div className="loading" role="status">
        Cargando pedidos...
      </div>
    );
  if (error) {
    return (
      <>
        {header}
        <div className="alert error" role="alert">
          No se pudieron cargar los pedidos.
        </div>
        <button className="btn ghost" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? "Reintentando..." : "Reintentar"}
        </button>
      </>
    );
  }

  const orders = data ?? [];

  return (
    <>
      {header}

      <div className="toolbar">
        <label htmlFor="orders-status-filter" className="muted">
          Estado
        </label>
        <select
          id="orders-status-filter"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          style={{ maxWidth: 200 }}
        >
          <option value="">Todos</option>
          {Object.entries(ORDER_STATUS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {orders.length === 0 && <div className="card center muted">Aún no hay pedidos.</div>}

      <div className="grid" style={{ gridTemplateColumns: "1fr" }}>
        {orders.map((order) => {
          const busy = mutation.isPending && mutation.variables?.id === order.id;
          return (
            <div className="card" key={order.id}>
              <div className="row">
                <h3 style={{ margin: 0 }}>Pedido #{order.id}</h3>
                <span className={`badge status-${order.status}`}>{ORDER_STATUS[order.status]}</span>
                {isStaff && (
                  <span className="muted">{order.username || `usuario #${order.user_id}`}</span>
                )}
                <span className="right mono">
                  {new Date(order.created_at).toLocaleString("es-ES")}
                </span>
              </div>

              <div className="table-wrap">
                <table className="table" style={{ marginTop: "0.5rem" }}>
                  <thead>
                    <tr>
                      <th scope="col">Producto</th>
                      <th scope="col">Cantidad</th>
                      <th scope="col">Precio ud.</th>
                      <th scope="col">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((it) => (
                      <tr key={it.id}>
                        <td>{it.product_name || `#${it.product_id}`}</td>
                        <td>{it.quantity}</td>
                        <td>{money(it.unit_price)}</td>
                        <td>{money(it.unit_price * it.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="row" style={{ marginTop: "0.75rem" }}>
                <span className="muted">Total</span>
                <span className="product-price">{money(order.total)}</span>

                {isStaff && (
                  <select
                    aria-label={`Estado del pedido ${order.id}`}
                    className="right"
                    style={{ maxWidth: 180 }}
                    value={order.status}
                    onChange={(e) => {
                      const status = e.target.value;
                      if (
                        status === "CANCELLED" &&
                        !window.confirm(`¿Cancelar el pedido #${order.id}?`)
                      ) {
                        return;
                      }
                      mutation.mutate({ id: order.id, status });
                    }}
                    disabled={busy || allowedTransitions(order.status).length === 0}
                  >
                    <option value={order.status}>{ORDER_STATUS[order.status]}</option>
                    {allowedTransitions(order.status).map((status) => (
                      <option key={status} value={status}>
                        {ORDER_STATUS[status]}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {(orders.length === PAGE_SIZE || page > 0) && (
        <div className="row" style={{ marginTop: "1rem" }}>
          <span className="muted">Página {page + 1}</span>
          <div className="row right" style={{ gap: "0.5rem" }}>
            <button
              className="btn sm ghost"
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
            >
              Anterior
            </button>
            <button
              className="btn sm ghost"
              onClick={() => setPage(page + 1)}
              disabled={orders.length < PAGE_SIZE}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </>
  );
}
