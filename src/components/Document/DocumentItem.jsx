import "./DocumentItem.css";

function formatarData(dataISO) {
  if (!dataISO) return "-";

  const data = new Date(dataISO);
  if (isNaN(data.getTime())) return dataISO;

  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function DocumentItem({ document, onView }) {
  const typeClass = document.type
    ?.toLowerCase()
    .replace(/\s+/g, "-");

  const accessClass = document.accessLevel
    ?.toLowerCase()
    .replace(/\s+/g, "-");

  return (
    <div className="document-item">
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
        <span className={`access-badge access-${accessClass}`}>
          {document.nivel}
        </span>
      </div>

      <div className="document-action">
        <button onClick={() => onView(document)}>
          <svg
            width="17"
            height="17"
            viewBox="0 0 27 27"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2 12C2 12 5.5 5 12 5C18.5 5 22 12 22 12C22 12 18.5 19 12 19C5.5 19 2 12 2 12Z"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <circle
              cx="12"
              cy="12"
              r="3"
              stroke="currentColor"
              strokeWidth="1.8"
            />
          </svg>
          Visualizar
        </button>
      </div>
    </div>
  );
}

export default DocumentItem;