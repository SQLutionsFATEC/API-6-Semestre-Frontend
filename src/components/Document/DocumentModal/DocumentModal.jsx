import { FiEye } from "react-icons/fi";
import "./DocumentModal.css";

function DocumentModal({ document, onClose, onViewPdf, loading, error, onRetry }) {
  if (loading || error) {
    return (
      <div className="document-modal-overlay" onClick={onClose}>
        <div
          className="document-modal"
          onClick={(event) => event.stopPropagation()}
        >
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            Ã—
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

  if (!document) {
    return null;
  }

  const tags = [
    "Materiais metálicos",
    "Manutenção",
    "MIL-HDBK",
    "Engenharia",
    "Handbook",
  ];

  return (
    <div
      className="document-modal-overlay"
      onClick={onClose}
    >
      <div
        className="document-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-top">
          <div className="modal-code-section">
            <span className="modal-label">
              Código da norma
            </span>

            <div className="modal-code">
              {document.code || document.name}

              <span className="modal-pdf-badge">
                PDF
              </span>
            </div>
          </div>

          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Fechar"
          >
            ×
          </button>
        </header>

        <section className="modal-title-section">
          <span className="modal-label">
            Título do arquivo
          </span>

          <p className="modal-document-title">
            {document.name}
          </p>
        </section>

        <section className="modal-main-info">
          <div className="modal-info-group">
            <span className="modal-label">
              Setor/Tipo
            </span>

            <span
              className={`modal-info-badge ${
                document.type === "Técnico"
                  ? "type-técnico"
                  : document.type === "Normativo"
                  ? "type-normativo"
                  : document.type === "Administrativo"
                  ? "type-administrativo"
                  : ""
              }`}
            >
              {document.type}
            </span>
          </div>

          <div className="modal-info-group">
            <span className="modal-label">
              Nível de Acesso
            </span>

            <span
              className={`modal-info-badge ${
                document.accessLevel === "Gestor"
                  ? "access-gestor"
                  : document.accessLevel === "Usuário"
                  ? "access-usuário"
                  : document.accessLevel === "Público"
                  ? "access-público"
                  : ""
              }`}
            >
              {document.accessLevel}
            </span>
          </div>

          <div className="modal-info-group">
            <span className="modal-label">
              Categoria
            </span>

            <span className="modal-info-badge modal-category-badge">
              {document.category || document.type}
            </span>
          </div>
        </section>

        <section className="modal-details">
          <div className="file-data-section">
            <span className="section-title">
              Dados do arquivo
            </span>

            <div className="file-data-box">
              <div className="file-data-row">
                <span>↻ Revisão:</span>

                <strong>
                  {document.revision || "5J"}
                </strong>
              </div>

              <div className="file-data-row">
                <span>◷ Data de Atualização:</span>

                <strong>
                  {document.updatedAt}
                </strong>
              </div>

              <div className="file-data-row">
                <span>▤ Tamanho do arquivo:</span>

                <strong>
                  {document.fileSize || "66.8 MB"}
                </strong>
              </div>
            </div>
          </div>

          <div className="tags-section">
            <span className="section-title">
              🏷 Tags
            </span>

            <div className="tags-box">
              {tags.map((tag) => (
                <span
                  className="document-tag"
                  key={tag}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        <footer className="modal-actions">
          <button
            className="modal-view-button"
            onClick={() => onViewPdf(document)}
          >
            <FiEye size={18} />
            Visualizar
          </button>
        </footer>
      </div>
    </div>
  );
}

export default DocumentModal;
