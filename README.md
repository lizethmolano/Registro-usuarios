# 🎫 Nombre del Aplicativo

Registro de Usuarios - IETS

# Logo del IETS

<div align="center">
  <img src="https://iets.org.co/wp-content/uploads/2021/05/Logo-IETS-color-1024x512.png" alt="Logo IETS" width="200"/>
</div>

## 📋 Descripción
 
Aplicativo web institucional del Instituto de Evaluación Tecnológica en Salud (IETS) para el registro y la gestión de usuarios. Permite que cualquier persona se registre en el sistema diligenciando sus datos personales, credenciales de acceso y un documento de identificación digitalizado. Los administradores autorizados cuentan con un panel de control para consultar, editar, eliminar y exportar los registros.


## 🌐 URL del aplicativo
> *(Opcional / si aplica)*

## 📱 Responsive design

Sí. La interfaz se adapta a dispositivos móviles y de escritorio mediante CSS Grid/Flexbox y media queries (breakpoints en 960px y 640px).


## 🔐 Acceso y seguridad

El formulario de registro es de acceso público.

El panel de administración requiere inicio de sesión mediante Firebase Authentication.
Control de roles: cada usuario tiene un campo rol (usuario o admin) en Firestore. Solo las cuentas con rol: "admin" pueden ver y operar el panel administrativo; los usuarios normales no tienen acceso a él aunque estén autenticados.
Verificación de rol en dos capas: al iniciar sesión (bloqueo inmediato con mensaje


## ✨ Características principales

Formulario público de registro con validaciones (nombre, documento, edad según tipo de documento, correo, contraseña, archivo adjunto).
Carga de documento de identificación (PDF, JPG, PNG) con compresión automática de imágenes antes de guardarlo.
Envío de correo de verificación al registrarse.
Popup de confirmación de registro exitoso.
Panel de administración con:
Listado de usuarios en tiempo real (Firestore).
Búsqueda y filtros por tipo de documento y estado.
Edición y eliminación de registros.
Visualización/descarga del documento adjunto de cada usuario.
Exportación de registros filtrados a CSV.
Métricas rápidas (total de usuarios, activos, en revisión, con documento adjunto).

## 🛠️ Tecnologías utilizadas

### Backend

Firebase Authentication (registro e inicio de sesión)
Cloud Firestore (base de datos de usuarios)

### Frontend

Firebase Authentication
Cloud Firestore 
Frontend
React
Vite
CSS

### Base de datos

Cloud Firestore

### Librerías e integraciones

firebase
Base64

## 🚀 Instalación

# Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>
cd registro-usuarios

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev


## ⚙️ Configuración

Las credenciales de Firebase están definidas directamente en src/firebase/config.js, apuntando al proyecto registro-usuarios-7b67a. Ahí se inicializan:

Firebase Authentication (auth) — registro e inicio de sesión.
Cloud Firestore (db) — almacenamiento de usuarios y sus documentos adjuntos (en Base64).

### Web.config (variables clave)

#### Conexiones a datos

Cloud Firestore (registro-usuarios-7b67a): única fuente de datos. Colección usuarios, un documento por usuario (usuarios/{uid}), con campos como nombre, apellido, correo, tipoDocumento, numeroIdentificacion, estado, rol, documentoBase64, fechaRegistro.

#### Configuración de almacenamiento
> *(Google Drive, OneDrive, File Server, etc. — según aplique)*

El documento de identificación no se guarda en un servicio de almacenamiento externo: se convierte a Base64 y se guarda como un campo más (documentoBase64) dentro del mismo documento de Firestore.

#### Configuración de correo (SMTP)

El correo de verificación (sendEmailVerification) lo envía automáticamente Firebase Authentication con su plantilla predeterminada

Asunto

#Agregaste la verificación en 2 pasos a tu cuenta de %APP_NAME%

#Mensaje

Hola, %DISPLAY_NAME%:

Tu cuenta de %APP_NAME% se actualizó con %SECOND_FACTOR% para la verificación en 2 pasos.

Si no agregaste esta verificación en 2 pasos, haz clic en el siguiente vínculo para quitarla.

https://registro-usuarios-7b67a.firebaseapp.com/__/auth/action?mode=action&oobCode=code

Gracias.

El equipo de %APP_NAME%

## 📂 Estructura del proyecto


registro-usuarios/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── AdminPanel.jsx       # Panel CRUD para administradores
│   │   ├── EditUserModal.jsx    # Modal de edición de usuario
│   │   ├── Footer.jsx
│   │   ├── Header.jsx
│   │   ├── LoginModal.jsx       # Login + verificación de rol admin (colección "perfiles")
│   │   ├── RegistroForm.jsx     # Formulario público de registro
│   │   └── SuccessModal.jsx     # Popup de registro exitoso
│   ├── firebase/
│   │   └── config.js            # Inicialización de Firebase (Auth + Firestore)
│   ├── App.jsx                  # Enrutamiento entre vistas + control de sesión/rol
│   ├── App.css                  # Estilos institucionales IETS
│   ├── index.css
│   └── main.jsx
├── public/
├── .env.example
├── package.json
└── vite.config.js




## 📂 Estructura de almacenamiento
> *(Opcional / si aplica)*

## 👥 Roles y funcionalidades


### 👤 Funcionario/ usuarios

Accede al formulario público de registro (sin necesidad de iniciar sesión).
Diligencia sus datos personales, crea sus credenciales de acceso y adjunta su documento de identificación.
Recibe un correo de verificación y un popup de confirmación al completar el registro.
No tiene acceso al panel de administración: aunque su cuenta queda autenticada en Firebase tras el registro, no tiene un documento con rol: "admin" en la colección perfiles, así que la app lo trata como usuario normal y le muestra la pantalla de "Acceso Restringido" si intenta entrar al panel.


### 🛡️ Administrador /perfil

Su cuenta debe tener un documento en la colección perfiles (perfiles/{uid}) con rol: "admin" — esto se asigna manualmente desde Firebase Console, no hay forma de auto-asignarse este rol desde la app.
Inicia sesión desde el modal de acceso; solo entra si ese rol se confirma.
Consulta el listado completo de usuarios registrados en tiempo real, con búsqueda y filtros (tipo de documento, estado).
Visualiza y descarga el documento de identificación adjunto de cualquier usuario.
Edita y elimina registros.
Exporta el listado filtrado a CSV.
Ve métricas generales (total de usuarios, activos, en revisión, con documento adjunto).


## 📧 Plantilla de notificación

Se usa la plantilla predeterminada de Firebase Authentication para el correo de verificación de cuenta, enviada automáticamente al registrarse. Se puede editar el asunto, remitente y contenido desde Firebase Console → Authentication → Templates → "Verificación de correo electrónico".


