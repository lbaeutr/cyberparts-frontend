import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { authApi } from "../api/services";
import {
  refreshSession,
  setAccessToken,
  setUnauthorizedHandler,
  setUserUpdateHandler,
} from "../api/client";
import { SESSION_RESET_EVENT } from "../utils/events";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const resetSession = useCallback(() => {
    setUser(null);
    queryClient.clear();
    window.dispatchEvent(new Event(SESSION_RESET_EVENT));
  }, [queryClient]);

  useEffect(() => {
    setUnauthorizedHandler(resetSession);
    setUserUpdateHandler((nextUser) => setUser(nextUser));
    return () => {
      setUnauthorizedHandler(null);
      setUserUpdateHandler(null);
    };
  }, [resetSession]);

  // Al recargar la pagina el access token (en memoria) se pierde:
  // intentamos recuperar sesion con el refresh token de la cookie httpOnly.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await refreshSession();
        if (mounted) setUser(data.user);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setInitializing(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(
    async (username, password) => {
      const data = await authApi.login({ username, password });
      setAccessToken(data.access_token);
      queryClient.clear();
      setUser(data.user);
      return data.user;
    },
    [queryClient]
  );

  const register = useCallback(
    async (payload) => {
      await authApi.register(payload);
      return login(payload.username, payload.password);
    },
    [login]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // La sesion local se cierra aunque falle la revocacion en el servidor.
    } finally {
      setAccessToken(null);
      resetSession();
    }
  }, [resetSession]);

  const value = useMemo(
    () => ({
      user,
      initializing,
      login,
      register,
      logout,
      hasRole: (...roles) => Boolean(user) && roles.includes(user.role),
    }),
    [user, initializing, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
