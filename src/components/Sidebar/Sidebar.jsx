import { useState } from "react";
import {
  FiFileText,
  FiLogOut,
  FiUploadCloud,
  FiChevronRight,
  FiClipboard,
  FiMessageCircle,
} from "react-icons/fi";
import { keycloak } from "../../services/keycloak";
import logo from "../../assets/logo.svg";
import UploadModal from "../Document/UploadModal/UploadModal";
import "./Sidebar.css";

function Sidebar({
  onOpenUploadModal,
  onDocumentCreated,
  isOperator = false,
  activePage = "documents",
  onNavigate,
}) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleOpenUpload = () => {
    if (onOpenUploadModal) {
      onOpenUploadModal();
    } else {
      setIsUploadModalOpen(true);
    }
  };

  const handleLogout = () => {
    keycloak.logout({ redirectUri: window.location.origin }).catch((error) => {
      console.error("Erro ao fazer logout:", error);
    });
  };

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src={logo} alt="IAzimute" className="sidebar-logo" />
        </div>

        <nav className="sidebar-menu">
          <button
            type="button"
            className={`sidebar-item${activePage === "documents" ? " active" : ""}`}
            aria-current={activePage === "documents" ? "page" : undefined}
            onClick={() => onNavigate?.("documents")}
          >
            <FiFileText size={18} />
            Documentos
          </button>
          <button
            type="button"
            className={`sidebar-item${activePage === "chat" ? " active" : ""}`}
            aria-current={activePage === "chat" ? "page" : undefined}
            onClick={() => onNavigate?.("chat")}
          >
            <FiMessageCircle size={18} />
            Chat
          </button>
          {isOperator && (
            <button
              type="button"
              className={`sidebar-item${activePage === "requests" ? " active" : ""}`}
              aria-current={activePage === "requests" ? "page" : undefined}
              onClick={() => onNavigate?.("requests")}
            >
              <FiClipboard size={18} />
              Solicitações
            </button>
          )}
        </nav>

        {isOperator && (
          <div className="sidebar-upload-container">
            <button
              type="button"
              className="sidebar-upload-button"
              onClick={handleOpenUpload}
              aria-label="Cadastrar documento"
            >
              <div className="sidebar-upload-content">
                <FiUploadCloud size={20} className="sidebar-upload-icon" />
                <div className="sidebar-upload-text">
                  <span>Cadastrar</span>
                  <span>documento</span>
                </div>
              </div>
              <FiChevronRight size={16} className="sidebar-chevron-icon" />
            </button>
          </div>
        )}

        <div className="sidebar-footer">
          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            <FiLogOut size={18} />
            Deslogar
          </button>
        </div>
      </aside>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onDocumentCreated={onDocumentCreated}
      />
    </>
  );
}

export default Sidebar;