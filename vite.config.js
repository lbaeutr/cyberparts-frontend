import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// El proxy evita problemas de CORS y de cookies (SameSite) en desarrollo:
// el navegador habla con el mismo origen (localhost:5173) y Vite reenvia a FastAPI.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // WSL: el watcher nativo no detecta cambios en /mnt/c, usar polling.
    watch: { usePolling: true, interval: 300 },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: false,
      },
    },
  },
});
