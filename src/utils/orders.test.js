import { describe, expect, it } from "vitest";

import { allowedTransitions } from "./orders";

describe("allowedTransitions", () => {
  it("returns the valid transitions", () => {
    expect(allowedTransitions("PENDING")).toEqual(["PAID", "CANCELLED"]);
    expect(allowedTransitions("PAID")).toEqual(["SHIPPED", "CANCELLED"]);
    expect(allowedTransitions("SHIPPED")).toEqual(["DELIVERED"]);
  });

  it("returns an empty list for terminal or unknown statuses", () => {
    expect(allowedTransitions("DELIVERED")).toEqual([]);
    expect(allowedTransitions("CANCELLED")).toEqual([]);
    expect(allowedTransitions("WHAT")).toEqual([]);
  });
});
