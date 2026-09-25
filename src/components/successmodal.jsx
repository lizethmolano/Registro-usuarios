export default function SuccessModal({ isOpen, onClose, message }) {
    if (!isOpen) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <div>
                        <h3 className="modal-title">¡Registro exitoso!</h3>

                        <p className="modal-subtitle">
                            {message ||
                                "Tu registro se realizó correctamente."}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="modal-close-btn"
                        onClick={onClose}
                        aria-label="Cerrar"
                    >
                        ✕
                    </button>
                </div>

                <div className="modal-actions">
                    <button
                        type="button"
                        className="button button-primary"
                        onClick={onClose}
                    >
                        Continuar
                    </button>
                </div>
            </div>
        </div>
    );
}