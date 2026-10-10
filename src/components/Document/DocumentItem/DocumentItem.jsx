import { FiEye, FiLock } from "react-icons/fi";
import "./DocumentItem.css";

function formatarData(dataISO) {
  if (!dataISO) return "-";

  const data = new Date(dataISO);
  if (Number.isNaN(data.getTime())) return dataISO;

  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function DocumentItem({ document, onView, onOpenDetails }) {
  const isRestricted = document.acesso_permitido === false;

  const typeClass = document.setor
    ?.toLowerCase()
    .replace(/\s+/g, "-");

  const accessClass = document.nivel
    ?.toLowerCase()
    .replace(/\s+/g, "-");

  const handleCardClick = () => {
    if (onOpenDetails) {
      onOpenDetails(document);
    } else if (onView) {
      onView(document);
    }
  };

  const handleActionClick = (e) => {
    e.stopPropagation();

    if (isRestricted && onOpenDetails) {
      onOpenDetails(document);
      return;
    }

    if (onView) {
      onView(document);
    }
  };

  return (
    <div
      className={`document-item cursor-pointer ${
        isRestricted
          ? "document-restricted border-rose-100! hover:border-rose-300!"
          : ""
      }`}
      onClick={handleCardClick}
    >
      <div className="document-file">
        <span>{document.tipo_arquivo}</span>
      </div>

      <div className="document-name" title={document.nome}>
        {document.nome}
      </div>

      <div className="document-type">
        <span className={`type-badge type-${typeClass}`}>
          {document.setor}
        </span>
      </div>

      <div className="document-date">
        {formatarData(document.data_atualizacao)}
      </div>

      <div className="document-access">
        <span
          className={`access-badge access-${accessClass} ${
            isRestricted
              ? "access-restricted bg-rose-50! text-rose-700! border-rose-200!"
              : ""
          }`}
        >
          {isRestricted && (
            <FiLock
              className="access-lock-icon mr-1 text-rose-600 shrink-0"
              size={13}
              aria-hidden="true"
            />
          )}
          {document.nivel}
        </span>
      </div>

      <div className="document-action">
        <button
          type="button"
          className={`document-action-btn cursor-pointer ${
            isRestricted
              ? "action-locked bg-rose-50! text-rose-700! border-rose-200! hover:bg-rose-100!"
              : ""
          }`}
          onClick={handleActionClick}
          aria-label="Visualizar"
          title={
            isRestricted
              ? "Acesso Restrito - Clique para mais informações"
              : "Visualizar documento"
          }
        >
          <span className="sr-only">Visualizar</span>
          {isRestricted ? (
            <FiLock
              size={17}
              aria-hidden="true"
              data-testid="lock-icon"
            />
          ) : (
            <FiEye size={17} aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}

export default DocumentItem;