import { useState, useEffect } from "react";
import {
  FiUser,
  FiMail,
  FiEdit2,
  FiTrash2,
  FiAlertCircle,
} from "react-icons/fi";
import "./UserModal.css";

const MOCK_USER = {
  name: "Nome do usuário",
  email: "NomeUltimoNome@gmail.com",
  role: "Técnico",
  level: "Nível 1",
};

function UserModal({ isOpen, onClose, user = MOCK_USER, onUserUpdated, onUserDeleted }) {
  const [mode, setMode] = useState("view");
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setMode("view");
      setFormData({ name: user.name, email: user.email });
      setErrors({});
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleEditClick = () => {
    setMode("edit");
    setErrors({});
  };

  const handleCancelEdit = () => {
    setMode("view");
    setFormData({ name: user.name, email: user.email });
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  function handleSave() {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "O nome não pode estar vazio.";
    if (!formData.email.trim()) newErrors.email = "O email não pode estar vazio.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    if (onUserUpdated) {
      onUserUpdated({
        name: formData.name.trim(),
        email: formData.email.trim(),
      });
    }

    setMode("view");
  }

  const handleDeleteClick = () => setMode("delete");
  const handleCancelDelete = () => setMode("view");

  function handleConfirmDelete() {
    if (onUserDeleted) onUserDeleted();
    onClose();
  }

  return (
    <div className="user-modal-backdrop" onClick={handleBackdropClick}>
      <div className="user-modal-card">
        {mode === "view" && (
          <>
            <div className="user-modal-header">
              <div className="user-avatar">
                <FiUser size={28} />
              </div>
              <h2 className="user-name">{user.name}</h2>
            </div>

            <div className="user-modal-body">
              <div className="info-row">
                <span className="info-label">
                  <FiMail size={14} /> Email
                </span>
                <span className="info-value">{user.email}</span>
              </div>

              <div className="info-row-inline">
                <div className="info-block">
                  <span className="info-label">Cargo</span>
                  <span className="info-badge">{user.role}</span>
                </div>
                <div className="info-block">
                  <span className="info-label">Nível de Acesso</span>
                  <span className="info-badge">{user.level}</span>
                </div>
              </div>
            </div>

            <div className="user-modal-footer">
              <button
                type="button"
                className="btn-delete"
                onClick={handleDeleteClick}
              >
                <FiTrash2 size={14} /> Excluir minha conta
              </button>
              <button
                type="button"
                className="btn-edit"
                onClick={handleEditClick}
              >
                <FiEdit2 size={14} /> Editar informações
              </button>
            </div>
          </>
        )}

        {mode === "edit" && (
          <>
            <div className="user-modal-header">
              <div className="user-avatar">
                <FiUser size={28} />
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`edit-input edit-name ${errors.name ? "input-error" : ""}`}
                placeholder="Nome"
              />
            </div>

            <div className="user-modal-body">
              <div className="edit-field">
                <label className="info-label">
                  <FiMail size={14} /> Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`edit-input ${errors.email ? "input-error" : ""}`}
                  placeholder="email@exemplo.com"
                />
                {errors.email && (
                  <span className="error-text">
                    <FiAlertCircle size={12} /> {errors.email}
                  </span>
                )}
              </div>

              {errors.name && (
                <span className="error-text">
                  <FiAlertCircle size={12} /> {errors.name}
                </span>
              )}
            </div>

            <div className="user-modal-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={handleCancelEdit}
              >
                Cancelar
              </button>
              <button type="button" className="btn-save" onClick={handleSave}>
                <FiEdit2 size={14} /> Concluir edição
              </button>
            </div>
          </>
        )}

        {mode === "delete" && (
          <div className="delete-confirm">
            <h3>Deseja excluir sua conta?</h3>
            <div className="delete-actions">
              <button
                type="button"
                className="btn-confirm-delete"
                onClick={handleConfirmDelete}
              >
                Confirmar
              </button>
              <button
                type="button"
                className="btn-cancel-delete"
                onClick={handleCancelDelete}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserModal;