import { FiFileText, FiMessageCircle, FiUser } from "react-icons/fi";
import "./ChatMessage.css";

function getSourceId(source) {
  if (typeof source === "number") return source;
  if (typeof source === "string") return source;

  return (
    source?.id_documento ??
    source?.documento_id ??
    source?.documentId ??
    source?.id ??
    source?.pk ??
    source?.documento?.id_documento ??
    source?.documento?.id
  );
}

function getSourceName(source) {
  if (typeof source === "string" || typeof source === "number") {
    return `Documento ${source}`;
  }

  const document = source?.documento ?? source;
  return (
    document?.nome ??
    document?.titulo ??
    document?.title ??
    document?.nome_arquivo ??
    document?.name ??
    "Documento relacionado"
  );
}

function getSourceExcerpt(source) {
  if (!source || typeof source !== "object") return "";
  return (
    source.trecho ??
    source.trecho_relevante ??
    source.excerpt ??
    source.snippet ??
    source.documento?.trecho ??
    ""
  );
}

export function ChatSourceCard({ source, onOpen }) {
  const id = getSourceId(source);
  const document =
    source && typeof source === "object"
      ? source.documento ?? source
      : {};

  return (
    <button
      className="chat-source-card"
      type="button"
      onClick={() => onOpen?.({ ...document, id_documento: id })}
      aria-label={`Abrir documento: ${getSourceName(source)}`}
    >
      <span className="chat-source-icon" aria-hidden="true">
        <FiFileText size={18} />
      </span>
      <span className="chat-source-content">
        <strong>{getSourceName(source)}</strong>
        {getSourceExcerpt(source) && <span>{getSourceExcerpt(source)}</span>}
      </span>
      <span className="chat-source-action">Abrir</span>
    </button>
  );
}

export default function ChatMessage({ message, onOpenSource }) {
  const isUser = message.role === "user";

  return (
    <article
      className={`chat-message ${isUser ? "chat-message-user" : "chat-message-assistant"}${message.isError ? " chat-message-error" : ""}`}
      aria-label={isUser ? "Sua pergunta" : "Resposta do assistente"}
    >
      <div className="chat-message-avatar" aria-hidden="true">
        {isUser ? <FiUser size={17} /> : <FiMessageCircle size={18} />}
      </div>
      <div className="chat-message-body">
        <div className="chat-message-bubble">
          {!isUser && <span className="chat-message-author">Assistente IA</span>}
          <p>{message.content}</p>
        </div>
        {!isUser && message.sources?.length > 0 && (
          <section className="chat-sources" aria-label="Documentos relacionados">
            <h3>Fontes consultadas</h3>
            <div className="chat-source-list">
              {message.sources.map((source, index) => (
                <ChatSourceCard
                  key={`${getSourceId(source) ?? getSourceName(source)}-${index}`}
                  source={source}
                  onOpen={onOpenSource}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
