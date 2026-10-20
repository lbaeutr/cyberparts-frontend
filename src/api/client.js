import axios from "axios";

// El access token vive SOLO en memoria (no en localStorage) para mitigar XSS.
// El refresh token va en una cookie httpOnly que el navegador envia solo.
let accessToken = null;
let onUnauthorized = null;
let onUserUpdated = null;

export function setAccessToken(token) {
  accessToken = token;
}
export function getAccessToken() {
  return accessToken;
}
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}
export function setUserUpdateHandler(handler) {
  onUserUpdated = handler;
}

export const API_BASE = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Refresco "single-flight": si varias peticiones reciben 401 a la vez,
// solo se lanza una llamada a /auth/refresh y las demas esperan esa promesa.
let refreshingPromise = null;

export async function refreshSession() {
  if (!refreshingPromise) {
    refreshingPromise = axios
      .post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true })
      .then((res) => {
        setAccessToken(res.data.access_token);
        if (res.data.user && onUserUpdated) onUserUpdated(res.data.user);
        return res.data;
      })
      .finally(() => {
        refreshingPromise = null;
      });
  }
  return refreshingPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;
    const isAuthCall =
      config?.url?.includes("/auth/refresh") || config?.url?.includes("/auth/login");

    const deactivated =
      response?.status === 403 && /desactivad/i.test(String(response?.data?.detail ?? ""));

    if (deactivated) {
      setAccessToken(null);
      if (onUnauthorized) onUnauthorized();
      return Promise.reject(error);
    }

    if (response?.status === 401 && !config?._retry && !isAuthCall) {
      config._retry = true;
      try {
        await refreshSession();
        config.headers.Authorization = `Bearer ${accessToken}`;
        return api(config);
      } catch (refreshError) {
        setAccessToken(null);
        if (onUnauthorized) onUnauthorized();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
