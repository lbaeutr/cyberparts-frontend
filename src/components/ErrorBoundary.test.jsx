import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ErrorBoundary from "./ErrorBoundary";

function Explode() {
  throw new Error("boom");
}

const swallowError = (event) => event.preventDefault();

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    window.addEventListener("error", swallowError);
  });

  afterEach(() => {
    window.removeEventListener("error", swallowError);
    vi.restoreAllMocks();
  });

  it("renders its children when there is no error", () => {
    render(
      <ErrorBoundary>
        <div>contenido</div>
      </ErrorBoundary>
    );

    expect(screen.getByText("contenido")).toBeInTheDocument();
  });

  it("shows a fallback instead of a blank screen", () => {
    render(
      <ErrorBoundary>
        <Explode />
      </ErrorBoundary>
    );

    expect(screen.getByRole("alert")).toHaveTextContent("La interfaz ha fallado");
    expect(screen.getByRole("button", { name: "Recargar" })).toBeInTheDocument();
  });

  it("reloads the page from the fallback", async () => {
    const reload = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, reload },
    });
    const user = userEvent.setup();

    render(
      <ErrorBoundary>
        <Explode />
      </ErrorBoundary>
    );
    await user.click(screen.getByRole("button", { name: "Recargar" }));

    expect(reload).toHaveBeenCalled();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });
});
