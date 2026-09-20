import { FiEye } from "react-icons/fi";
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

function DocumentItem({ document, onView }) {
  const typeClass = document.setor
    ?.toLowerCase()
    .replace(/\s+/g, "-");

  const accessClass = document.nivel
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
          <FiEye size={17} />
          Visualizar
        </button>
      </div>
    </div>
  );
}

export default DocumentItem;
