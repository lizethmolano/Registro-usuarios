
import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase/config";
import Header from "./components/Header";
import Footer from "./components/Footer";
import RegistroForm from "./components/RegistroForm";
import AdminPanel from "./components/AdminPanel";
import LoginModal from "./components/LoginModal";
import "./App.css";

function App() {
  const [vistaActual, setVistaActual] = useState("registro");
  const [usuarioAutenticado, setUsuarioAutenticado] = useState(null);
  const [rolUsuario, setRolUsuario] = useState(null);
  const [verificandoRol, setVerificandoRol] = useState(false);
  const [modalLoginAbierto, setModalLoginAbierto] = useState(false);

  // Escuchar estado de sesión en Firebase Auth
  // y consultar el rol del usuario en Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUsuarioAutenticado(user);

      if (!user) {
        setRolUsuario(null);
        setVerificandoRol(false);
        return;
      }

      setVerificandoRol(true);

      try {
        // El rol se encuentra en la colección "perfiles"
        const snap = await getDoc(doc(db, "perfiles", user.uid));

        const rol = snap.exists()
          ? snap.data().rol || "usuario"
          : "usuario";

        setRolUsuario(rol);

        // Si es administrador, mostramos el panel
        if (rol === "admin") {
          setVistaActual("admin");
        }
      } catch (err) {
        console.error("Error obteniendo el rol del usuario:", err);

        // Ante cualquier error, nunca se concede acceso administrativo
        setRolUsuario("usuario");
      } finally {
        setVerificandoRol(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAbrirLogin = () => {
    setModalLoginAbierto(true);
  };

  const handleCerrarSesion = async () => {
    try {
      await signOut(auth);
      setRolUsuario(null);
      setUsuarioAutenticado(null);
      setVistaActual("registro");
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
  };

  const handleLoginExitoso = (user) => {
    setUsuarioAutenticado(user);
    setRolUsuario("admin");
    setVistaActual("admin");
  };

  const esAdmin = rolUsuario === "admin";

  return (
    <div className="app-layout">
      {/* Header Institucional con Logos MinSalud e IETS */}
      <Header
        vistaActual={vistaActual}
        setVistaActual={setVistaActual}
        usuarioAutenticado={esAdmin ? usuarioAutenticado : null}
        onAbrirLogin={handleAbrirLogin}
        onCerrarSesion={handleCerrarSesion}
      />

      {/* Contenedor Principal */}
      <div className="app-body">
        {vistaActual === "registro" ? (
          <RegistroForm onIrALogin={handleAbrirLogin} />
        ) : verificandoRol ? (
          <div className="access-denied-card">
            <div
              className="table-loading-spinner"
              style={{ margin: "0 auto 16px" }}
            />
            <h2>Verificando permisos...</h2>
          </div>
        ) : esAdmin ? (
          <AdminPanel
            onIrARegistro={() => setVistaActual("registro")}
          />
        ) : (
          <div className="access-denied-card">
            <div className="lock-icon">🔒</div>

            <h2>Acceso Restringido al Panel Administrativo</h2>

            <p>
              Debes iniciar sesión con una cuenta autorizada del IETS
              para acceder a la gestión y consulta de usuarios.
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
