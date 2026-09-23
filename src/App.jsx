import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase/config";
import Header from "./components/Header";
import Footer from "./components/Footer";
import RegistroForm from "./components/RegistroForm";
import AdminPanel from "./components/AdminPanel";
import LoginModal from "./components/LoginModal";
import "./App.css";

function App() {
  const [vistaActual, setVistaActual] = useState("registro");
  const [usuarioAutenticado, setUsuarioAutenticado] = useState(null);
  const [modalLoginAbierto, setModalLoginAbierto] = useState(false);

  // Escuchar estado de sesión en Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuarioAutenticado(user);
    });
    return () => unsubscribe();
  }, []);

  const handleAbrirLogin = () => {
    setModalLoginAbierto(true);
  };

  const handleCerrarSesion = async () => {
    try {
      await signOut(auth);
      setVistaActual("registro");
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
  };

  const handleLoginExitoso = (user) => {
    setUsuarioAutenticado(user);
    setVistaActual("admin");
  };

  return (
    <div className="app-layout">
      {/* Header Institucional con Logos MinSalud e IETS */}
      <Header
        vistaActual={vistaActual}
        setVistaActual={setVistaActual}
        usuarioAutenticado={usuarioAutenticado}
        onAbrirLogin={handleAbrirLogin}
        onCerrarSesion={handleCerrarSesion}
      />

      {/* Contenedor Principal */}
      <div className="app-body">
        {vistaActual === "registro" ? (
          <RegistroForm onIrALogin={handleAbrirLogin} />
        ) : usuarioAutenticado ? (
          <AdminPanel onIrARegistro={() => setVistaActual("registro")} />
        ) : (
          <div className="access-denied-card">
            <div className="lock-icon">🔒</div>
            <h2>Acceso Restringido al Panel Administrativo</h2>
            <p>
              Debes iniciar sesión con una cuenta autorizada del IETS para acceder a la gestión y consulta de usuarios.
            </p>
            <div className="access-denied-actions">
              <button
                type="button"
                className="button button-primary"
                onClick={handleAbrirLogin}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setVistaActual("registro")}
              >
                Volver al Formulario
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Autenticación de Administrador */}
      <LoginModal
        isOpen={modalLoginAbierto}
        onClose={() => setModalLoginAbierto(false)}
        onLoginExitoso={handleLoginExitoso}
      />

      {/* Footer Institucional IETS */}
      <Footer />
    </div>
  );
}

export default App;