import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ordersApi } from "../api/services";
import { useAuth } from "../context/AuthContext";
import { ORDER_STATUS, money } from "../utils/format";

const STATUSES = Object.keys(ORDER_STATUS);

export default function OrdersPage() {
  const { hasRole, user } = useAuth();
  const isStaff = hasRole("ADMIN", "GESTOR");
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["orders"],
    queryFn: () => ordersApi.list(),
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }) => ordersApi.setStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });

  if (isLoading) return <div className="loading">Cargando pedidos...</div>;
  if (error) return <div className="alert error">No se pudieron cargar los pedidos.</div>;

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Pedidos</span>
          <h1>{isStaff ? "Todos los pedidos" : "Mis pedidos"}</h1>
          <p>{isStaff ? "Gestiona el estado de los pedidos de los clientes." : "Historial de tus compras."}</p>
        </div>
      </div>

      {data.length === 0 && <div className="card center muted">Aún no hay pedidos.</div>}

      <div className="grid" style={{ gridTemplateColumns: "1fr" }}>
        {data.map((order) => (
          <div className="card" key={order.id}>
            <div className="row">
              <h3 style={{ margin: 0 }}>Pedido #{order.id}</h3>
              <span className={`badge status-${order.status}`}>{ORDER_STATUS[order.status]}</span>
              {isStaff && <span className="muted">usuario #{order.user_id}</span>}
              <span className="right mono">{new Date(order.created_at).toLocaleString("es-ES")}</span>
            </div>

            <div className="table-wrap">
              <table className="table" style={{ marginTop: "0.5rem" }}>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio ud.</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((it) => (
                  <tr key={it.id}>
                    <td>#{it.product_id}</td>
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
                  onChange={(e) => mutation.mutate({ id: order.id, status: e.target.value })}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {ORDER_STATUS[s]}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
