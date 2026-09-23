# Guía de Despliegue y Control de Versiones (IETS)

Esta guía detalla los pasos para versionar el código fuente en **GitHub** y desplegar la aplicación en **Netlify** o **Render.com**.

---

## 1. Control de Versiones con Git y GitHub

### Paso 1: Inicializar el repositorio local
Abre tu terminal en la carpeta del proyecto (`registro-usuarios`) y ejecuta:

```bash
# Inicializar git (si no está inicializado)
git init

# Crear rama principal 'main'
git branch -M main

# Agregar todos los archivos al seguimiento (respetando .gitignore)
git add .

# Realizar el primer commit con las reglas de negocio implementadas
git commit -m "feat: implementacion completa registro IETS, panel administrador CRUD y estilos corporativos"
```

### Paso 2: Vincular con tu repositorio en GitHub
1. Entra a [GitHub](https://github.com/) y crea un nuevo repositorio (ejemplo: `registro-usuarios-iets`).
2. Copia la URL del repositorio remoto y vincula tu proyecto:

```bash
git remote add origin https://github.com/TU_USUARIO/registro-usuarios-iets.git
git push -u origin main
```

---

## 2. Despliegue en Netlify (Recomendado)

El proyecto ya cuenta con los archivos [`public/_redirects`](./public/_redirects) y [`netlify.toml`](./netlify.toml) preconfigurados para soportar SPA sin errores 404.

### Opción A: Despliegue continuo con GitHub (Recomendado)
1. Inicia sesión en [Netlify](https://app.netlify.com/).
2. Haz clic en **"Add new site"** > **"Import an existing project"**.
3. Selecciona **GitHub** y autoriza el acceso a tu repositorio `registro-usuarios-iets`.
4. En los ajustes de compilación verifica:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. **Configuración de Variables de Entorno (Muy Importante):**
   - En la sección **Environment variables** en Netlify, haz clic en **"Add a variable"** y agrega las mismas variables de tu archivo `.env.local`:
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`
     - `VITE_FIREBASE_MEASUREMENT_ID`
6. Haz clic en **"Deploy site"**. Netlify generará tu enlace público (ej. `https://registro-iets.netlify.app`).

### Opción B: Despliegue Manual (Drag & Drop)
1. Ejecuta en tu terminal local:
   ```bash
   npm run build
   ```
2. Ve a [Netlify Drop](https://app.netlify.com/drop) y arrastra la carpeta `dist/` generada en tu proyecto.

---

## 3. Despliegue en Render.com

1. Inicia sesión en [Render.com](https://render.com/).
2. Haz clic en **"New +"** > **"Static Site"**.
3. Conecta tu repositorio de GitHub.
4. Configura:
   - **Name:** `registro-usuarios-iets`
   - **Branch:** `main`
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`
5. En la sección **Environment Variables**, añade las variables `VITE_FIREBASE_*` de tu `.env.local`.
6. En la pestaña **Redirects / Rewrites**, añade una regla para SPA:
   - Source: `/*`
   - Destination: `/index.html`
   - Action: `Rewrite`
7. Haz clic en **Create Static Site**.
