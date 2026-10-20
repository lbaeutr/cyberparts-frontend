import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { ThemeProvider, useTheme } from "./ThemeContext";

const STORAGE_KEY = "cyberparts-theme";

function Probe() {
  const { theme, toggle } = useTheme();
  return (
    <>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggle}>toggle</button>
    </>
  );
}

function renderTheme() {
  return render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>
  );
}

describe("ThemeContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to the dark theme", () => {
    renderTheme();

    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });

  it("restores a stored theme", () => {
    localStorage.setItem(STORAGE_KEY, "light");

    renderTheme();

    expect(screen.getByTestId("theme")).toHaveTextContent("light");
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it("ignores invalid stored values", () => {
    localStorage.setItem(STORAGE_KEY, "neon");

    renderTheme();

    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
  });

  it("toggles and persists the theme", async () => {
    const user = userEvent.setup();
    renderTheme();

    await user.click(screen.getByRole("button", { name: "toggle" }));

    expect(screen.getByTestId("theme")).toHaveTextContent("light");
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("light");
  });
});
