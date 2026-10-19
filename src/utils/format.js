export const money = (value) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(value));

const ICONS = {
  Procesadores: "▚",
  Servomotores: "⚙",
  Sensores: "◎",
  Energia: "⚡",
  Chasis: "▣",
  Modulos: "◈",
  Actuadores: "✥",
};

export const categoryIcon = (category) => ICONS[category] || "⬢";

export const CATEGORIES = Object.keys(ICONS);

export const ORDER_STATUS = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

export const ROLE_LABEL = {
  ADMIN: "Administrador",
  GESTOR: "Gestor",
  CLIENTE: "Cliente",
};
