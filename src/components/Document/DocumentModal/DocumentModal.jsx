import { FiBriefcase } from "react-icons/fi";
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
      role="dialog"
      aria-modal="true"
      aria-label="Detalhes do documento"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
    >
      <div className="document-modal">
        <header className="modal-top">
          <div className="modal-top-texts">
            <span className="modal-label">Arquivo</span>

            {!loading && !error && (
              <>
                <div className="modal-title-row">
                  <h2 className="modal-code">{documentName}</h2>

                  <span className="modal-pdf-badge">
                    {getFileType(document)}
                  </span>
                </div>

                {accessRestricted ? (
                  <span className="access-status access-restricted">
                    Acesso Bloqueado
                  </span>
                ) : (
                  <span className="access-status access-allowed">
                    Acesso Liberado
                  </span>
                )}
              </>
            )}
          </div>

          <button
            type="button"
            className="modal-close cursor-pointer"
            aria-label="Fechar"
            onClick={onClose}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        {loading ? (
          <div className="modal-state" role="status">
            Carregando detalhes do documento...
          </div>
        ) : error ? (
          <div className="modal-state modal-error">
            <p role="alert">{error}</p>

            {typeof onRetry === "function" && (
              <button
                type="button"
                className="modal-retry-button"
                onClick={onRetry}
              >
                Tentar novamente
              </button>
            )}
          </div>
        ) : (
          <>
            {accessRestricted && (
              <div className="access-warning" role="status">
                Documento com Acesso Restrito
              </div>
            )}

            <div className="modal-stats-grid">
              <div className="modal-stat-card">
                <div
                  className="stat-icon-badge stat-blue"
                  aria-hidden="true"
                >
                  <FiBriefcase size={18} />
                </div>

                <div className="stat-info">
                  <span className="stat-label">Setor</span>
                  <strong className="stat-value">
                    {formatarSetor(document)}
                  </strong>
                </div>
              </div>

              <div className="modal-stat-card">
                <div
                  className="stat-icon-badge stat-purple"
                  aria-hidden="true"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>

                <div className="stat-info">
                  <span className="stat-label">
                    Última atualização
                  </span>
                  <strong className="stat-value">
                    {formatDate(
                      document.data_atualizacao ??
                        document.data_modificacao ??
                        document.atualizado_em
                    )}
                  </strong>
                </div>
              </div>

              <div className="modal-stat-card">
                <div
                  className="stat-icon-badge stat-green"
                  aria-hidden="true"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="3"
                      y="11"
                      width="18"
                      height="11"
                      rx="2"
                    />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>

                <div className="stat-info">
                  <span className="stat-label">
                    Nível de acesso
                  </span>
                  <strong className="stat-value">
                    {formatValue(document.nivel)}
                  </strong>
                </div>
              </div>

              <div className="modal-stat-card">
                <div
                  className="stat-icon-badge stat-orange"
                  aria-hidden="true"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.59 13.41 11 3.83V3H4v7h.83l9.58 9.59a2 2 0 0 0 2.83 0l3.35-3.35a2 2 0 0 0 0-2.83Z" />
                    <circle cx="7.5" cy="6.5" r=".5" />
                  </svg>
                </div>

                <div className="stat-info">
                  <span className="stat-label">Etiquetas</span>
                  <strong className="stat-value">
                    {tags.length}
                  </strong>
                </div>
              </div>
            </div>

            <section className="modal-section">
              <h3 className="modal-section-title">Descrição</h3>

              <p className="document-description">
                {formatValue(
                  document.descricao ??
                    document.observacao ??
                    document.observacoes
                )}
              </p>
            </section>

            <section className="modal-section">
              <h3 className="modal-section-title">
                Etiquetas atribuídas
              </h3>

              <div className="document-tags">
                {tags.length > 0 ? (
                  tags.map((tag, index) => {
                    const tagName = getTagName(tag);

                    if (!tagName) {
                      return null;
                    }

                    const tagKey =
                      typeof tag === "object" && tag !== null
                        ? tag.id ?? tag.id_etiqueta ?? tagName
                        : tagName;

                    return (
                      <span
                        className="document-tag"
                        key={`${tagKey}-${index}`}
                      >
                        {tagName}
                      </span>
                    );
                  })
                ) : (
                  <span className="tags-empty">
                    Nenhuma etiqueta atribuída.
                  </span>
                )}
              </div>
            </section>
          </>
        )}

        <footer className="modal-actions">
          <button
            type="button"
            className={`modal-view-button cursor-pointer ${
              !canView || loading || Boolean(error) ? "disabled" : ""
            }`}
            aria-label="Visualizar"
            disabled={!canView || loading || Boolean(error)}
            onClick={handleView}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Visualizar
          </button>

          <button
            type="button"
            className="modal-edit-button cursor-pointer"
            title={canEdit ? "Editar documento" : "Edição bloqueada"}
            aria-label="Editar documento"
            disabled={!canEdit}
            onClick={handleEdit}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
            </svg>
            Editar
          </button>
        </footer>
      </div>
    </div>
  );
}