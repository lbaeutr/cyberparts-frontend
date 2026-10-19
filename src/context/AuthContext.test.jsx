import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider, useAuth } from "./AuthContext";

const mocks = vi.hoisted(() => ({
  refreshSession: vi.fn(),
  setAccessToken: vi.fn(),
  setUnauthorizedHandler: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
}));

vi.mock("../api/client", () => ({
  refreshSession: mocks.refreshSession,
  setAccessToken: mocks.setAccessToken,
  setUnauthorizedHandler: mocks.setUnauthorizedHandler,
}));

vi.mock("../api/services", () => ({
  authApi: {
    login: mocks.login,
    logout: mocks.logout,
    register: mocks.register,
  },
}));

function Probe() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="state">
        {auth.initializing ? "loading" : auth.user ? auth.user.username : "anon"}
      </span>
      <span data-testid="role">{auth.hasRole("ADMIN") ? "admin" : "no-admin"}</span>
      <button onClick={() => auth.login("neo", "Matrix123!")}>login</button>
      <button onClick={() => auth.register({ username: "neo" })}>register</button>
      <button onClick={auth.logout}>logout</button>
    </div>
  );
}

function renderAuth() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.refreshSession.mockRejectedValue(new Error("sin sesion"));
    mocks.login.mockResolvedValue({
      access_token: "access",
      user: { username: "neo", role: "CLIENTE" },
    });
    mocks.logout.mockResolvedValue(undefined);
    mocks.register.mockResolvedValue(undefined);
  });

  it("restores the session with the refresh token", async () => {
    mocks.refreshSession.mockResolvedValue({
      access_token: "access",
      user: { username: "neo", role: "ADMIN" },
    });

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("neo"));
    expect(screen.getByTestId("role")).toHaveTextContent("admin");
  });

  it("stays anonymous when restore fails", async () => {
    renderAuth();

    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("anon"));
    expect(screen.getByTestId("state")).not.toHaveTextContent("loading");
  });

  it("logs in and stores the access token", async () => {
    const user = userEvent.setup();
    renderAuth();
    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("anon"));

    await user.click(screen.getByRole("button", { name: "login" }));

    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("neo"));
    expect(mocks.login).toHaveBeenCalledWith({ username: "neo", password: "Matrix123!" });
    expect(mocks.setAccessToken).toHaveBeenCalledWith("access");
  });

  it("registers and then logs in", async () => {
    const user = userEvent.setup();
    renderAuth();
    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("anon"));

    await user.click(screen.getByRole("button", { name: "register" }));

    await waitFor(() =>
      expect(mocks.login).toHaveBeenCalledWith({ username: "neo", password: undefined })
    );
    expect(mocks.register).toHaveBeenCalledWith({ username: "neo" });
  });

  it("clears the session on logout even if the request fails", async () => {
    mocks.refreshSession.mockResolvedValue({
      access_token: "access",
      user: { username: "neo", role: "CLIENTE" },
    });
    mocks.logout.mockRejectedValue(new Error("red caida"));
    const user = userEvent.setup();
    renderAuth();
    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("neo"));

    await user.click(screen.getByRole("button", { name: "logout" }));

    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("anon"));
    expect(mocks.setAccessToken).toHaveBeenCalledWith(null);
  });

  it("clears the user when the unauthorized handler fires", async () => {
    mocks.refreshSession.mockResolvedValue({
      access_token: "access",
      user: { username: "neo", role: "CLIENTE" },
    });
    renderAuth();
    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("neo"));

    const handler = mocks.setUnauthorizedHandler.mock.calls.at(-1)[0];
    act(() => handler());

    expect(screen.getByTestId("state")).toHaveTextContent("anon");
  });
});
