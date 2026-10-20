import { describe, expect, it } from "vitest";

import { safeImageUrl } from "./urls";

describe("safeImageUrl", () => {
  it("accepts http and https urls", () => {
    expect(safeImageUrl("https://cdn.example.com/a.png")).toBe("https://cdn.example.com/a.png");
    expect(safeImageUrl("http://cdn.example.com/a.png")).toBe("http://cdn.example.com/a.png");
  });

  it("accepts relative paths", () => {
    expect(safeImageUrl("/img/servo.png")).toBe("/img/servo.png");
  });

  it("rejects dangerous or empty values", () => {
    expect(safeImageUrl("javascript:alert(1)")).toBeNull();
    expect(safeImageUrl("data:text/html,<script>")).toBeNull();
    expect(safeImageUrl("")).toBeNull();
    expect(safeImageUrl(null)).toBeNull();
    expect(safeImageUrl(42)).toBeNull();
  });
});
