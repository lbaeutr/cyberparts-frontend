import api from "./client";

export const authApi = {
  register: (data) => api.post("/auth/register", data).then((r) => r.data),
  login: (data) => api.post("/auth/login", data).then((r) => r.data),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me").then((r) => r.data),
};

export const productsApi = {
  list: (params = {}) => api.get("/products", { params }).then((r) => r.data),
  get: (id) => api.get(`/products/${id}`).then((r) => r.data),
  create: (data) => api.post("/products", data).then((r) => r.data),
  update: (id, data) => api.put(`/products/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/products/${id}`),
};

export const usersApi = {
  list: () => api.get("/users").then((r) => r.data),
  setRole: (id, role) => api.patch(`/users/${id}/role`, { role }).then((r) => r.data),
  setActive: (id, is_active) =>
    api.patch(`/users/${id}/active`, { is_active }).then((r) => r.data),
  remove: (id) => api.delete(`/users/${id}`),
};

export const ordersApi = {
  list: () => api.get("/orders").then((r) => r.data),
  get: (id) => api.get(`/orders/${id}`).then((r) => r.data),
  create: (items) => api.post("/orders", { items }).then((r) => r.data),
  setStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }).then((r) => r.data),
};
