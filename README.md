# CyberParts Web

Frontend de CyberParts: React + Vite + React Router + TanStack Query + Axios.

Este repositorio es un mirror del monorepo `pps-ciberseguridad-trabajos-pps-26-27-lbaeutr`
(carpeta `1_desarrollo_web/frontend`). No lo edites directamente: los cambios se hacen en el
monorepo y se publican con `scripts/push-deploy.sh`.

## Despliegue en Render

El sitio estático y sus cabeceras se definen en `render.yaml` (Blueprint). Render construye
con `npm ci && npm run build` y publica `dist`.

- `VITE_API_URL` apunta a la API de producción:
  `https://cyberparts-lbaeutr-api.onrender.com/api`.
- La rewrite `/* -> /index.html` permite recargar rutas SPA como `/catalogo` o `/perfil`.
- Cabeceras: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy` y `Content-Security-Policy`.
- Caché: inmutable para `/assets/*` y `no-cache` para `/index.html`.

No requiere variables manuales en Render; todo va en `render.yaml`.

## Local

Desde el monorepo:

```bash
./scripts/setup.sh
./scripts/frontend.sh
```

Con `VITE_API_URL` vacío, Axios usa `/api` y el proxy de Vite reenvía a `127.0.0.1:8000`.
Credenciales de prueba: `admin` / `Admin123!` (solo en local).

Documentación completa en el monorepo (`README.md`, `docs/`).
