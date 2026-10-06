import { useState } from "react";
import {
  FiFileText,
  FiLogOut,
  FiUploadCloud,
  FiChevronRight,
} from "react-icons/fi";
import logo from "../../assets/logo.svg";
import UploadModal from "../Document/UploadModal/UploadModal";
import "./Sidebar.css";

function Sidebar({ onOpenUploadModal }) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleOpenUpload = () => {
    if (onOpenUploadModal) {
      onOpenUploadModal();
    } else {
      setIsUploadModalOpen(true);
    }
  };

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src={logo} alt="IAzimute" className="sidebar-logo" />
        </div>

        <nav className="sidebar-menu">
          <button className="sidebar-item active">
            <FiFileText size={20} />
            Documentos
          </button>
        </nav>

        <div className="sidebar-upload-container">
          <button
            type="button"
            className="sidebar-upload-button"
            onClick={handleOpenUpload}
            aria-label="Cadastrar documento"
          >
            <div className="sidebar-upload-content">
              <FiUploadCloud size={22} className="sidebar-upload-icon" />
              <div className="sidebar-upload-text">
                <span>Cadastrar</span>
                <span>documento</span>
              </div>
            </div>
            <FiChevronRight size={18} className="sidebar-chevron-icon" />
          </button>
        </div>

        <div className="sidebar-footer">
          <button type="button" className="logout-button">
            <FiLogOut size={20} />
            Deslogar
          </button>
        </div>
      </aside>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </>
  );
}

export default Sidebar;