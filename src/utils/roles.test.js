import { describe, expect, it } from "vitest";

import { ROLES, canShop } from "./roles";

describe("canShop", () => {
  it("allows clients and anonymous users", () => {
    expect(canShop(() => false)).toBe(true);
    expect(canShop((...roles) => roles.includes("CLIENTE"))).toBe(true);
  });

  it("blocks staff roles", () => {
    const staff = (...roles) => roles.includes("ADMIN") || roles.includes("GESTOR");
    expect(canShop(staff)).toBe(false);
  });

  it("lists the three roles", () => {
    expect(ROLES).toEqual(["ADMIN", "GESTOR", "CLIENTE"]);
  });
});
