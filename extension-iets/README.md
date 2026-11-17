# 🧩 Autollenador Inteligente y Saneamiento Masivo – Repositorio IETS

# Logo del IETS

<div align="center">
  <img src="https://iets.org.co/wp-content/uploads/2021/05/Logo-IETS-color-1024x512.png" alt="Logo IETS" width="220"/>
</div>

## 📋 Descripción

Extensión oficial para Google Chrome (**Manifest V3 – Versión 3.0**) desarrollada para el **Instituto de Evaluación Tecnológica en Salud (IETS)**. Su objetivo principal es resolver la carga operativa y los errores humanos en el registro documental, integrando dos módulos de alto impacto:

1. **Autollenador Inteligente de Documentos (Ingesta Rápida)**: Inyecta una barra flotante con capacidad Drag & Drop en la interfaz de carga institucional (`/admin/upload`). Extrae texto en tiempo real desde archivos PDF en el propio navegador mediante **Mozilla PDF.js**, analiza y estructura los metadatos bibliográficos (título, autores, fecha, resumen, citación oficial, tipo de documento y tecnología evaluada) utilizando heurísticas avanzadas, expresiones regulares especializadas y enriquecimiento semántico mediante **IA (MiniMax LLM API)**, diligenciando automáticamente el formulario React sin intervención manual.
2. **Panel de Saneamiento Masivo y Auditoría Histórica**: Panel de control administrativo embebido en `/admin` que ejecuta planes de normalización y depuración masiva sobre la base de datos institucional en Render (`https://back-repositorioiets.onrender.com`). Consume el manifiesto de parches (`patch_manifest.json`), resuelve automáticamente los tokens de autenticación Bearer de la sesión activa, y ejecuta en lote la marcación de documentos a purgar (`trashCandidates`), la actualización de metadatos (`keepPatches`) y la corrección de inconsistencias históricas acumuladas entre 2011 y 2026.

---

## 🌐 URL del aplicativo

* **Plataforma de Producción (Carga y Subida)**:  
  [https://repositorio.iets.org.co/admin/upload](https://repositorio.iets.org.co/admin/upload)
* **Plataforma de Administración y Auditoría**:  
  [https://repositorio.iets.org.co/admin](https://repositorio.iets.org.co/admin)
* **API Backend Institucional**:  
  `https://back-repositorioiets.onrender.com/api/documents`
* **API de Inteligencia Artificial (Enriquecimiento LLM)**:  
  `https://api.minimax.io/v1/chat/completions`

---

## 📱 Responsive design

Sí. Todos los componentes visuales inyectados en el navegador cuentan con diseño adaptativo y flexible:
* **Barra Flotante de Autollenado**: Diseñada con CSS Flexbox y posicionamiento flotante (`fixed`) en la parte superior derecha de la pantalla. Cuenta con zona interactiva Drag & Drop, botones de acción rápida, selector de archivos y alertas de estado con transiciones suaves. Es compatible con resoluciones estándar de escritorio (1920x1080, 1366x768) y laptops.
* **Panel de Saneamiento Masivo**: Maquetado en una tarjeta lateral colapsable dentro del layout del panel administrativo, con consola de depuración en tiempo real (`<pre>` con scroll vertical y códigos de color semánticos según el estado HTTP o error).

---

## 🔐 Acceso y seguridad

* **Arquitectura Google Chrome Manifest V3**: Cumple estrictamente con las directivas modernas de seguridad de Google Chrome (sin uso de `eval()`, sin inyección de scripts remotos no verificados y con declaración explícita de `content_security_policy`).
* **Autenticación Delegada (Bearer Token)**: La extensión no almacena credenciales institucionales maestras. Lee de forma segura el token JWT emitido por la plataforma tras el inicio de sesión del usuario en `localStorage` o `sessionStorage`, utilizándolo exclusivamente en los encabezados `Authorization: Bearer <token>` de las peticiones REST.
* **Aislamiento de Entorno**: El script de contenido (`content.js`) corre en un contexto aislado (*Isolated World*), interactuando con la página mediante el DOM nativo y el despacho de eventos sintéticos (`input`, `change`, `blur`, `click`).
* **Protección de API Keys**: La clave de acceso a la API de MiniMax se almacena localmente y de forma cifrada en el almacenamiento privado de la extensión (`chrome.storage.local`), permitiendo su actualización o rotación en cualquier momento desde la interfaz.
* **Permisos Restringidos**: En `manifest.json`, únicamente se declaran los permisos esenciales (`storage`) y los orígenes estrictamente necesarios (`repositorio.iets.org.co`, `back-repositorioiets.onrender.com` y `api.minimax.io`).

---

## ✨ Características principales

### 1. Ingesta y Extracción Inteligente de PDFs
* **Lectura en Cliente (Zero-Latency)**: Lectura directa de archivos PDF mediante `pdf.min.js` y `pdf.worker.min.js` sin necesidad de enviar el archivo binario a servidores intermedios de terceros.
* **Heurística Avanzada de Metadatos**:
  * **Título**: Extracción inteligente de la portada y primeras páginas, descartando encabezados institucionales genéricos.
  * **Citación Oficial**: Detección de patrones formales ("Cómo citar este documento:", "Forma de citación sugerida:").
  * **Fechas**: Conversión automática de meses en español y formatos textuales ("Bogotá D.C., Noviembre de 2023") a formato ISO estandarizado (`YYYY-MM-DD`).
  * **Metodología y Tipo de Documento**: Clasificación automática (Evaluación de Tecnologías en Salud, Guía de Práctica Clínica, Informe Técnico, Nota de Política).
* **Filtro Granular de Autores y Cargos**:
  * Algoritmo de reconocimiento de nombres propios de personas que descarta automáticamente cargos administrativos (*Ministro, Viceministro, Director, Asesor, Líder, Revisor par, Epidemiólogo, Cirujano*) e instituciones gubernamentales (*Ministerio de Salud, IETS, Instituto Nacional de Salud*).
* **Enriquecimiento Multimodal con IA**:
  * Fallback automático hacia el modelo **MiniMax M2.5** cuando la portada presenta diagramación compleja, extrayendo autores con sus roles específicos (Autor Principal, Metodólogo, Evaluador Clínico).

### 2. Autocompletado Reactivo en Formularios React
* **Compatibilidad con Virtual DOM**: Emulación precisa de eventos nativos (`setReactVal`, `dispatchEvent`, `addReactTags`) para asegurar que los componentes controlados de React actualicen su estado interno (*state*) y no solo el valor visual del campo de texto.
* **Gestión de Etiquetas y Tags**: Carga secuencial y asíncrona de autores, palabras clave y áreas temáticas.

### 3. Saneamiento y Auditoría Masiva
* **Ejecución de Parches Históricos**: Módulo integrado capaz de procesar cientos de registros históricos con un solo clic.
* **Consola de Auditoría en Tiempo Real**: Visualización línea a línea con timestamp de peticiones HTTP (códigos 200, 403, 404, 500) y avance porcentual.
* **Purga Segura y Documentos Restringidos**: Soporte para actualización de banderas de estado (`isDeleted: true`, `accessLevel: "Restringido"`).

---

## 🛠️ Tecnologías utilizadas

### Frontend y Extensión
* **Manifest V3** – Estándar moderno de extensiones de Google Chrome.
* **JavaScript Vanilla (ES6+)** – Lógica asíncrona modular en `content.js` (2.100+ líneas de lógica especializada).
* **CSS3 Flexbox / Grid** – Estilos flotantes encapsulados para la UI inyectada.
* **HTML5 File API / Drag & Drop** – Captura interactiva de archivos en el navegador.

### Motor de Procesamiento y Lectura
* **Mozilla PDF.js** (`pdf.min.js`, `pdf.worker.min.js`) – Renderizado y extracción de flujos de texto desde binarios PDF.
* **MiniMax LLM API (M2.5)** – Modelo de lenguaje para extracción semántica de entidades complejas en salud.

### Plataformas y Backend Integrados
* **Repositorio IETS Frontend** – Aplicativo SPA en React / Vite.
* **Repositorio IETS Backend** – API REST en Node.js alojada en Render (`onrender.com`).
* **Chrome Storage API** – Almacenamiento local persistente de configuración.

### Scripts de Soporte y Despliegue
* **Windows Batch (`.bat`)** – Automatización de instalación en 1 clic (`Instalar_Extension.bat`).
* **Python 3.12+** – Scripts de verificación, selectores y auditoría (`generador_js.py`, `extractor.py`).

---

## 🚀 Instalación y Despliegue

### Opción 1: Instalación Rápida con Script (Recomendada en Windows)

1. Dirígete a la carpeta de la extensión o del proyecto.
2. Haz doble clic en el archivo **`Instalar_Extension.bat`**.
3. El script abrirá automáticamente Google Chrome en `chrome://extensions` y abrirá la carpeta de la extensión en el Explorador de Windows.
4. En Chrome, activa la casilla **"Modo de desarrollador"** (ubicada en la esquina superior derecha).
5. Haz clic en el botón **"Cargar descomprimida"** (esquina superior izquierda).
6. Selecciona la carpeta **`extension_iets`** abierta por el script.
7. ¡Listo! La extensión quedará activa de forma permanente.

### Opción 2: Instalación Manual en Google Chrome

1. Abre Google Chrome y navega a la URL:
   ```text
   chrome://extensions/
   ```
2. Activa el interruptor **Modo de desarrollador** (*Developer mode*) en la esquina superior derecha.
3. Haz clic en el botón **Cargar descomprimida** (*Load unpacked*).
4. Navega hasta la ruta del proyecto y selecciona la carpeta **`extension_iets`**.
5. Verifica que aparezca la tarjeta:
   * **Nombre**: *Autollenador Repositorio IETS*
   * **Versión**: *3.0*
   * **ID**: (Generado automáticamente por Chrome)

### Opción 3: Modo Marcador Alternativo (Sin Extensión)

Si el navegador tiene políticas que impiden instalar extensiones:
1. Abre el archivo **`instalar_marcador.html`** en Chrome.
2. Arrastra el botón **"Autollenar IETS"** a tu barra de marcadores.
3. Al estar en el formulario de subida, haz clic sobre el marcador para inyectar el script `autollenar.js`.

---

## ⚙️ Configuración

### 1. Variables y Permisos en `manifest.json`

```json
{
  "manifest_version": 3,
  "name": "Autollenador Repositorio IETS",
  "version": "3.0",
  "description": "Saneamiento Masivo y Autollenado inteligente para el Repositorio IETS (2011-2026)",
  "icons": {
    "48": "icon.png"
  },
  "permissions": [
    "storage"
  ],
  "host_permissions": [
    "https://repositorio.iets.org.co/*",
    "https://back-repositorioiets.onrender.com/*",
    "https://api.minimax.io/*"
  ],
  "content_scripts": [
    {
      "matches": [
        "https://repositorio.iets.org.co/*"
      ],
      "js": [
        "pdf.min.js",
        "content.js"
      ],
      "run_at": "document_idle"
    }
  ],
  "web_accessible_resources": [
    {
      "resources": [
        "pdf.worker.js",
        "pdf.worker.min.js",
        "icon.png",
        "patch_manifest.json"
      ],
      "matches": [
        "https://repositorio.iets.org.co/*"
      ]
    }
  ]
}
```

### 2. Configuración de API Key para MiniMax (Opcional / Mejoras IA)

Por defecto, la extensión cuenta con heurísticas locales que extraen los campos sin costo ni consumo de API. Para activar el enriquecimiento semántico avanzado con MiniMax:
* Abre la consola de desarrollador en la pestaña del repositorio (`F12`).
* Ejecuta:
  ```javascript
  chrome.storage.local.set({ "iets_minimax_api_key": "TU_API_KEY_DE_MINIMAX" }, () => {
    console.log("Clave de MiniMax configurada exitosamente.");
  });
  ```

---

## 📁 Estructura del proyecto

```
extension_iets/
│
├── manifest.json              # 📄 Configuración de la extensión Chrome (Manifest V3)
├── content.js                 # 🧠 Núcleo de autollenado, extracción PDF, lógica IA y panel de auditoría
├── icon.png                   # 🖼️ Ícono representativo de la extensión (48x48)
│
├── pdf.min.js                 # 📚 Librería Mozilla PDF.js compilada para cliente
├── pdf.worker.js              # ⚙️ Web Worker para extracción de texto en hilo secundario
├── pdf.worker.min.js          # ⚙️ Versión minificada del Web Worker de PDF.js
│
├── patch_manifest.json        # 🗃️ Manifiesto de parches y auditoría histórica (103 purgas, 258 activos)
├── Instalar_Extension.bat     # 🖱️ Instalador automático de 1 clic para Windows
├── instalar_marcador.html     # 🔖 Alternativa de instalación por Bookmarklet web
├── selectores_iets.json       # 🎯 Diccionario de selectores DOM y mapeo de campos React
├── flujograma.html            # 🗺️ Diagrama de flujo visual interactivo del proceso
└── README.md                  # 📖 Documentación técnica oficial del proyecto
```

---

## 📁 Estructura de almacenamiento

| Recurso | Tipo | Ubicación / Destino |
|:---|:---|:---|
| **Configuración de Usuario** | Almacenamiento local | `chrome.storage.local` (clave `iets_minimax_api_key`) |
| **Sesión y Autenticación** | Tokens JWT de sesión | `localStorage` / `sessionStorage` (`token`, `auth_token`, `jwt`) |
| **Worker y Recursos Web** | Web Accessible Resources | Empaquetados en la extensión vía `chrome.runtime.getURL` |
| **Manifiesto de Saneamiento** | JSON Estructurado | `patch_manifest.json` cargado asíncronamente en memoria |
| **Documentos Procesados** | Binarios PDF | Memoria RAM temporal durante la lectura (no se guardan en disco) |

---

## 👥 Roles y funcionalidades

### 👤 Catalogador / Revisor Documental (Ingesta de Documentos)
1. Inicia sesión normalmente con su cuenta autorizada en el Repositorio IETS.
2. Ingresa a la sección de carga de documentos: `https://repositorio.iets.org.co/admin/upload`.
3. Observará en la esquina superior la **barra de autollenado inteligente** inyectada por la extensión.
4. **Arrastra el archivo PDF** de la evaluación o informe técnico sobre la zona delimitada (o usa el botón de selección).
5. En menos de dos segundos, la extensión:
   * Extrae el texto completo del PDF.
   * Identifica el título formal y la citación sugerida.
   * Filtra los autores humanos reales y excluye cargos o ministerios.
   * Normaliza la fecha a formato estándar.
   * Selecciona el tipo de documento y el área temática.
   * Despacha los eventos al formulario de React.
6. El catalogador revisa visualmente los campos prellenados y presiona el botón institucional de guardado.

### 🛡️ Administrador / Auditor Técnico (Saneamiento Masivo)
1. Inicia sesión con credenciales de Administrador en `https://repositorio.iets.org.co/admin`.
2. En la vista administrativa, la extensión despliega la tarjeta del **Panel de Saneamiento Masivo**.
3. El administrador revisa el resumen del parche cargado desde `patch_manifest.json`:
   * Cantidad de candidatos a purga/eliminación lógica (`trashCandidates`).
   * Cantidad de documentos validados para conservación (`keepPatches`).
   * Configuración de taxonomías y estados de acceso.
4. Hace clic en **"Iniciar Saneamiento Masivo"**.
5. Observa en la consola en tiempo real el progreso de cada petición PUT/PATCH enviada al backend en Render:
   * Códigos `200 OK` para documentos actualizados.
   * Verificación de acceso restringido para documentos con error o enlace roto.
6. Al finalizar, el sistema emite el reporte consolidado de éxito.

---

> **Proyecto Institucional – Instituto de Evaluación Tecnológica en Salud (IETS)**  
> Desarrollado en el marco del programa **Tecnólogo en Análisis y Desarrollo de Software (ADSO)**  
> Servicio Nacional de Aprendizaje – SENA | Centro de Diseño y Metrología (CDM)
