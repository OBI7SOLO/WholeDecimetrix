# Decimetrix - Mapeo de Activos en Tiempo Real

Una aplicación full-stack para mapear y gestionar activos (Pozos, Motores, Transformadores) en tiempo real con roles de usuario (Admin y Operario).

## 🚀 Stack Tecnológico

- **Frontend**: React + Vite + Redux Toolkit + SWR
- **Backend**: Node.js + Express + Socket.io
- **BD**: MongoDB (Atlas)
- **Mapas**: Mapbox GL
- **UI**: Material UI + Styled Components

## 📋 Requisitos

- Node.js (v16+)
- MongoDB Atlas (cuenta gratuita)
- Mapbox (API Key gratuita)

## 🔧 Instalación

### 1. Clonar repositorio
```bash
git clone <repo-url>
cd WholeDecimetrix
```

### 2. Backend

```bash
cd server
npm install

# Crear archivo .env basado en .env.example
cp .env.example .env

# Editar .env con tus credenciales
MONGODB_URI=mongodb+srv://usuario:contraseña@cluster0...
JWT_SECRET=tu_secreto_jwt_aqui
PORT=5000

# Ejecutar seed para crear usuarios demo
npm run seed

# Iniciar servidor (desarrollo)
npm run dev

# O producción
npm start
```

**Usuarios demo creados:**
- Admin: `admin@example.com` / `admin123`
- Operario: `operator@example.com` / `operator123`

### 3. Frontend

```bash
cd client
npm install

# Crear archivo .env basado en .env.example
cp .env.example .env

# Editar .env
VITE_API_URL=http://localhost:5000
VITE_MAPBOX_TOKEN=tu_token_mapbox_aqui

# Iniciar servidor de desarrollo
npm run dev

# Build para producción
npm run build
```

## 🎯 Características Implementadas

### ✅ Fase 1-3: Autenticación y Router
- Login con JWT
- Redux para guardar token y rol
- Rutas protegidas
- Logout

### ✅ Fase 4: Mapa y Activos
- Mapa Mapbox GL integrado
- Visualización de activos con marcadores de colores:
  - 🔴 Pozo (Rojo)
  - 🟢 Motor (Verde)
  - 🔵 Transformador (Azul)
- Modal para crear nuevos activos
- Formulario con validación (Nombre, Tipo, Lat/Lng)

### ✅ Fase 5: Real-time con Socket.io
- Conexión en tiempo real
- Notificaciones (Toast) cuando se crea un nuevo activo
- Actualización automática de la lista sin recargar
- Sincronización entre múltiples usuarios

### ✅ Control de Acceso por Rol
- **Admin**: Ve todos los activos
- **Operario**: Ve solo sus propios activos

## 🧪 Validación

### Backend (con Postman)
```bash
# 1. Login
POST http://localhost:5000/login
Body: { "email": "admin@example.com", "password": "admin123" }

# 2. Obtener activos (con token)
GET http://localhost:5000/assets
Header: Authorization: Bearer <token>

# 3. Crear activo
POST http://localhost:5000/assets
Header: Authorization: Bearer <token>
Body: {
  "name": "Pozo Principal",
  "type": "Pozo",
  "lat": 40.7128,
  "lng": -74.0060
}
```

### Real-time
1. Abre la app en navegador normal (Admin)
2. Abre otra ventana en incógnito (Operario)
3. Crea un activo en una ventana
4. Verifica que aparezca en la otra (con Toast)

## 📦 Estructura del Proyecto

```
WholeDecimetrix/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Map.jsx
│   │   │   ├── CreateAssetModal.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── redux/
│   │   │   ├── store.js
│   │   │   └── authSlice.js
│   │   ├── hooks/
│   │   │   └── useSocket.js
│   │   └── App.jsx
│   └── .env.example
├── server/
│   ├── models/
│   │   ├── User.js
│   │   └── Asset.js
│   ├── index.js
│   ├── seed.js
│   └── .env.example
└── .gitignore
```

## 🚀 Próximos Pasos (Mejoras Futuras)

- [ ] Edición y eliminación de activos
- [ ] Líneas de conexión entre activos (GeoJSON)
- [ ] Panel de administración de operarios
- [ ] Tests unitarios (Jest)
- [ ] Autenticación con OAuth
- [ ] Historial de cambios

## 🔐 Seguridad

- Variables sensibles en `.env` (no versionadas)
- JWT para autenticación
- CORS configurado
- Contraseñas hasheadas con bcryptjs

## 📝 Notas

- El `.env` NO se versionada (en `.gitignore`)
- Usa `.env.example` como referencia
- MongoDB Atlas ofrece tier gratuito
- Mapbox tiene tier gratuito con suficientes requests

## 👤 Créditos

Desarrollado como prueba técnica de Decimetrix.
