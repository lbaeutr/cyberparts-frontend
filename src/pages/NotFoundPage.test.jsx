import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../test/render";
import NotFoundPage from "./NotFoundPage";

vi.mock("../context/AuthContext", () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({ user: null, hasRole: () => false }),
}));

describe("NotFoundPage", () => {
  it("renders the 404 message and a link home", () => {
    renderWithProviders(<NotFoundPage />);

    expect(screen.getByText("Señal perdida")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver al catálogo" })).toHaveAttribute("href", "/");
  });
});
