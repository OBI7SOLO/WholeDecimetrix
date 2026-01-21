# Decimetrix - Sistema de Mapeo de Activos

Aplicación full-stack para la gestión y visualización de activos geolocalizados en mapas interactivos.

## Estructura del Proyecto

El repositorio está dividido en dos carpetas principales:

- **/client**: Frontend de la aplicación (React + Vite).
- **/server**: Backend de la aplicación (Node.js + Express).

## Características Generales

- 🔐 **Autenticación Segura**: Sistema de Login con roles (Administrador y Usuario).
- 🗺️ **Mapeo Interactivo**: Uso de Mapbox para visualizar activos con precisión.
- 🔄 **Tiempo Real**: Actualizaciones instantáneas vía WebSockets cuando se crean activos.
- 📱 **Diseño Responsivo**: Interfaz moderna construida con Material UI.
- 🌍 **Vistas de Mapa**: Soporte para cambio de estilo de mapa (Calles, Satélite, Terreno).

## Guía de Instalación y Uso

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd WholeDecimetrix
```

### 2. Configurar el Backend (Servidor)

```bash
cd server
npm install
node seed.js  # (Opcional) Carga datos de prueba: usuarios admin/user
npm run dev
```
*El servidor correrá en el puerto 5000.*

### 3. Configurar el Frontend (Cliente)

Abre una nueva terminal en la raíz del proyecto:

```bash
cd client
npm install
npm run dev
```
*El cliente correrá en http://localhost:5173.*

## Credenciales de Prueba (si se ejecutó seed.js)

- **Admin**: `admin@example.com` / `admin123`
- **Usuario**: `user@example.com` / `user123`

## Scripts de Ayuda (Windows)

En la raíz del proyecto se incluyen scripts batch para facilitar el inicio:
- `start-server.bat`: Instala e inicia el servidor.
- `start-client.bat`: Instala e inicia el cliente.
