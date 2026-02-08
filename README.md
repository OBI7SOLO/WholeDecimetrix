# Decimetrix - Sistema de Mapeo de Activos

Aplicación full-stack para la gestión y visualización de activos geolocalizados con actualización en tiempo real.

## Resumen del repositorio

- Frontend en React + Vite con Mapbox GL JS.
- Backend en Node.js + Express con MongoDB y Socket.IO.
- Autenticación con JWT y manejo de roles (admin/operario).

## Estructura

- [client/](client/) Frontend de la aplicación.
- [server/](server/) Backend y API.

## Guía paso a paso (ejecución local)

### 1) Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd WholeDecimetrix
```

### 2) Configurar el backend

Crear el archivo `server/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/decimetrix
JWT_SECRET=tu_clave_jwt
JWT_REFRESH_SECRET=tu_clave_refresh
PORT=5001
CORS_ORIGIN=http://localhost:5173
```

Instalar dependencias y arrancar:

```bash
cd server
npm install
node seed.js
npm run dev
```

El servidor queda en `http://localhost:5001`.

### 3) Configurar el frontend

Crear el archivo `client/.env`:

```env
VITE_API_URL=http://localhost:5001
VITE_MAPBOX_TOKEN=tu_token_mapbox
```

Instalar dependencias y arrancar:

```bash
cd client
npm install
npm run dev
```

El cliente queda en `http://localhost:5173`.

## Credenciales de prueba (seed)

- Admin: `admin@example.com` / `admin123`
- Usuario: `user@example.com` / `user123`

## Scripts (Windows)

- `start-server.bat`: instala e inicia el servidor.
- `start-client.bat`: instala e inicia el cliente.

## Checklist de verificacion local

- Iniciar sesion con admin y usuario.
- Ver activos en el mapa.
- Crear un activo y confirmar que aparece.
- Cambiar estilo del mapa (Mapa/Satelite/Terreno).
- Cerrar sesion e iniciar de nuevo.

## Tests

N/A.

## Documentación por carpeta

- [client/README.md](client/README.md)
- [server/README.md](server/README.md)
