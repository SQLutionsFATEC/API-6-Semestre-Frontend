import {
  FiEye,
  FiLock,
  FiCheckCircle,
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
          <button className="modal-close cursor-pointer" onClick={onClose} aria-label="Fechar">
            <FiX size={18} aria-hidden="true" />
          </button>

          {loading ? (
            <div className="modal-state-container">
              <p role="status">Carregando detalhes do documento...</p>
            </div>
          ) : (
            <div role="alert" className="modal-error-container">
              <p>{error}</p>
              <button className="modal-view-button cursor-pointer" onClick={onRetry}>
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
              {document.acesso_permitido === false ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  <FiLock size={12} className="text-rose-600" />
                  Acesso Bloqueado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <FiCheckCircle size={12} className="text-emerald-600" />
                  Acesso Liberado
                </span>
              )}
            </div>
          </div>

          <button className="modal-close cursor-pointer" onClick={onClose} aria-label="Fechar">
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
            <div className={`stat-icon-badge ${document.acesso_permitido === false ? "stat-red" : "stat-purple"}`}>
              {document.acesso_permitido === false ? (
                <FiLock size={18} />
              ) : (
                <FiShield size={18} />
              )}
            </div>
            <div className="stat-info">
              <span className="stat-label">Nível de acesso</span>
              <div className="flex items-center gap-2 flex-wrap">
                <strong className="stat-value">{document.nivel || "-"}</strong>
              </div>
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

        {/* AVISO DE ACESSO BLOQUEADO SE APLICÁVEL */}
        {document.acesso_permitido === false && (
          <div className="mb-4 flex items-center gap-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-sm">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-100 text-rose-700 shrink-0">
              <FiLock size={18} />
            </div>
            <div className="flex-1 text-left">
              <strong className="block font-semibold text-rose-900">Documento com Acesso Restrito</strong>
              <span className="text-xs text-rose-700">
                Seu usuário não possui permissão para visualizar o conteúdo deste documento.
              </span>
            </div>
          </div>
        )}

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
            className={`modal-view-button cursor-pointer ${document.acesso_permitido === false ? "modal-view-locked" : ""}`}
            disabled={!document.data && document.acesso_permitido !== false}
            onClick={() => onViewPdf(document)}
            aria-label="Visualizar"
          >
            {document.acesso_permitido === false ? (
              <FiLock size={17} aria-hidden="true" />
            ) : (
              <FiEye size={17} aria-hidden="true" />
            )}
            Visualizar
          </button>

          <button
            type="button"
            className={`modal-edit-button ${
              document.acesso_permitido === false ? "opacity-50 cursor-not-allowed!" : "cursor-pointer"
            }`}
            disabled={document.acesso_permitido === false}
            onClick={() => console.log("Editar documento")}
            title={document.acesso_permitido === false ? "Edição bloqueada" : "Editar documento"}
          >
            {document.acesso_permitido === false ? (
              <FiLock size={15} aria-hidden="true" />
            ) : (
              <FiEdit3 size={15} />
            )}
            Editar documento
          </button>
        </footer>
      </div>
    </div>
  );
}

export default DocumentModal;
