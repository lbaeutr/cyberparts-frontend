import { CATEGORIES, categoryIcon } from "./format";

export function navItems({ user, hasRole }) {
  const items = [
    { group: "main", to: "/", label: "Catálogo", icon: "◈", end: true },
    { group: "main", to: "/carrito", label: "Carrito", icon: "▤", showCartCount: true },
  ];

  if (user) {
    items.push(
      { group: "main", to: "/pedidos", label: "Pedidos", icon: "⌘" },
      { group: "main", to: "/perfil", label: "Mi perfil", icon: "☺", sidebarOnly: true }
    );
  }

  if (hasRole("ADMIN", "GESTOR")) {
    items.push({ group: "management", to: "/panel", label: "Panel", icon: "⚙" });
  }

  if (hasRole("ADMIN")) {
    items.push({ group: "management", to: "/admin/usuarios", label: "Usuarios", icon: "☰" });
  }

  return items;
}

export function categoryNavItems() {
  return [
    { to: "/", label: "Todas", icon: "⬡" },
    ...CATEGORIES.map((category) => ({
      to: `/?category=${encodeURIComponent(category)}`,
      label: category,
      icon: categoryIcon(category),
      category,
    })),
  ];
}
