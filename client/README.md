# Decimetrix Client

Frontend de la aplicación Decimetrix, construido con React y Vite.

## Tecnologías Principales

- **React 19**: Biblioteca de UI.
- **Vite**: Build tool y servidor de desarrollo.
- **Material UI (MUI)**: Componentes de interfaz y diseño.
- **Mapbox GL JS**: Mapas interactivos con soporte WebGL.
- **Redux Toolkit**: Gestión del estado global (Autenticación).
- **Socket.IO Client**: Conexión en tiempo real con el servidor.

## Requisitos Previos

- Tener el servidor backend ejecutándose.

## Instalación

1. Navega al directorio del cliente:

   ```bash
   cd client
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```
   _Nota: Si encuentras problemas con caché, puedes limpiar e instalar de nuevo._

## Configuración

Asegúrate de tener las variables de entorno configuradas si es necesario (ej. `VITE_API_URL`, `VITE_MAPBOX_TOKEN`).

## Ejecución

Para iniciar la aplicación en modo desarrollo:

```bash
npm run dev
```

Abre tu navegador en `http://localhost:5173`.

## Características Frontend

- **Dashboard Interactivo**: Panel principal con vista de mapa y tablas.
- **Autenticación**: Login con manejo de roles (Admin/User) y avatares personalizados.
- **Mapas Avanzados**:
  - Visualización de marcadores de activos.
  - Geolocalización de activos.
  - **Selector de Estilos**: Alternar entre vista Mapa, Satélite y Terreno.
- **Gestión de Activos**: Interfaz modal para crear nuevos activos en el mapa.
- **Tiempo Real**: Notificaciones "Toast" al crearse nuevos activos por otros usuarios.
