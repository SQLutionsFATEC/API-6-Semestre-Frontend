import { FiFile, FiFileText, FiFolder, FiCalendar, FiShield } from "react-icons/fi";
import DocumentItem from "../DocumentItem/DocumentItem";
import "./DocumentList.css";

function DocumentList({ documents, onView }) {
  return (
    <div className="document-list">
      <div className="document-list-header">
        <div className="document-header">
          <div className="col-header col-file">
            <FiFile size={13} />
            <span>Arquivo</span>
          </div>
          <div className="col-header col-name">
            <FiFileText size={13} />
            <span>Nome do documento</span>
          </div>
          <div className="col-header col-type">
            <FiFolder size={13} />
            <span>Setor/Tipo</span>
          </div>
          <div className="col-header col-date">
            <FiCalendar size={13} />
            <span>Atualizado</span>
          </div>
          <div className="col-header col-access">
            <FiShield size={13} />
            <span>Nível de Acesso</span>
          </div>
          <div className="col-action"></div>
        </div>
      </div>

      <div className="document-list-content">
        {documents.length > 0 ? (
          documents.map((document) => (
            <DocumentItem
              key={document.id_documento}
              document={document}
              onView={onView}
            />
          ))
        ) : (
          <div className="empty-list">
            Nenhum documento encontrado.
          </div>
        )}
      </div>
    </div>
  );
}

export default DocumentList;
