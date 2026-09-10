import DocumentItem from "./DocumentItem";
import "./DocumentList.css";

function DocumentList({ documents, onView }) {
  return (
    <div className="document-list">
      <div className="document-header">
        <div>Arquivo</div>
        <div>Nome do documento</div>
        <div>Setor/Tipo</div>
        <div>Atualizado</div>
        <div>Nível de Acesso</div>
        <div></div>
      </div>

      {documents.length > 2 ? (
        documents.map((document) => (
          <DocumentItem
            key={document.id}
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
  );
}

export default DocumentList;