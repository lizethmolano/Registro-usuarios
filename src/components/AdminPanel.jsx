import { useState, useEffect } from "react";
import { collection, onSnapshot, doc, deleteDoc, query, orderBy } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "../firebase/config";
import EditUserModal from "./EditUserModal";

export default function AdminPanel({ onIrARegistro }) {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipoDoc, setFiltroTipoDoc] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const [usuarioAEditar, setUsuarioAEditar] = useState(null);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);

  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // Escuchar usuarios en tiempo real desde Firestore
  useEffect(() => {
    const q = query(collection(db, "usuarios"), orderBy("fechaRegistro", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const lista = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setUsuarios(lista);
        setCargando(false);
      },
      (err) => {
        console.warn("Consulta con ordenamiento no disponible, usando fallback:", err);
        // Fallback sin ordenar por fecha si las reglas o índices lo requieren
        const fallbackUnsub = onSnapshot(
          collection(db, "usuarios"),
          (snapshot) => {
            const lista = snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            }));
            setUsuarios(lista);
            setCargando(false);
          },
          (err2) => {
            console.error("Error en fallback:", err2);
            setError("No se pudieron cargar los registros de Firestore. Revisa las reglas de seguridad.");
            setCargando(false);
          }
        );
        return () => fallbackUnsub();
      }
    );

    return () => unsubscribe();
  }, []);

  // Filtrar lista en cliente
  const usuariosFiltrados = usuarios.filter((u) => {
    const termino = busqueda.toLowerCase().trim();
    const coincideBusqueda =
      !termino ||
      (u.nombre && u.nombre.toLowerCase().includes(termino)) ||
      (u.apellido && u.apellido.toLowerCase().includes(termino)) ||
      (u.correo && u.correo.toLowerCase().includes(termino)) ||
      (u.numeroIdentificacion && u.numeroIdentificacion.includes(termino));

    const coincideTipo = !filtroTipoDoc || u.tipoDocumento === filtroTipoDoc;
    const coincideEstado = !filtroEstado || (u.estado || "activo") === filtroEstado;

    return coincideBusqueda && coincideTipo && coincideEstado;
  });

  // Manejador de Edición
  const abrirEditar = (u) => {
    setUsuarioAEditar(u);
    setModalEditarAbierto(true);
  };

  const handleUsuarioActualizado = (usuarioActualizado) => {
    setUsuarios((prev) =>
      prev.map((u) => (u.id === usuarioActualizado.id ? usuarioActualizado : u))
    );
  };

  // Manejador de Eliminación
  const confirmarEliminar = (u) => {
    setUsuarioAEliminar(u);
  };

  const ejecutarEliminacion = async () => {
    if (!usuarioAEliminar) return;
    setEliminando(true);

    try {
      const docId = usuarioAEliminar.id || usuarioAEliminar.uid;
      // 1. Eliminar documento de Firestore
      await deleteDoc(doc(db, "usuarios", docId));

      // 2. Intentar eliminar archivo de Storage si existe la ruta
      if (usuarioAEliminar.rutaDocumento) {
        try {
          const fileRef = ref(storage, usuarioAEliminar.rutaDocumento);
          await deleteObject(fileRef);
        } catch (storageErr) {
          console.warn("No se pudo eliminar el archivo de Storage (puede que ya no exista):", storageErr);
        }
      }

      setUsuarioAEliminar(null);
    } catch (err) {
      console.error("Error al eliminar registro:", err);
      alert("Error al eliminar el registro: " + (err.message || ""));
    } finally {
      setEliminando(false);
    }
  };

  // Exportar a CSV
  const exportarCSV = () => {
    if (!usuariosFiltrados.length) return;
    const encabezados = [
      "ID",
      "Tipo Documento",
      "Número Identificación",
      "Nombre",
      "Apellido",
      "Correo",
      "Fecha Nacimiento",
      "Estado",
      "URL Documento",
    ];

    const filas = usuariosFiltrados.map((u) => [
      `"${u.id || ""}"`,
      `"${u.tipoDocumento || ""}"`,
      `"${u.numeroIdentificacion || ""}"`,
      `"${u.nombre || ""}"`,
      `"${u.apellido || ""}"`,
      `"${u.correo || ""}"`,
      `"${u.fechaNacimiento || ""}"`,
      `"${u.estado || "activo"}"`,
      `"${u.urlDocumento || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [encabezados.join(";"), ...filas.map((e) => e.join(";"))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `usuarios_iets_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="admin-panel">
      {/* Barra de cabecera del panel */}
      <div className="admin-header">
        <div>
          <span className="page-kicker">PANEL DE ADMINISTRACIÓN</span>
          <h1 className="admin-title">Gestión de Registros de Usuarios</h1>
          <p className="admin-subtitle">
            Consulta, edición y control de usuarios registrados en el sistema del IETS.
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={exportarCSV}
            disabled={!usuariosFiltrados.length}
            title="Exportar registros filtrados a CSV"
          >
            📥 Exportar CSV
          </button>
          <button
            type="button"
            className="button button-primary"
            onClick={onIrARegistro}
          >
            + Nuevo Registro
          </button>
        </div>
      </div>

      {/* Tarjetas de métricas rápidas */}
      <div className="admin-stats-grid">
        <div className="stat-card">
          <div className="stat-value">{usuarios.length}</div>
          <div className="stat-label">Total Usuarios Registrados</div>
        </div>
        <div className="stat-card">
          <div className="stat-value stat-value-success">
            {usuarios.filter((u) => (u.estado || "activo") === "activo").length}
          </div>
          <div className="stat-label">Usuarios Activos</div>
        </div>
        <div className="stat-card">
          <div className="stat-value stat-value-warning">
            {usuarios.filter((u) => u.estado === "en_revision").length}
          </div>
          <div className="stat-label">En Revisión</div>
        </div>
        <div className="stat-card">
          <div className="stat-value stat-value-info">
            {usuarios.filter((u) => u.urlDocumento).length}
          </div>
          <div className="stat-label">Documentos Adjuntos</div>
        </div>
      </div>

      {/* Barra de filtros y búsqueda */}
      <div className="admin-filters-card">
        <div className="filters-grid">
          <div className="filter-item filter-search">
            <label className="form-label" htmlFor="admin-search">
              Buscar Usuario
            </label>
            <input
              id="admin-search"
              type="text"
              className="form-input"
              placeholder="Buscar por nombre, documento o correo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="filter-item">
            <label className="form-label" htmlFor="admin-filter-tipo">
              Tipo de Documento
            </label>
            <select
              id="admin-filter-tipo"
              className="form-select"
              value={filtroTipoDoc}
              onChange={(e) => setFiltroTipoDoc(e.target.value)}
            >
              <option value="">Todos los tipos</option>
              <option value="CC">Cédula de Ciudadanía (CC)</option>
              <option value="TI">Tarjeta de Identidad (TI)</option>
              <option value="CE">Cédula de Extranjería (CE)</option>
              <option value="PAS">Pasaporte</option>
            </select>
          </div>

          <div className="filter-item">
            <label className="form-label" htmlFor="admin-filter-estado">
              Estado
            </label>
            <select
              id="admin-filter-estado"
              className="form-select"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="en_revision">En Revisión</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>

          {(busqueda || filtroTipoDoc || filtroEstado) && (
            <div className="filter-item filter-clear-wrap">
              <button
                type="button"
                className="btn-clear-filters"
                onClick={() => {
                  setBusqueda("");
                  setFiltroTipoDoc("");
                  setFiltroEstado("");
                }}
              >
                Limpiar Filtros ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mensaje de error general si ocurre */}
      {error && <div className="message message-error">{error}</div>}

      {/* Tabla de registros (CRUD: Read) */}
      <div className="admin-table-card">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Documento</th>
                <th>Nombre Completo</th>
                <th>Correo Electrónico</th>
                <th>Fecha Nacimiento</th>
                <th>Soporte Adjunto</th>
                <th>Estado</th>
                <th className="th-actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan="7" className="td-loading">
                    <div className="table-loading-spinner" />
                    <span>Cargando registros desde Firestore...</span>
                  </td>
                </tr>
              ) : usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" className="td-empty">
                    <div className="empty-icon">📂</div>
                    <div className="empty-title">
                      {usuarios.length === 0
                        ? "No hay usuarios registrados aún"
                        : "No se encontraron usuarios con esos filtros"}
                    </div>
                    <p className="empty-description">
                      {usuarios.length === 0
                        ? "Los usuarios que se registren a través del formulario público aparecerán aquí automáticamente en tiempo real."
                        : "Intenta ajustar o limpiar los filtros de búsqueda."}
                    </p>
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((u) => {
                  const estadoActual = u.estado || "activo";
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="doc-badge-group">
                          <span className="doc-type-pill">{u.tipoDocumento || "CC"}</span>
                          <span className="doc-num">{u.numeroIdentificacion || "N/A"}</span>
                        </div>
                      </td>
                      <td>
                        <div className="user-name-cell">
                          <strong>{u.nombre} {u.apellido}</strong>
                        </div>
                      </td>
                      <td>
                        <a href={`mailto:${u.correo}`} className="table-email-link">
                          {u.correo}
                        </a>
                      </td>
                      <td>{u.fechaNacimiento || "No registrada"}</td>
                      <td>
                        {u.urlDocumento ? (
                          <a
                            href={u.urlDocumento}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-view-doc"
                            title="Abrir o descargar archivo adjunto"
                          >
                            📄 Ver Archivo
                          </a>
                        ) : (
                          <span className="no-file-text">Sin archivo</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge status-${estadoActual}`}>
                          {estadoActual === "activo"
                            ? "Activo"
                            : estadoActual === "en_revision"
                            ? "En Revisión"
                            : "Inactivo"}
                        </span>
                      </td>
                      <td className="td-actions">
                        <button
                          type="button"
                          className="btn-action btn-edit"
                          onClick={() => abrirEditar(u)}
                          title="Editar usuario"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          type="button"
                          className="btn-action btn-delete"
                          onClick={() => confirmarEliminar(u)}
                          title="Eliminar usuario"
                        >
                          🗑️ Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>
            Mostrando <strong>{usuariosFiltrados.length}</strong> de{" "}
            <strong>{usuarios.length}</strong> registros totales
          </span>
        </div>
      </div>

      {/* Modal para Editar Usuario (CRUD: Update) */}
      <EditUserModal
        isOpen={modalEditarAbierto}
        onClose={() => setModalEditarAbierto(false)}
        usuario={usuarioAEditar}
        onUsuarioActualizado={handleUsuarioActualizado}
      />

      {/* Modal de confirmación para Eliminar Usuario (CRUD: Delete) */}
      {usuarioAEliminar && (
        <div className="modal-backdrop" onClick={() => setUsuarioAEliminar(null)}>
          <div
            className="modal-content modal-confirm"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div className="modal-title-wrap">
                <span className="modal-icon modal-icon-danger">⚠️</span>
                <div>
                  <h3 className="modal-title">¿Eliminar registro de usuario?</h3>
                  <p className="modal-subtitle">
                    Esta acción dará de baja el registro de la base de datos de manera irreversible.
                  </p>
                </div>
              </div>
            </div>

            <div className="confirm-details">
              <p>
                Estás a punto de eliminar a:{" "}
                <strong>
                  {usuarioAEliminar.nombre} {usuarioAEliminar.apellido}
                </strong>
              </p>
              <p>
                Documento: <strong>{usuarioAEliminar.tipoDocumento} {usuarioAEliminar.numeroIdentificacion}</strong>
              </p>
              <p>
                Correo: <strong>{usuarioAEliminar.correo}</strong>
              </p>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setUsuarioAEliminar(null)}
                disabled={eliminando}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="button button-danger"
                onClick={ejecutarEliminacion}
                disabled={eliminando}
              >
                {eliminando ? "Eliminando..." : "Sí, Eliminar Registro"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
