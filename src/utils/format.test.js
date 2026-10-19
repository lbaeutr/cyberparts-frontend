import { describe, expect, it } from "vitest";

import {
  CATEGORIES,
  ORDER_STATUS,
  ROLE_LABEL,
  categoryIcon,
  money,
} from "./format";

describe("format", () => {
  it("formats money in euros", () => {
    const formatted = money("12345.5");

    expect(formatted).toContain("12.345,50");
    expect(formatted).toContain("€");
  });

  it("returns the icon for a known category", () => {
    expect(categoryIcon("Sensores")).toBe("◎");
  });

  it("falls back to the default icon", () => {
    expect(categoryIcon("Desconocida")).toBe("⬢");
  });

  it("exposes the seven product categories", () => {
    expect(CATEGORIES).toHaveLength(7);
    expect(CATEGORIES).toContain("Servomotores");
  });

  it("exposes status and role labels", () => {
    expect(ORDER_STATUS.CANCELLED).toBe("Cancelado");
    expect(ROLE_LABEL.ADMIN).toBe("Administrador");
  });
});
