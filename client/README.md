# Decimetrix Client

Frontend de la aplicación Decimetrix, construido con React y Vite.

## Tecnologías principales

- React 19
- Vite
- Material UI (MUI)
- Mapbox GL JS
- Redux Toolkit
- Socket.IO Client

## Requisitos previos

- Backend ejecutándose en `http://localhost:5001` (o el puerto configurado).

## Instalación

```bash
cd client
npm install
```

## Configuración

Crear el archivo `client/.env`:

```env
VITE_API_URL=http://localhost:5001
VITE_MAPBOX_TOKEN=tu_token_mapbox
```

## Ejecución

```bash
npm run dev
```

Abrir `http://localhost:5173`.

## Scripts

- `npm run dev`: inicia el servidor de desarrollo.
- `npm run build`: compila para producción.
- `npm run preview`: sirve el build local.

## Características frontend

- Dashboard con mapa y tablas.
- Autenticación con roles (admin/operario).
- Cambio de estilos de mapa (Mapa, Satélite, Terreno).
- Gestión de activos con modal de creación.
- Actualizaciones en tiempo real vía WebSockets.
