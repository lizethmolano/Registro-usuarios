import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config";

export default function LoginModal({ isOpen, onClose, onLoginExitoso }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Por favor completa todos los campos de acceso.");
      return;
    }

    setCargando(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      onLoginExitoso(userCredential.user);
      onClose();
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      const code = err.code || "";
      if (
        code === "auth/invalid-credential" ||
        code === "auth/user-not-found" ||
        code === "auth/wrong-password"
      ) {
        setError("Credenciales incorrectas. Verifica el correo y la contraseña.");
      } else if (code === "auth/too-many-requests") {
        setError("Demasiados intentos fallidos. Intenta nuevamente más tarde.");
      } else if (code === "auth/network-request-failed") {
        setError("Error de conexión. Revisa tu conexión a internet.");
      } else {
        setError("No se pudo iniciar sesión. " + (err.message || ""));
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content modal-login"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon">🔐</span>
            <div>
              <h3 className="modal-title">Acceso al Panel de Administración</h3>
              <p className="modal-subtitle">
                Ingresa con tu cuenta institucional para gestionar los registros.
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

        <form onSubmit={handleLogin} className="modal-form">
          {error && <div className="message message-error">{error}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Correo Institucional o de Administrador
            </label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@iets.org.co"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">
              Contraseña
            </label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={onClose}
              disabled={cargando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="button button-primary"
              disabled={cargando}
            >
              {cargando ? "Validando..." : "Ingresar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
