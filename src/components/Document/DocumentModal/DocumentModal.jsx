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
import { formatarSetor } from "../../../utils/documentFormatters";
import "./DocumentModal.css";

function formatDate(dateValue) {
  if (
    dateValue === null ||
    dateValue === undefined ||
    dateValue === ""
  ) {
    return "-";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return String(dateValue);
  }

  return date.toLocaleDateString("pt-BR", {
    timeZone: "UTC",
  });
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") {
    return "Não informado";
  }

  return value;
}

function getTags(document) {
  if (Array.isArray(document?.etiquetas)) {
    return document.etiquetas;
  }

  if (Array.isArray(document?.tags)) {
    return document.tags;
  }

  return [];
}

function getTagName(tag) {
  if (typeof tag === "string") {
    return tag;
  }

  if (tag && typeof tag === "object") {
    return tag.nome ?? tag.name ?? tag.etiqueta ?? "";
  }

  return "";
}

function getFileUrl(document) {
  const file = document?.arquivo;

  return (
    document?.arquivo_url ??
    document?.url_arquivo ??
    (typeof file === "object" ? file?.url : undefined) ??
    (typeof file === "string" ? file : undefined) ??
    document?.file_url ??
    document?.url ??
    document?.data ??
    ""
  );
}

function getDocumentName(document) {
  return (
    document?.nome ??
    document?.titulo ??
    document?.nome_arquivo ??
    document?.arquivo_nome ??
    "Documento sem título"
  );
}

function getFileType(document) {
  const type = document?.tipo_arquivo ?? document?.extensao;

  if (
    type === null ||
    type === undefined ||
    String(type).trim() === ""
  ) {
    return "ARQUIVO";
  }

  return String(type).replace(/^\./, "").toUpperCase();
}

export default function DocumentModal({
  document,
  onClose,
  onViewPdf,
  onView,
  onEdit,
  editPermissionError = "",
  loading = false,
  error = null,
  onRetry,
}) {
  if (!document) {
    return null;
  }

  const tags = getTags(document);
  const fileUrl = getFileUrl(document);
  const documentName = getDocumentName(document);
  const accessRestricted = document.acesso_permitido === false;

  const canView = Boolean(fileUrl);
  const canEdit = !accessRestricted;

  function handleOverlayClick(event) {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  }

  function handleView() {
    if (!canView || loading || error) {
      return;
    }

    if (typeof onViewPdf === "function") {
      onViewPdf(document);
      return;
    }

    if (accessRestricted) {
      return;
    }

    if (typeof onView === "function") {
      onView({
        ...document,
        arquivo_url: fileUrl,
      });
      return;
    }

    window.open(fileUrl, "_blank", "noopener,noreferrer");
  }

  function handleEdit() {
    if (!canEdit || typeof onEdit !== "function") {
      return;
    }

    onEdit(document);
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      onClose?.();
    }
  }

  return (
    <div
      className="document-modal-overlay"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Detalhes do documento"
    >
      <div className="document-modal">
        {/* CABEÇALHO */}
        <header className="modal-top">
          <div className="modal-top-texts">
            <span className="modal-label">Arquivo</span>
            {!loading && !error && (
              <div className="modal-title-row">
                <h2 className="modal-code">{documentName}</h2>
                <span className="modal-pdf-badge">
                  <FiFileText size={14} className="badge-icon" />
                  {getFileType(document)}
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
            )}
          </div>

          <button className="modal-close cursor-pointer" onClick={onClose} aria-label="Fechar">
            <FiX size={18} aria-hidden="true" />
          </button>
        </header>

        {loading ? (
          <div className="modal-state-container" role="status">
            <p>Carregando detalhes do documento...</p>
          </div>
        ) : error ? (
          <div className="modal-error-container">
            <p role="alert">{error}</p>
            {typeof onRetry === "function" && (
              <button type="button" className="modal-view-button" onClick={onRetry}>
                Tentar novamente
              </button>
            )}
          </div>
        ) : (
          <>
            {/* 4 CARDS DE ESTATÍSTICA (TOP) */}
            <div className="modal-stats-grid">
              <div className="modal-stat-card">
                <div className="stat-icon-badge stat-blue">
                  <FiBriefcase size={18} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Setor</span>
                  <strong className="stat-value">{formatarSetor(document)}</strong>
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
                    <strong className="stat-value">{formatValue(document.nivel)}</strong>
                  </div>
                </div>
              </div>

              <div className="modal-stat-card">
                <div className="stat-icon-badge stat-blue">
                  <FiCalendar size={18} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Atualizado em</span>
                  <strong className="stat-value">{formatDate(document.data_atualizacao ?? document.data_modificacao ?? document.atualizado_em)}</strong>
                </div>
              </div>

              <div className="modal-stat-card">
                <div className="stat-icon-badge stat-red">
                  <FiFile size={18} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Tipo</span>
                  <strong className="stat-value">{getFileType(document)}</strong>
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
                    {formatValue(document.descricao ?? document.observacao ?? document.observacoes ?? document.contexto)}
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
                        {tags.map((tag, index) => {
                          const tagName = getTagName(tag);
                          return tagName ? (
                            <span className="document-tag" key={`${tagName}-${index}`}>
                              {tagName}
                            </span>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <div className="tags-empty-state">
                        <div className="tags-empty-icon">
                          <FiTag size={16} />
                        </div>
                        <span className="tags-empty">Nenhuma etiqueta atribuída.</span>
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

                  <div className="preview-sheet-wrapper" aria-hidden="true">
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

          </>
        )}

        {/* RODAPÉ COM AÇÕES */}
        {editPermissionError && (
          <p className="document-edit-permission-error" role="alert">
            {editPermissionError}
          </p>
        )}
        <footer className="modal-actions">
          <button
            type="button"
            className={`modal-view-button cursor-pointer ${document.acesso_permitido === false ? "modal-view-locked" : ""}`}
            disabled={!canView || loading || Boolean(error)}
            onClick={handleView}
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
            onClick={handleEdit}
            aria-label="Editar documento"
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
