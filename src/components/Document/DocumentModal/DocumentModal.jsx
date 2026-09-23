import { FiEye, FiX } from "react-icons/fi";
import "./DocumentModal.css";

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function DocumentModal({ document, onClose, onViewPdf, loading, error, onRetry }) {
  
  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape" || event.key === "Enter") {
      onClose();
    }
  };

  if (loading || error) {
    return (
      <div 
        className="document-modal-overlay" 
        onClick={handleOverlayClick}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        tabIndex={0}
      >
        <div className="document-modal">
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            <FiX size={18} aria-hidden="true" />
          </button>

          {loading ? (
            <p role="status">Carregando detalhes do documento...</p>
          ) : (
            <div role="alert">
              <p>{error}</p>
              <button className="modal-view-button" onClick={onRetry}>
                Tentar novamente
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!document) return null;

  const tags = document.etiquetas || [];

  return (
    <div 
      className="document-modal-overlay" 
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      tabIndex={0}
    >
      <div className="document-modal">
        <header className="modal-top">
          <div className="modal-code-section">
            <span className="modal-label">Arquivo</span>

            <div className="modal-code">
              {document.nome}
              <span className="modal-pdf-badge">
                {document.tipo_arquivo?.toUpperCase() || "ARQUIVO"}
              </span>
            </div>
          </div>

          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            <FiX size={18} aria-hidden="true" />
          </button>
        </header>

        <section className="modal-main-info">
          <div className="modal-info-group">
            <span className="modal-label">Setor</span>
            <span className="modal-info-badge">{document.setor}</span>
          </div>

          <div className="modal-info-group">
            <span className="modal-label">Nivel de acesso</span>
            <span className="modal-info-badge">{document.nivel}</span>
          </div>
        </section>

        <section className="modal-details">
          <div className="file-data-section">
            <span className="section-title">Dados do arquivo</span>

            <div className="file-data-box">
              <div className="file-data-row">
                <span>Tipo:</span>
                <strong>{document.tipo_arquivo || "-"}</strong>
              </div>

              <div className="file-data-row">
                <span>Data de atualizacao:</span>
                <strong>{formatDate(document.data_atualizacao)}</strong>
              </div>
            </div>
          </div>

          <div className="tags-section">
            <span className="section-title">Tags</span>

            <div className="tags-box">
              {tags.length > 0 ? (
                tags.map((tag) => (
                  <span className="document-tag" key={tag.id_etiqueta}>
                    {tag.nome}
                  </span>
                ))
              ) : (
                <span className="tags-empty">Nenhuma etiqueta atribuida.</span>
              )}
            </div>
          </div>
        </section>

        <footer className="modal-actions">
          <button
            className="modal-view-button"
            disabled={!document.data}
            onClick={() => onViewPdf(document)}
          >
            <FiEye size={18} aria-hidden="true" />
            Visualizar
          </button>
        </footer>
      </div>
    </div>
  );
}

export default DocumentModal;
