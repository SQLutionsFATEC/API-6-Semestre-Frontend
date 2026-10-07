import {
  FiEye,
  FiX,
  FiInfo,
  FiTag,
  FiFileText,
  FiCalendar,
  FiShield,
  FiBriefcase,
  FiFile,
  FiEdit3,
} from "react-icons/fi";
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
    if (event.key === "Escape") {
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
      >
        <div className="document-modal">
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            <FiX size={18} aria-hidden="true" />
          </button>

          {loading ? (
            <div className="modal-state-container">
              <p role="status">Carregando detalhes do documento...</p>
            </div>
          ) : (
            <div role="alert" className="modal-error-container">
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
    >
      <div className="document-modal">
        {/* CABEÇALHO */}
        <header className="modal-top">
          <div className="modal-top-texts">
            <span className="modal-label">Arquivo</span>
            <div className="modal-title-row">
              <h2 className="modal-code">{document.nome}</h2>
              <span className="modal-pdf-badge">
                <FiFileText size={14} className="badge-icon" />
                {document.tipo_arquivo?.toUpperCase() || "ARQUIVO"}
              </span>
            </div>
          </div>

          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            <FiX size={18} aria-hidden="true" />
          </button>
        </header>

        {/* 4 CARDS DE ESTATÍSTICA (TOP) */}
        <div className="modal-stats-grid">
          <div className="modal-stat-card">
            <div className="stat-icon-badge stat-blue">
              <FiBriefcase size={18} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Setor</span>
              <strong className="stat-value">{document.setor || "-"}</strong>
            </div>
          </div>

          <div className="modal-stat-card">
            <div className="stat-icon-badge stat-purple">
              <FiShield size={18} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Nível de acesso</span>
              <strong className="stat-value">{document.nivel || "-"}</strong>
            </div>
          </div>

          <div className="modal-stat-card">
            <div className="stat-icon-badge stat-blue">
              <FiCalendar size={18} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Atualizado em</span>
              <strong className="stat-value">{formatDate(document.data_atualizacao)}</strong>
            </div>
          </div>

          <div className="modal-stat-card">
            <div className="stat-icon-badge stat-red">
              <FiFile size={18} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Tipo</span>
              <strong className="stat-value">{document.tipo_arquivo?.toUpperCase() || "-"}</strong>
            </div>
          </div>
        </div>

        {/* SEÇÃO PRINCIPAL (2 COLUNAS) */}
        <div className="modal-body-grid">
          {/* COLUNA ESQUERDA: Informações + Tags */}
          <div className="modal-left-col">
            <div className="modal-card-box">
              <div className="box-header">
                <FiInfo size={16} className="box-header-icon" />
                <span className="box-title">Informações do documento</span>
              </div>
              <p className="document-description">
                {document.descricao ||
                  document.contexto ||
                  "Documento arquivado no repositório institucional da IAzimute, validado para consultas e rotinas operacionais de acordo com a política interna de conformidade."}
              </p>
            </div>

            <div className="modal-card-box tags-box-wrapper">
              <div className="box-header">
                <FiTag size={16} className="box-header-icon" />
                <span className="box-title">Tags</span>
              </div>

              <div className="tags-content">
                {tags.length > 0 ? (
                  <div className="tags-list">
                    {tags.map((tag) => (
                      <span className="document-tag" key={tag.id_etiqueta}>
                        {tag.nome}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="tags-empty-state">
                    <div className="tags-empty-icon">
                      <FiTag size={16} />
                    </div>
                    <span className="tags-empty">Nenhuma etiqueta atribuida.</span>
                    <span className="tags-empty-subtitle">
                      Este documento ainda não possui etiquetas.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: Pré-visualização */}
          <div className="modal-right-col">
            <div className="modal-card-box preview-box">
              <div className="box-header">
                <FiFileText size={16} className="box-header-icon" />
                <span className="box-title">Pré-visualização</span>
              </div>

              <div className="preview-sheet-wrapper">
                <div className="preview-sheet">
                  <div className="preview-sheet-top">
                    <div className="preview-pdf-pill">
                      <FiFileText size={14} />
                      <span>{document.tipo_arquivo?.toUpperCase() || "PDF"}</span>
                    </div>
                    <div className="preview-watermark-logo">IA</div>
                  </div>

                  <div className="preview-lines">
                    <div className="preview-line line-lg"></div>
                    <div className="preview-line line-md"></div>
                    <div className="preview-line line-sm"></div>
                    <div className="preview-line line-md"></div>
                  </div>

                  <div className="preview-chart-mock">
                    <div className="preview-bar bar-1"></div>
                    <div className="preview-bar bar-2"></div>
                    <div className="preview-bar bar-3"></div>
                    <div className="preview-bar bar-4"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RODAPÉ COM AÇÕES */}
        <footer className="modal-actions">
          <button
            type="button"
            className="modal-view-button"
            disabled={!document.data}
            onClick={() => onViewPdf(document)}
            aria-label="Visualizar"
          >
            <FiEye size={17} aria-hidden="true" />
            Visualizar
          </button>

          <button
            type="button"
            className="modal-edit-button"
            onClick={() => console.log("Editar documento")}
          >
            <FiEdit3 size={15} />
            Editar documento
          </button>
        </footer>
      </div>
    </div>
  );
}

export default DocumentModal;
