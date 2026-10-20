import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ToastProvider, useToast } from "./ToastContext";

function Probe() {
  const { notify } = useToast();
  return (
    <>
      <button onClick={() => notify("Guardado")}>ok</button>
      <button onClick={() => notify("Fallo", "error")}>error</button>
    </>
  );
}

function renderToasts() {
  return render(
    <ToastProvider>
      <Probe />
    </ToastProvider>
  );
}

describe("ToastProvider", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows a success notification", () => {
    renderToasts();

    fireEvent.click(screen.getByRole("button", { name: "ok" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Guardado");
    expect(screen.getByRole("alert")).toHaveClass("ok");
  });

  it("shows an error notification", () => {
    renderToasts();

    fireEvent.click(screen.getByRole("button", { name: "error" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Fallo");
    expect(screen.getByRole("alert")).toHaveClass("error");
  });

  it("can be dismissed manually", () => {
    renderToasts();
    fireEvent.click(screen.getByRole("button", { name: "ok" }));

    fireEvent.click(screen.getByRole("button", { name: "Cerrar aviso" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("dismisses itself after the timeout", () => {
    vi.useFakeTimers();
    renderToasts();
    fireEvent.click(screen.getByRole("button", { name: "ok" }));

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
