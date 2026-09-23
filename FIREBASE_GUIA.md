# Guía de Configuración y Solución de Firebase

Esta guía explica la causa del error `auth/api-key-not-valid` y los pasos exactos para configurar tu proyecto de Firebase correctamente.

---

## 1. ¿Por qué ocurrió el error `auth/api-key-not-valid`?

El error ocurre porque la clave `apiKey` (`AIzaSy...`) configurada en el proyecto no es válida en los servidores de Google Cloud / Firebase por alguna de las siguientes razones:
1. **La clave fue generada como un marcador de posición (ejemplo/ChatGPT)** y no coincide con un proyecto real en Google.
2. **La clave fue eliminada o regenerada** en la consola de Google Cloud / Firebase.
3. **Restricciones de API o de dominio:** En Google Cloud Console, la clave tiene restricciones de HTTP Referrer que bloquean `localhost`, o restricciones de API que no permiten el servicio **Identity Toolkit API** (Firebase Auth).

---

## 2. Pasos para obtener tu API Key y Configuración Real

1. Abre la [Consola de Firebase](https://console.firebase.google.com/).
2. Selecciona tu proyecto: **registro-usuarios-7b67a** (o el proyecto que creaste).
3. Haz clic en el ícono de **engranaje ⚙️** (Configuración del proyecto) en el panel izquierdo.
4. En la pestaña **General**, desplázate hacia abajo hasta la sección **Tus apps**.
5. Si no has registrado una aplicación web:
   - Haz clic en el ícono de la app web **`</>`**.
   - Ingresa un apodo (ej. `registro-usuarios-web`) y haz clic en **Registrar app**.
6. En la sección **Configuración del SDK**, selecciona **Config** y copia los valores del objeto `firebaseConfig`:
   ```javascript
   const firebaseConfig = {
     apiKey: "TU_API_KEY_REAL",
     authDomain: "tu-proyecto.firebaseapp.com",
     projectId: "tu-proyecto",
     storageBucket: "tu-proyecto.firebasestorage.app",
     messagingSenderId: "...",
     appId: "...",
     measurementId: "..."
   };
   ```
7. Abre tu archivo local [`.env.local`](./.env.local) y pega los valores correspondientes:
   ```env
   VITE_FIREBASE_API_KEY=TU_API_KEY_REAL
   VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=tu-proyecto
   VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_FIREBASE_MEASUREMENT_ID=...
   ```
8. Guarda el archivo `.env.local` y reinicia el servidor de desarrollo (`npm run dev`) si es necesario.

---

## 3. Habilitar la Autenticación por Correo y Contraseña

Para que el registro funcione, el proveedor debe estar activo:
1. En la consola de Firebase, ve a **Compilación (Build)** > **Authentication**.
2. Si no has empezado, haz clic en **Comenzar** (**Get started**).
3. Ve a la pestaña **Sign-in method** (Método de acceso).
4. Haz clic en **Correo electrónico/contraseña** (Email/Password).
5. Activa el interruptor **Habilitar** (Enable) en la primera opción y guarda los cambios.

---

## 4. Reglas de Seguridad de Cloud Firestore

Para que los usuarios puedan guardar sus datos al registrarse:
1. Ve a **Firestore Database** en la consola de Firebase.
2. Si no está creada, haz clic en **Crear base de datos** (modo producción recomendado).
3. Ve a la pestaña **Reglas** (**Rules**) y configura:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Cada usuario autenticado puede leer y crear su propio documento con su UID
       match /usuarios/{userId} {
         allow create, read, update: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```
4. Haz clic en **Publicar** (**Publish**).

---

## 5. Reglas de Seguridad de Firebase Storage

Para permitir que los usuarios suban su documento de identidad:
1. Ve a **Storage** en la consola de Firebase.
2. Ve a la pestaña **Reglas** (**Rules**) y coloca:
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /documentos/{userId}/{fileName} {
         // Solo el usuario autenticado puede subir a su propia carpeta de documentos
         // Máximo 5 MB y tipos permitidos PDF o imágenes
         allow write: if request.auth != null 
                      && request.auth.uid == userId
                      && request.resource.size <= 5 * 1024 * 1024
                      && (request.resource.contentType.matches('application/pdf')
                          || request.resource.contentType.matches('image/.*'));
         allow read: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```
3. Haz clic en **Publicar** (**Publish**).

---

## 6. Solución al Error de CORS en Firebase Storage

El error de CORS al subir archivos (`Response to preflight request doesn't pass access control check`) ocurre por dos motivos comunes:

### Causa A: El servicio de Storage aún no ha sido creado en la Consola
1. Ve a la [Consola de Firebase](https://console.firebase.google.com/) > tu proyecto **registro-usuarios-7b67a**.
2. En el menú izquierdo ve a **Compilación** > **Storage**.
3. Si ves un botón que dice **"Comenzar"** (**Get started**), haz clic en él.
4. Elige modo de prueba (o tus reglas de seguridad) y selecciona la ubicación del bucket (por ejemplo `us-central1`).
5. Haz clic en **Listo**. Espera unos segundos a que se cree el bucket.
6. En la pestaña **Archivos**, revisa el nombre del bucket que aparece arriba (por ejemplo `registro-usuarios-7b67a.firebasestorage.app` o `registro-usuarios-7b67a.appspot.com`) y asegúrate de que coincida con `VITE_FIREBASE_STORAGE_BUCKET` en tu [.env.local](./.env.local).

---

### Causa B: Falta la política de CORS en el Bucket de Google Cloud Storage
Por defecto, Google Cloud Storage bloquea solicitudes directas desde navegadores web en dominios locales (`http://localhost:5173`).

Para habilitar CORS en 30 segundos sin instalar nada en tu PC:
1. Abre [Google Cloud Console](https://console.cloud.google.com/) con tu cuenta y selecciona el proyecto **registro-usuarios-7b67a**.
2. En la esquina superior derecha, haz clic en el botón de **Cloud Shell** (el ícono `>_`).
3. En la terminal que se abre abajo, copia y pega el siguiente comando:
   ```bash
   echo '[{"origin": ["*"], "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"], "responseHeader": ["*"], "maxAgeSeconds": 3600}]' > cors.json && gcloud storage buckets update gs://registro-usuarios-7b67a.firebasestorage.app --cors-file=cors.json
   ```
   *(Si tu bucket termina en `.appspot.com`, usa `gs://registro-usuarios-7b67a.appspot.com`)*
4. Presiona **Enter** y si te pide autorizar Cloud Shell, haz clic en **Autorizar**.
5. ¡Listo! La política CORS quedará aplicada inmediatamente a tu almacenamiento.

---

## 7. Verificar Restricciones de Clave en Google Cloud (Opcional)

Si alguna vez tu `apiKey` arroja `API_KEY_INVALID`:
1. Entra a [Google Cloud Console - Credenciales](https://console.cloud.google.com/apis/credentials).
2. Selecciona el proyecto **registro-usuarios-7b67a**.
3. Busca tu clave de API (suele llamarse `Browser key (auto created by Firebase)`).
4. Verifica:
   - **Restricciones de aplicación**: Si tiene restricción por sitios web HTTP referrers, asegúrate de añadir `http://localhost:5173/*` y `http://localhost:*`.
   - **Restricciones de API**: Si tiene seleccionada la opción "Restringir clave", verifica que estén habilitadas:
     - **Identity Toolkit API**
     - **Token Service API**
     - **Cloud Firestore API**
     - **Firebase Storage API**
   - O déjala en "No restringir clave" para pruebas de desarrollo.
