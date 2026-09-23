import React from "react";

export default function Footer() {
  const anioActual = new Date().getFullYear();

  return (
    <footer className="footer-institucional">
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-col">
            <div className="footer-brand-title">
              Instituto de Evaluación Tecnológica en Salud - IETS
            </div>
            <p className="footer-description">
              Corporación sin ánimo de lucro de carácter mixto, creada conforme a la Ley 1438 de 2011, que evalúa tecnologías en salud para Colombia.
            </p>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Sede y Contacto</h4>
            <ul className="footer-list">
              <li>Bogotá D.C., Colombia</li>
              <li>Correo: contacto@iets.org.co</li>
              <li>Atención al ciudadano y soporte técnico</li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Enlaces de Interés</h4>
            <ul className="footer-list">
              <li>
                <a
                  href="https://iets.org.co"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Portal Web Principal
                </a>
              </li>
              <li>
                <a
                  href="https://www.minsalud.gov.co"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ministerio de Salud y Protección Social
                </a>
              </li>
              <li>
                <a
                  href="https://iets.org.co/politica-de-tratamiento-de-datos/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Política de Tratamiento de Datos
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div>
            © {anioActual} Instituto de Evaluación Tecnológica en Salud (IETS). Todos los derechos reservados.
          </div>
          <div>
            Sistema de Información y Registro Institucional
          </div>
        </div>
      </div>
    </footer>
  );
}
