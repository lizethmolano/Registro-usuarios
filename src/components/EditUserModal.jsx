import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";

function EditUserForm({ usuario, onClose, onUsuarioActualizado }) {
  const [nombre, setNombre] = useState(usuario?.nombre || "");
  const [apellido, setApellido] = useState(usuario?.apellido || "");
  const [tipoDocumento, setTipoDocumento] = useState(usuario?.tipoDocumento || "CC");
  const [numeroIdentificacion, setNumeroIdentificacion] = useState(usuario?.numeroIdentificacion || "");
  const [fechaNacimiento, setFechaNacimiento] = useState(usuario?.fechaNacimiento || "");
  const [correo, setCorreo] = useState(usuario?.correo || "");
  const [estado, setEstado] = useState(usuario?.estado || "activo");

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const handleGuardar = async (e) => {
    e.preventDefault();
    setError("");

    if (!nombre.trim() || !apellido.trim() || !numeroIdentificacion.trim() || !correo.trim()) {
      setError("Por favor completa los campos obligatorios.");
      return;
    }

    setGuardando(true);
    try {
      const docId = usuario.id || usuario.uid;
      const refDoc = doc(db, "usuarios", docId);

      const datosActualizados = {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        tipoDocumento,
        numeroIdentificacion: numeroIdentificacion.trim(),
        fechaNacimiento,
        correo: correo.trim().toLowerCase(),
        estado,
        fechaActualizacion: new Date(),
      };

      await updateDoc(refDoc, datosActualizados);

      onUsuarioActualizado({
        ...usuario,
        ...datosActualizados,
      });

      onClose();
    } catch (err) {
      console.error("Error al actualizar usuario:", err);
      setError("No se pudo actualizar el registro: " + (err.message || ""));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      className="modal-content modal-edit"
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-header">
        <div className="modal-title-wrap">
          <span className="modal-icon">✏️</span>
          <div>
            <h3 className="modal-title">Editar Información de Usuario</h3>
            <p className="modal-subtitle">
              Modifica los datos del registro en el sistema IETS.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Cerrar modal"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleGuardar} className="modal-form">
        {error && <div className="message message-error">{error}</div>}

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="edit-nombre">
              Nombre <span className="required">*</span>
            </label>
            <input
              id="edit-nombre"
              type="text"
              className="form-input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-apellido">
              Apellido <span className="required">*</span>
            </label>
            <input
              id="edit-apellido"
              type="text"
              className="form-input"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-tipoDoc">
              Tipo de Documento <span className="required">*</span>
            </label>
            <select
              id="edit-tipoDoc"
              className="form-select"
              value={tipoDocumento}
              onChange={(e) => setTipoDocumento(e.target.value)}
            >
              <option value="CC">Cédula de Ciudadanía</option>
              <option value="TI">Tarjeta de Identidad</option>
              <option value="CE">Cédula de Extranjería</option>
              <option value="PAS">Pasaporte</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-numDoc">
              Número de Identificación <span className="required">*</span>
            </label>
            <input
              id="edit-numDoc"
              type="text"
              className="form-input"
              value={numeroIdentificacion}
              onChange={(e) => setNumeroIdentificacion(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-nacimiento">
              Fecha de Nacimiento
            </label>
            <input
              id="edit-nacimiento"
              type="date"
              className="form-input"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-correo">
              Correo Electrónico <span className="required">*</span>
            </label>
            <input
              id="edit-correo"
              type="email"
              className="form-input"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
          </div>

          <div className="form-group form-group-full">
            <label className="form-label" htmlFor="edit-estado">
              Estado del Registro
            </label>
            <select
              id="edit-estado"
              className="form-select"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            >
              <option value="activo">Activo (Aprobado)</option>
              <option value="en_revision">En Revisión</option>
              <option value="inactivo">Inactivo / Bloqueado</option>
            </select>
          </div>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={onClose}
            disabled={guardando}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="button button-primary"
            disabled={guardando}
          >
            {guardando ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function EditUserModal({ isOpen, onClose, usuario, onUsuarioActualizado }) {
  if (!isOpen || !usuario) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <EditUserForm
        key={usuario.id || usuario.uid}
        usuario={usuario}
        onClose={onClose}
        onUsuarioActualizado={onUsuarioActualizado}
      />
    </div>
  );
}
