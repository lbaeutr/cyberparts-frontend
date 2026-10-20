import { describe, expect, it } from "vitest";

import { getErrorMessage } from "./errors";

describe("getErrorMessage", () => {
  it("returns a string detail as-is", () => {
    expect(getErrorMessage({ response: { data: { detail: "Stock insuficiente" } } })).toBe(
      "Stock insuficiente"
    );
  });

  it("joins FastAPI 422 validation details", () => {
    const error = {
      response: {
        data: {
          detail: [
            { loc: ["body", "email"], msg: "El correo no es valido" },
            { loc: ["body", "password"], msg: "Demasiado corta" },
          ],
        },
      },
    };

    expect(getErrorMessage(error)).toBe(
      "email: El correo no es valido · password: Demasiado corta"
    );
  });

  it("handles a single validation detail object", () => {
    const error = {
      response: { data: { detail: { loc: ["body", "stock"], msg: "Valor invalido" } } },
    };

    expect(getErrorMessage(error)).toBe("stock: Valor invalido");
  });

  it("reports network failures", () => {
    expect(getErrorMessage(new Error("Network Error"))).toBe("No hay conexión con el servidor.");
  });

  it("falls back when the server sends no detail", () => {
    expect(getErrorMessage({ response: { status: 500, data: {} } }, "Fallo del servidor")).toBe(
      "Fallo del servidor"
    );
  });

  it("ignores empty arrays and blank strings", () => {
    expect(getErrorMessage({ response: { data: { detail: [] } } }, "Fallo")).toBe("Fallo");
    expect(getErrorMessage({ response: { data: { detail: "  " } } }, "Fallo")).toBe("Fallo");
  });
});
