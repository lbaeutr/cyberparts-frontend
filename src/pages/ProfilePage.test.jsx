import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../test/render";
import ProfilePage from "./ProfilePage";

const mocks = vi.hoisted(() => ({
  oauthAccounts: vi.fn(),
  changePassword: vi.fn(),
  startGithubLink: vi.fn(),
  unlinkGithub: vi.fn(),
  redirectTo: vi.fn(),
}));

const authState = vi.hoisted(() => ({ user: null }));

vi.mock("../api/services", () => ({
  authApi: {
    oauthAccounts: mocks.oauthAccounts,
    changePassword: mocks.changePassword,
    startGithubLink: mocks.startGithubLink,
    unlinkGithub: mocks.unlinkGithub,
  },
}));

vi.mock("../utils/navigation", () => ({ redirectTo: mocks.redirectTo }));

vi.mock("../context/AuthContext", () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({ user: authState.user }),
}));

const linkedAccount = {
  username: "octocat",
  email: "octocat@example.com",
  linked_at: "2026-01-01T00:00:00Z",
};

async function fillPassword(user, { current, next, confirm }) {
  if (current !== undefined) {
    await user.type(screen.getByLabelText("Contraseña actual"), current);
  }
  await user.type(screen.getByLabelText("Nueva contraseña"), next);
  await user.type(screen.getByLabelText("Repetir nueva contraseña"), confirm);
  await user.click(screen.getByRole("button", { name: "Cambiar contraseña" }));
}

describe("ProfilePage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    authState.user = {
      id: 1,
      username: "trinity",
      email: "trinity@test.dev",
      role: "CLIENTE",
      has_password: true,
    };
    vi.spyOn(window, "confirm").mockReturnValue(true);
    mocks.oauthAccounts.mockResolvedValue({ github: null });
    mocks.changePassword.mockResolvedValue(undefined);
    mocks.startGithubLink.mockResolvedValue({
      authorize_url: "https://github.com/login/oauth/authorize?state=x",
    });
    mocks.unlinkGithub.mockResolvedValue(undefined);
  });

  it("renders the account data and the link button", async () => {
    renderWithProviders(<ProfilePage />);

    expect(screen.getByText("trinity")).toBeInTheDocument();
    expect(screen.getByText("trinity@test.dev")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Vincular GitHub" })).toBeInTheDocument();
  });

  it("shows the linked github account", async () => {
    mocks.oauthAccounts.mockResolvedValue({ github: linkedAccount });
    renderWithProviders(<ProfilePage />);

    expect(await screen.findByText("@octocat")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Desvincular GitHub" })).toBeEnabled();
  });

  it("blocks unlinking github until a password exists", async () => {
    authState.user = { ...authState.user, has_password: false };
    mocks.oauthAccounts.mockResolvedValue({ github: linkedAccount });
    renderWithProviders(<ProfilePage />);

    const button = await screen.findByRole("button", { name: "Desvincular GitHub" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("title", "Define una contraseña antes de desvincular GitHub");
  });

  it("rejects a mismatched confirmation without calling the API", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProfilePage />);
    await screen.findByRole("button", { name: "Vincular GitHub" });

    await fillPassword(user, {
      current: "Test1234!",
      next: "Nueva123!",
      confirm: "Otra1234!",
    });

    expect(
      screen.getByText("La confirmación no coincide con la nueva contraseña.")
    ).toBeInTheDocument();
    expect(mocks.changePassword).not.toHaveBeenCalled();
  });

  it("changes the password and notifies success", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProfilePage />);
    await screen.findByRole("button", { name: "Vincular GitHub" });

    await fillPassword(user, {
      current: "Test1234!",
      next: "Nueva123!",
      confirm: "Nueva123!",
    });

    await waitFor(() => {
      expect(mocks.changePassword).toHaveBeenCalledWith(
        {
          current_password: "Test1234!",
          new_password: "Nueva123!",
        },
        expect.anything()
      );
    });
    expect(await screen.findByText("Contraseña actualizada.")).toBeInTheDocument();
  });

  it("lets github-only accounts set a password without the current one", async () => {
    authState.user = { ...authState.user, has_password: false };
    const user = userEvent.setup();
    renderWithProviders(<ProfilePage />);
    await screen.findByRole("button", { name: "Vincular GitHub" });

    expect(screen.queryByLabelText("Contraseña actual")).not.toBeInTheDocument();
    await fillPassword(user, { next: "Nueva123!", confirm: "Nueva123!" });

    await waitFor(() => {
      expect(mocks.changePassword).toHaveBeenCalledWith(
        {
          current_password: undefined,
          new_password: "Nueva123!",
        },
        expect.anything()
      );
    });
  });

  it("shows the API error when the password change fails", async () => {
    mocks.changePassword.mockRejectedValue({
      response: { data: { detail: "La contrasena actual no es correcta" } },
    });
    const user = userEvent.setup();
    renderWithProviders(<ProfilePage />);
    await screen.findByRole("button", { name: "Vincular GitHub" });

    await fillPassword(user, {
      current: "Mala1234!",
      next: "Nueva123!",
      confirm: "Nueva123!",
    });

    expect(await screen.findByText("La contrasena actual no es correcta")).toBeInTheDocument();
  });

  it("redirects to github to start the link flow", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProfilePage />);

    await user.click(await screen.findByRole("button", { name: "Vincular GitHub" }));

    await waitFor(() => {
      expect(mocks.redirectTo).toHaveBeenCalledWith(
        "https://github.com/login/oauth/authorize?state=x"
      );
    });
  });

  it("unlinks github after confirmation", async () => {
    mocks.oauthAccounts.mockResolvedValue({ github: linkedAccount });
    const user = userEvent.setup();
    renderWithProviders(<ProfilePage />);

    await user.click(await screen.findByRole("button", { name: "Desvincular GitHub" }));

    await waitFor(() => {
      expect(mocks.unlinkGithub).toHaveBeenCalled();
    });
    expect(await screen.findByText("Cuenta de GitHub desvinculada.")).toBeInTheDocument();
  });

  it("does not unlink when the confirmation is rejected", async () => {
    window.confirm.mockReturnValue(false);
    mocks.oauthAccounts.mockResolvedValue({ github: linkedAccount });
    const user = userEvent.setup();
    renderWithProviders(<ProfilePage />);

    await user.click(await screen.findByRole("button", { name: "Desvincular GitHub" }));

    expect(mocks.unlinkGithub).not.toHaveBeenCalled();
  });

  it("notifies a successful link returned by the callback", async () => {
    renderWithProviders(<ProfilePage />, { route: "/perfil?oauth=linked" });

    expect(await screen.findByText("Cuenta de GitHub vinculada.")).toBeInTheDocument();
  });

  it("shows the callback error returned in the URL", async () => {
    renderWithProviders(<ProfilePage />, { route: "/perfil?oauth_error=github_in_use" });

    expect(
      await screen.findByText("Esa cuenta de GitHub ya está vinculada a otro usuario.")
    ).toBeInTheDocument();
  });

  it("shows an error when the account cannot be checked", async () => {
    mocks.oauthAccounts.mockRejectedValue(new Error("boom"));
    renderWithProviders(<ProfilePage />);

    expect(
      await screen.findByText("No se pudo comprobar la vinculación con GitHub.")
    ).toBeInTheDocument();
  });
});
