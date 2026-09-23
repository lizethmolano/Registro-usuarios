import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, isApiKeyPlaceholder } from "../firebase/config";

// ======================================================
// CONVERTIR Y COMPRIMIR ARCHIVO A BASE64
// ======================================================
const convertirArchivoABase64 = (file) => {
  return new Promise((resolve, reject) => {
    // Si es una imagen, intentamos optimizarla para no superar el límite de 1MB de Firestore
    if (file.type.startsWith("image/")) {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target.result;
      };

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Escalar manteniendo proporción si es muy grande
        const maxDimension = 1200;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a JPEG comprimido
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        resolve(dataUrl);
      };

      img.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    } else {
      // Para PDF u otros formatos se lee directamente
      const lector = new FileReader();
      lector.readAsDataURL(file);
      lector.onload = () => resolve(lector.result);
      lector.onerror = (error) => reject(error);
    }
  });
};

export default function RegistroForm({ onIrALogin }) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("");
  const [numeroIdentificacion, setNumeroIdentificacion] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  // ======================================================
  // VALIDACIONES
  // ======================================================

  const validarNombre = (valor) => {
    return /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/.test(valor);
  };

  const validarCorreo = (valor) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
  };

  const calcularEdad = (fecha) => {
    const hoy = new Date();
    const nacimiento = new Date(fecha);

    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (
      mes < 0 ||
      (mes === 0 && hoy.getDate() < nacimiento.getDate())
    ) {
      edad--;
    }

    return edad;
  };

  const validarFechaDocumento = () => {
    if (!fechaNacimiento) {
      return "La fecha de nacimiento es obligatoria.";
    }

    const fecha = new Date(fechaNacimiento);
    const hoy = new Date();

    if (fecha > hoy) {
      return "La fecha de nacimiento no puede ser futura.";
    }

    const edad = calcularEdad(fechaNacimiento);

    if (tipoDocumento === "CC" && edad < 18) {
      return "Para cédula de ciudadanía debes tener 18 años o más.";
    }

    if (tipoDocumento === "TI" && (edad < 7 || edad >= 18)) {
      return "Para tarjeta de identidad debes tener entre 7 y 17 años.";
    }

    return "";
  };

  // ======================================================
  // VALIDAR ARCHIVO (LÍMITE RESTABLECIDO A 5 MB)
  // ======================================================

  const validarArchivo = (file) => {
    if (!file) {
      return "Debes seleccionar un documento.";
    }

    const tiposPermitidos = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];

    if (!tiposPermitidos.includes(file.type)) {
      return "El archivo debe ser en formato PDF, JPG o PNG.";
    }

    // Regla original de 5 MB
    const maximoBytes = 5 * 1024 * 1024;

    if (file.size > maximoBytes) {
      return "El tamaño del archivo no puede superar los 5 MB.";
    }

    return "";
  };

  // ======================================================
  // SELECCIONAR ARCHIVO
  // ======================================================

  const handleArchivo = (e) => {
    const file = e.target.files[0];

    setError("");
    setMensaje("");

    if (!file) {
      setArchivo(null);
      return;
    }

    const errorArchivo = validarArchivo(file);

    if (errorArchivo) {
      setArchivo(null);
      setError(errorArchivo);
      e.target.value = "";
      return;
    }

    setArchivo(file);
  };

  // ======================================================
  // LIMPIAR FORMULARIO
  // ======================================================

  const limpiarFormulario = () => {
    setNombre("");
    setApellido("");
    setTipoDocumento("");
    setNumeroIdentificacion("");
    setFechaNacimiento("");
    setCorreo("");
    setPassword("");
    setConfirmarPassword("");
    setArchivo(null);
    setAceptaTerminos(false);

    const inputArchivo = document.getElementById("archivo");
    if (inputArchivo) {
      inputArchivo.value = "";
    }
  };

  // ======================================================
  // REGISTRO
  // ======================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMensaje("");

    if (!nombre.trim() || !validarNombre(nombre.trim())) {
      setError("Ingresa un nombre válido (solo letras).");
      return;
    }

    if (!apellido.trim() || !validarNombre(apellido.trim())) {
      setError("Ingresa un apellido válido (solo letras).");
      return;
    }

    if (!tipoDocumento) {
      setError("Debes seleccionar el tipo de documento.");
      return;
    }

    if (!numeroIdentificacion.trim()) {
      setError("El número de identificación es obligatorio.");
      return;
    }

    if (tipoDocumento === "CC" || tipoDocumento === "TI") {
      if (!/^\d+$/.test(numeroIdentificacion.trim())) {
        setError("El número de identificación debe contener únicamente dígitos.");
        return;
      }
    }

    const errorFecha = validarFechaDocumento();
    if (errorFecha) {
      setError(errorFecha);
      return;
    }

    if (!correo.trim() || !validarCorreo(correo.trim())) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }

    if (!password || password.length < 6) {
      setError("La contraseña debe tener mínimo 6 caracteres.");
      return;
    }

    if (!confirmarPassword) {
      setError("Debes confirmar tu contraseña.");
      return;
    }

    if (password !== confirmarPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    const errorArchivo = validarArchivo(archivo);
    if (errorArchivo) {
      setError(errorArchivo);
      return;
    }

    if (!aceptaTerminos) {
      setError("Debes aceptar los términos y condiciones para continuar.");
      return;
    }

    if (isApiKeyPlaceholder) {
      setError("Configuración de Firebase pendiente en .env.local.");
      return;
    }

    setCargando(true);
    let usuarioCreado = null;

    try {
      // 1. Crear usuario en Firebase Auth
      const resultado = await createUserWithEmailAndPassword(
        auth,
        correo.trim(),
        password
      );

      usuarioCreado = resultado.user;

      // 2. Enviar email de verificación
      try {
        await sendEmailVerification(usuarioCreado);
      } catch (emailErr) {
        console.warn("No se pudo enviar email de verificación:", emailErr);
      }

      // 3. Convertir a Base64
      const documentoBase64 = await convertirArchivoABase64(archivo);

      // Verificar que el string final quepa en el límite de 1MB de Firestore
      if (documentoBase64.length > 1048576) {
        throw new Error(
          "El archivo convertido supera el límite de peso permitido por la base de datos (1 MB máximo por registro)."
        );
      }

      // 4. Guardar datos en Firestore
      await setDoc(doc(db, "usuarios", usuarioCreado.uid), {
        uid: usuarioCreado.uid,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        tipoDocumento,
        numeroIdentificacion: numeroIdentificacion.trim(),
        fechaNacimiento,
        correo: correo.trim().toLowerCase(),
        nombreArchivo: archivo.name,
        tipoArchivo: archivo.type,
        tamanoArchivo: archivo.size,
        documentoBase64,
        fechaRegistro: serverTimestamp(),
        estado: "activo",
        correoVerificado: false,
      });

      setMensaje("¡Registro completado con éxito! Se ha enviado un correo de confirmación.");
      limpiarFormulario();
    } catch (err) {
      console.error("Error durante el registro:", err);

      if (usuarioCreado) {
        try {
          await usuarioCreado.delete();
        } catch (delErr) {
          console.error("Error en rollback de usuario:", delErr);
        }
      }

      const code = err.code || "";
      const rawMessage = err.message || "";

      if (code === "auth/email-already-in-use") {
        setError("Este correo electrónico ya está registrado.");
      } else if (code === "permission-denied") {
        setError("Permiso denegado en Cloud Firestore. Revisa las reglas de seguridad.");
      } else {
        setError(rawMessage ? `Error: ${rawMessage.replace(/^Firebase:\s*/i, "")}` : "Ocurrió un error inesperado.");
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="page-main">
      <section className="page-intro">
        <p className="page-kicker">FORMULARIO DE REGISTRO INSTITUCIONAL</p>
        <h1 className="page-title">Crea tu Cuenta de Usuario</h1>
        <p className="page-description">
          Diligencia la siguiente información para solicitar tu registro en el sistema del Instituto de Evaluación Tecnológica en Salud (IETS).
        </p>
      </section>

      <form className="form-card" onSubmit={handleSubmit}>
        {/* SECCIÓN 01: DATOS PERSONALES */}
        <section className="form-section">
          <div className="section-heading">
            <span className="section-number">01</span>
            <div>
              <h2 className="section-title">Datos Personales</h2>
              <p className="section-desc">Información básica de identificación del solicitante.</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="nombre">
                Nombre <span className="required">*</span>
              </label>
              <input
                id="nombre"
                type="text"
                className="form-input"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ingresa tus nombres"
                autoComplete="given-name"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="apellido">
                Apellido <span className="required">*</span>
              </label>
              <input
                id="apellido"
                type="text"
                className="form-input"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                placeholder="Ingresa tus apellidos"
                autoComplete="family-name"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="tipoDocumento">
                Tipo de Documento <span className="required">*</span>
              </label>
              <select
                id="tipoDocumento"
                className="form-select"
                value={tipoDocumento}
                onChange={(e) => setTipoDocumento(e.target.value)}
              >
                <option value="">Selecciona una opción</option>
                <option value="CC">Cédula de Ciudadanía (CC)</option>
                <option value="TI">Tarjeta de Identidad (TI)</option>
                <option value="CE">Cédula de Extranjería (CE)</option>
                <option value="PAS">Pasaporte (PAS)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="numeroIdentificacion">
                Número de Identificación <span className="required">*</span>
              </label>
              <input
                id="numeroIdentificacion"
                type="text"
                className="form-input"
                value={numeroIdentificacion}
                onChange={(e) => setNumeroIdentificacion(e.target.value)}
                placeholder="Ej. 1020304050"
                autoComplete="off"
              />
            </div>

            <div className="form-group form-group-full">
              <label className="form-label" htmlFor="fechaNacimiento">
                Fecha de Nacimiento <span className="required">*</span>
              </label>
              <input
                id="fechaNacimiento"
                type="date"
                className="form-input"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                autoComplete="bday"
              />
              <small className="field-help">
                La fecha debe coincidir con la de tu documento de identidad (mayores de 18 años para CC).
              </small>
            </div>
          </div>
        </section>

        {/* SECCIÓN 02: DATOS DE ACCESO */}
        <section className="form-section">
          <div className="section-heading">
            <span className="section-number">02</span>
            <div>
              <h2 className="section-title">Datos de Acceso</h2>
              <p className="section-desc">Credenciales que utilizarás para identificarte en el sistema.</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group form-group-full">
              <label className="form-label" htmlFor="correo">
                Correo Electrónico <span className="required">*</span>
              </label>
              <input
                id="correo"
                type="email"
                className="form-input"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="ejemplo@correo.com"
                autoComplete="email"
              />
              <small className="field-help">
                A este correo enviaremos el enlace de confirmación y las notificaciones del IETS.
              </small>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Contraseña <span className="required">*</span>
              </label>
              <input
                id="password"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmarPassword">
                Confirmar Contraseña <span className="required">*</span>
              </label>
              <input
                id="confirmarPassword"
                type="password"
                className="form-input"
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                autoComplete="new-password"
              />
            </div>
          </div>
        </section>

        {/* SECCIÓN 03: DOCUMENTO */}
        <section className="form-section">
          <div className="section-heading">
            <span className="section-number">03</span>
            <div>
              <h2 className="section-title">Documento de Identificación</h2>
              <p className="section-desc">Adjunta una copia digitalizada y legible de tu documento.</p>
            </div>
          </div>

          <div className="file-box">
            <div className="file-row">
              <div className="file-meta">
                <label className="form-label" htmlFor="archivo">
                  Documento <span className="required">*</span>
                </label>
                <p className="file-help">
                  Formatos permitidos: <strong>PDF, JPG, PNG</strong>. Tamaño máximo: <strong>5 MB</strong>.
                </p>
              </div>

              <input
                id="archivo"
                type="file"
                className="file-input"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={handleArchivo}
              />
            </div>

            {archivo && (
              <div className="file-selected-badge">
                <span className="file-name">
                  Archivo seleccionado: <strong>{archivo.name}</strong> ({(archivo.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
              </div>
            )}
          </div>
        </section>

        {/* TÉRMINOS Y CONDICIONES */}
        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={aceptaTerminos}
              onChange={(e) => setAceptaTerminos(e.target.checked)}
            />
            Acepto los términos y condiciones del sistema para continuar.
          </label>
        </div>

        {/* ALERTAS */}
        {error && <div className="alert alert-error">{error}</div>}
        {mensaje && <div className="alert alert-success">{mensaje}</div>}

        {/* BOTONES DE ACCIÓN */}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={cargando}>
            {cargando ? "Procesando registro..." : "Registrarme"}
          </button>

          {onIrALogin && (
            <button type="button" className="btn btn-secondary" onClick={onIrALogin}>
              ¿Ya tienes cuenta? Inicia sesión
            </button>
          )}
        </div>
      </form>
    </main>
  );
}