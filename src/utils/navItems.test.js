import { describe, expect, it } from "vitest";

import { CATEGORIES, categoryIcon } from "./format";
import { categoryNavItems, navItems } from "./navItems";

const withRole = (role, username) => ({
  user: { username },
  hasRole: (...requested) => requested.includes(role),
});

const anonymous = { user: null, hasRole: () => false };
const client = withRole("CLIENTE", "neo");
const gestor = withRole("GESTOR", "trinity");
const admin = withRole("ADMIN", "smith");

const labels = (items) => items.map((item) => item.label);

describe("navItems", () => {
  it("shows only public links to anonymous users", () => {
    const items = navItems(anonymous);

    expect(labels(items)).toEqual(["Catálogo", "Carrito"]);
    expect(items[0]).toMatchObject({ to: "/", end: true, group: "main" });
    expect(items[1]).toMatchObject({ to: "/carrito", showCartCount: true });
  });

  it("adds orders and profile for clients", () => {
    const items = navItems(client);

    expect(labels(items)).toEqual(["Catálogo", "Carrito", "Pedidos", "Mi perfil"]);
    expect(items.find((item) => item.label === "Mi perfil")).toMatchObject({
      to: "/perfil",
      sidebarOnly: true,
    });
    expect(items.some((item) => item.group === "management")).toBe(false);
  });

  it("adds the panel for staff without the users link", () => {
    const items = navItems(gestor);

    expect(labels(items)).toEqual(["Catálogo", "Carrito", "Pedidos", "Mi perfil", "Panel"]);
    expect(items.find((item) => item.label === "Panel")).toMatchObject({
      to: "/panel",
      group: "management",
    });
  });

  it("adds the users link for admins", () => {
    const items = navItems(admin);

    expect(items.filter((item) => item.group === "management").at(-1)).toMatchObject({
      to: "/admin/usuarios",
      label: "Usuarios",
    });
  });
});

describe("categoryNavItems", () => {
  it("lists every category after the all-categories link", () => {
    const items = categoryNavItems();

    expect(items).toHaveLength(CATEGORIES.length + 1);
    expect(items[0]).toMatchObject({ to: "/", label: "Todas" });

    for (const category of CATEGORIES) {
      expect(items).toContainEqual({
        to: `/?category=${encodeURIComponent(category)}`,
        label: category,
        icon: categoryIcon(category),
        category,
      });
    }
  });
});
