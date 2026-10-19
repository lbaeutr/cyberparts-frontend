import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../test/render";
import AdminUsersPage from "./AdminUsersPage";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  setRole: vi.fn(),
  setActive: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("../api/services", () => ({
  usersApi: {
    list: mocks.list,
    setRole: mocks.setRole,
    setActive: mocks.setActive,
    remove: mocks.remove,
  },
}));

vi.mock("../context/AuthContext", () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({ user: { id: 1, username: "smith", role: "ADMIN" }, hasRole: () => true }),
}));

const users = [
  { id: 1, username: "smith", email: "smith@matrix.dev", role: "ADMIN", is_active: true },
  { id: 2, username: "neo", email: "neo@matrix.dev", role: "CLIENTE", is_active: true },
  {
    id: 3,
    username: "morpheus",
    email: "morpheus@matrix.dev",
    role: "GESTOR",
    is_active: false,
  },
];

function rowOf(username) {
  return screen.getByText(username).closest("tr");
}

describe("AdminUsersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.list.mockResolvedValue(users);
    mocks.setRole.mockResolvedValue({});
    mocks.setActive.mockResolvedValue({});
    mocks.remove.mockResolvedValue(undefined);
  });

  it("renders the users and role statistics", async () => {
    renderWithProviders(<AdminUsersPage />);

    expect(await screen.findByText("smith")).toBeInTheDocument();
    expect(screen.getByText("neo")).toBeInTheDocument();
    expect(within(screen.getByText("Total").closest(".stat")).getByText("3")).toBeInTheDocument();
  });

  it("changes another user's role", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminUsersPage />);
    await screen.findByText("neo");

    await user.selectOptions(screen.getByLabelText("Rol de neo"), "GESTOR");

    await waitFor(() => {
      expect(mocks.setRole).toHaveBeenCalledWith(2, "GESTOR");
    });
  });

  it("protects the current admin from being edited", async () => {
    renderWithProviders(<AdminUsersPage />);
    await screen.findByText("smith");

    expect(screen.getByLabelText("Rol de smith")).toBeDisabled();
    expect(within(rowOf("smith")).queryByRole("button")).not.toBeInTheDocument();
  });

  it("activates an inactive user", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminUsersPage />);
    await screen.findByText("morpheus");

    await user.click(within(rowOf("morpheus")).getByRole("button", { name: "Activar" }));

    await waitFor(() => {
      expect(mocks.setActive).toHaveBeenCalledWith(3, true);
    });
  });

  it("deactivates an active user", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminUsersPage />);
    await screen.findByText("neo");

    await user.click(within(rowOf("neo")).getByRole("button", { name: "Desactivar" }));

    await waitFor(() => {
      expect(mocks.setActive).toHaveBeenCalledWith(2, false);
    });
  });

  it("deletes another user", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminUsersPage />);
    await screen.findByText("neo");

    await user.click(within(rowOf("neo")).getByRole("button", { name: "Eliminar" }));

    await waitFor(() => {
      expect(mocks.remove).toHaveBeenCalledWith(2);
    });
  });
});
