import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../test/render";
import OAuthCallbackPage from "./OAuthCallbackPage";

const auth = vi.hoisted(() => ({ current: {} }));

vi.mock("../context/AuthContext", () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => auth.current,
}));

function renderCallback(route) {
  return renderWithProviders(
    <Routes>
      <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
      <Route path="/" element={<div>pagina inicio</div>} />
      <Route path="/login" element={<div>pagina login</div>} />
    </Routes>,
    { route }
  );
}

describe("OAuthCallbackPage", () => {
  beforeEach(() => {
    auth.current = { completeOAuth: vi.fn().mockResolvedValue({ username: "octocat" }) };
  });

  it("exchanges the code and navigates home", async () => {
    renderCallback("/oauth/callback?code=codigo-seguro");

    expect(await screen.findByText("pagina inicio")).toBeInTheDocument();
    expect(auth.current.completeOAuth).toHaveBeenCalledWith("codigo-seguro");
  });

  it("shows a translated GitHub error", async () => {
    renderCallback("/oauth/callback?error=email_in_use");

    expect(await screen.findByText(/Ya existe una cuenta con ese correo/)).toBeInTheDocument();
    expect(auth.current.completeOAuth).not.toHaveBeenCalled();
  });

  it("rejects a callback without code", async () => {
    renderCallback("/oauth/callback");

    expect(await screen.findByText(/respuesta incompleta/)).toBeInTheDocument();
    expect(auth.current.completeOAuth).not.toHaveBeenCalled();
  });

  it("shows the exchange error", async () => {
    auth.current.completeOAuth.mockRejectedValue({
      response: { data: { detail: "Codigo de autorizacion invalido o expirado" } },
    });
    renderCallback("/oauth/callback?code=codigo-caducado");

    expect(
      await screen.findByText("Codigo de autorizacion invalido o expirado")
    ).toBeInTheDocument();
  });
});
