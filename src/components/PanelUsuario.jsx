
export default function PanelUsuario({
    usuario,
    onCerrarSesion,
}) {
    return (
        <main className="page-main">
            <section className="page-intro">
                <p className="page-kicker">PANEL DE USUARIO</p>

                <h1 className="page-title">
                    Bienvenido
                </h1>

                <p className="page-description">
                    Has iniciado sesión correctamente en el sistema.
                </p>
            </section>

            <section className="form-card">
                <div className="form-section">
                    <div className="section-heading">
                        <span className="section-number">01</span>

                        <div>
                            <h2 className="section-title">
                                Información de la cuenta
                            </h2>

                            <p className="section-desc">
                                Información asociada a tu cuenta.
                            </p>
                        </div>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">
                                Correo electrónico
                            </label>

                            <input
                                className="form-input"
                                value={usuario?.email || ""}
                                readOnly
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                Rol
                            </label>

                            <input
                                className="form-input"
                                value="Usuario"
                                readOnly
                            />
                        </div>
                    </div>
                </div>

                <div className="message message-success">
                    Tu cuenta no tiene permisos para acceder al panel
                    administrativo, editar registros ni eliminar usuarios.
                </div>

                <div className="form-actions">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onCerrarSesion}
                    >
                        Cerrar sesión
                    </button>
                </div>
            </section>
        </main>
    );
}