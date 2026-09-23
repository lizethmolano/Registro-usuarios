import React from "react";

export default function Header({
  vistaActual,
  setVistaActual,
  usuarioAutenticado,
  onAbrirLogin,
  onCerrarSesion,
}) {
  return (
    <header className="header-institucional">
      <div className="header-top-bar">
        <div className="header-container">
          <div className="gov-bar-text">
            República de Colombia | Instituto de Evaluación Tecnológica en Salud - IETS
          </div>
          <a
            href="https://iets.org.co"
            target="_blank"
            rel="noopener noreferrer"
            className="portal-link"
          >
            Ir a iets.org.co ↗
          </a>
        </div>
      </div>

      <div className="header-main">
        <div className="header-container header-main-content">
          <div className="logos-group">
            <img
              src="/logo-minsalud.jpg"
              alt="Logo Ministerio de Salud y Protección Social"
              className="logo-img logo-minsalud"
            />
            <div className="logo-divider" />
            <img
              src="/logo-iets.png"
              alt="Logo Instituto de Evaluación Tecnológica en Salud"
              className="logo-img logo-iets"
            />
            <div className="brand-titles">
              <span className="brand-main-title">
                Instituto de Evaluación Tecnológica en Salud
              </span>
              <span className="brand-sub-title">
                Sistema Oficial de Registro y Gestión de Usuarios
              </span>
            </div>
          </div>

          <nav className="header-nav">
            <button
              type="button"
              className={`nav-tab ${vistaActual === "registro" ? "nav-tab-active" : ""}`}
              onClick={() => setVistaActual("registro")}
            >
              Registro
            </button>

            <button
              type="button"
              className={`nav-tab ${vistaActual === "admin" ? "nav-tab-active" : ""}`}
              onClick={() => {
                if (usuarioAutenticado) {
                  setVistaActual("admin");
                } else {
                  onAbrirLogin();
                }
              }}
            >
              Panel Administrador
            </button>

            {usuarioAutenticado ? (
              <div className="auth-user-menu">
                <span className="user-badge" title={usuarioAutenticado.email}>
                  👤 {usuarioAutenticado.email.split("@")[0]}
                </span>
                <button
                  type="button"
                  className="btn-header-auth btn-logout"
                  onClick={onCerrarSesion}
                >
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn-header-auth btn-login"
                onClick={onAbrirLogin}
              >
                Iniciar Sesión
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
