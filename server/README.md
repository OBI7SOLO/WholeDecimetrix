# Decimetrix Server

Servidor backend para la aplicación de mapeo de activos Decimetrix.

## Tecnologías

- Node.js
- Express
- MongoDB + Mongoose
- Socket.IO
- JWT

## Instalación

```bash
cd server
npm install
```

## Configuración

Crear el archivo `server/.env` con tus propios valores. Necesitas una base de datos MongoDB activa (local o en la nube) y generar tus propias claves JWT.

Ejemplo de variables (reemplaza con tus credenciales reales):

```env
MONGODB_URI=mongodb://usuario:password@host:27017/decimetrix
JWT_SECRET=tu_clave_jwt
JWT_REFRESH_SECRET=tu_clave_refresh
PORT=5001
CORS_ORIGIN=http://localhost:5173
```

Notas:

- Si usas MongoDB Atlas, copia el string de conexion desde el panel de Atlas.
- No compartas tus claves reales ni las subas al repositorio.

## Ejecución

```bash
npm run dev
```

El servidor se ejecuta en `http://localhost:5001` (o el puerto configurado).

## Seed de datos

```bash
node seed.js
```

## Características API

- Autenticación con JWT (login y refresh).
- CRUD de activos geolocalizados.
- Gestión de usuarios y roles.
- Eventos en tiempo real vía Socket.IO.

## Endpoints (resumen)

Autenticación:

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

Activos:

- `GET /assets`
- `POST /assets`
- `PUT /assets/:id`
- `DELETE /assets/:id`

Usuarios (admin):

- `GET /users`
- `POST /users`
- `PUT /users/:id`
- `DELETE /users/:id`
