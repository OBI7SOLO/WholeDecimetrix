# Decimetrix Server

Servidor backend para la aplicación de mapeo de activos Decimetrix.

## Tecnologías

- **Node.js**: Entorno de ejecución.
- **Express**: Framework web.
- **Socket.IO**: Comunicación en tiempo real.
- **JWT**: Autenticación segura.
- **SQLite/JSON**: Almacenamiento de datos (según implementación actual).

## Instalación

1. Navega al directorio del servidor:

   ```bash
   cd server
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

## Uso

1. Iniciar el servidor en modo desarrollo:

   ```bash
   npm run dev
   ```

   El servidor se ejecutará por defecto en `http://localhost:5000` (o el puerto configurado).

2. **Seed de Datos Iniciales** (Opcional):
   Para poblar la base de datos con usuarios y activos de prueba:
   ```bash
   node seed.js
   ```

## Características API

- **Autenticación**: Endpoints para login y verificación de token.
- **Activos**: CRUD para gestión de activos geolocalizados.
- **Usuarios**: Gestión de usuarios y roles.
- **WebSockets**: Emisión de eventos `new-asset` para actualizaciones en tiempo real.
