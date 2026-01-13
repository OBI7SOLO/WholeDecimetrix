# Fase 6: Deploy & Entrega

## Opción A: Deploy Rápido (Recomendado)

### Backend - Railway

1. **Crear cuenta en [Railway.app](https://railway.app)**
2. **Conectar GitHub:**
   - Click "New Project"
   - "Deploy from GitHub repo"
   - Seleccionar `WholeDecimetrix`

3. **Configurar variables en Railway:**
   - Variables → Agregar:
     ```
     MONGODB_URI=tu_uri_de_mongodb
     JWT_SECRET=tu_secreto_jwt
     PORT=5000
     ```
   - Root directory: `server`

4. **Obtener URL del servidor:**
   - Railway te genera algo como: `https://your-service-xxxx.railway.app`

### Frontend - Vercel

1. **Crear cuenta en [Vercel.com](https://vercel.com)**
2. **Importar proyecto:**
   - Click "Add New..." → "Project"
   - Seleccionar `WholeDecimetrix` repo

3. **Configurar build:**
   - Framework: Vite
   - Root directory: `client`
   - Build command: `npm run build`
   - Output directory: `dist`

4. **Variables de entorno:**
   - VITE_API_URL = `https://your-service-xxxx.railway.app`
   - VITE_MAPBOX_TOKEN = tu token

5. **Deploy automático:**
   - Vercel se dispara en cada push a `main`

## Paso a Paso - 15 minutos

1. ✅ Push a GitHub (ya hecho)
2. ⏭️ Conectar Railway al repo
3. ⏭️ Conectar Vercel al repo
4. ⏭️ Obtener URL de Railway
5. ⏭️ Actualizar VITE_API_URL en Vercel
6. ⏭️ Grabar video demostrando funcionalidad

## URLs Finales

Backend: `https://your-service.railway.app`
Frontend: `https://your-app.vercel.app`

---

**Tiempo total: ~30 minutos incluida grabación de video**
