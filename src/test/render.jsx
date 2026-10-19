import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { ThemeProvider } from "../context/ThemeContext";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(ui, { route = "/" } = {}) {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <ThemeProvider>
        <MemoryRouter initialEntries={[route]}>
          <AuthProvider>
            <CartProvider>{ui}</CartProvider>
          </AuthProvider>
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
