import { useEffect, useRef, useState } from "react";
import {
  FiLock,
  FiMessageCircle,
  FiSearch,
  FiZap,
} from "react-icons/fi";

import DocumentModal from "../../components/Document/DocumentModal/DocumentModal";
import ChatMessage from "../../components/Chat/ChatMessage";
import { fetchDocumentById } from "../../services/documentService";
import { sendChatMessage } from "../../services/chatService";
import "./Chat.css";

const SUGGESTED_QUESTIONS = [
  "Quais os critérios da norma FAR 25 para fadiga e compósitos da asa?",
  "Como foi tratada a delaminação detectada no relatório de qualidade?",
  "Quais são os requisitos de anonimização e LGPD exigidos em contratos?",
  "Quais as especificações de ciclo de vida do trem de pouso?",
];

function normalizeResponse(payload) {
  const response = payload && typeof payload === "object" ? payload : {};
  const content =
    response.resposta ??
    response.answer ??
    response.response ??
    response.mensagem ??
    response.message ??
    (typeof payload === "string" ? payload : "");
  const sourceList =
    response.fontes ??
    response.documentos ??
    response.sources ??
    response.references ??
    response.referencias ??
    [];

  return {
    content:
      typeof content === "string" && content.trim()
        ? content
        : "Não encontrei uma resposta nos documentos disponíveis para o seu perfil.",
    sources: Array.isArray(sourceList) ? sourceList : [],
  };
}

function ChatLoadingState() {
  return (
    <div className="chat-loading" role="status" aria-live="polite">
      <div className="chat-loading-label">
        <FiMessageCircle size={17} />
        Buscando informações nos documentos mapeados para o seu perfil...
      </div>
      <p className="chat-loading-caption">
        Identificando documentos relacionados e preparando a resposta.
      </p>
      {[0, 1, 2].map((item) => (
        <div className="chat-skeleton-card" key={item} aria-hidden="true">
          <span className="chat-skeleton-icon" />
          <span className="chat-skeleton-lines">
            <span className="chat-skeleton-line" />
            <span className="chat-skeleton-line" />
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Chat() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [documentError, setDocumentError] = useState(null);
  const messageId = useRef(0);
  const detailRequestId = useRef(0);
  const conversationEndRef = useRef(null);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [messages, loading]);

  async function submitQuestion(value = question) {
    const trimmedQuestion = value.trim();
    if (!trimmedQuestion || loading) return;

    setQuestion("");
    setMessages((current) => [
      ...current,
      {
        id: ++messageId.current,
        role: "user",
        content: trimmedQuestion,
      },
    ]);
    setLoading(true);

    try {
      const payload = await sendChatMessage(trimmedQuestion);
      const answer = normalizeResponse(payload);
      setMessages((current) => [
        ...current,
        {
          id: ++messageId.current,
          role: "assistant",
          ...answer,
        },
      ]);
    } catch (error) {
      console.error("Erro ao consultar o assistente:", error);
      setMessages((current) => [
        ...current,
        {
          id: ++messageId.current,
          role: "assistant",
          content:
            "Não foi possível consultar os documentos agora. Tente novamente em instantes.",
          sources: [],
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    void submitQuestion();
  }

  async function loadDocumentDetails(document) {
    const requestId = ++detailRequestId.current;
    const documentId =
      document?.id_documento ?? document?.documento_id ?? document?.id ?? document?.pk;
    const initialDocument = {
      ...((document && typeof document === "object") ? document : {}),
      ...(documentId !== undefined ? { id_documento: documentId } : {}),
    };

    setSelectedDocument(initialDocument);
    setDocumentError(null);

    if (documentId === undefined || documentId === null || documentId === "") {
      setDocumentLoading(false);
      return;
    }

    setDocumentLoading(true);
    try {
      const details = await fetchDocumentById(documentId);
      if (requestId === detailRequestId.current) {
        setSelectedDocument({ ...initialDocument, ...details });
      }
    } catch (error) {
      console.error("Erro ao carregar documento citado:", error);
      if (requestId === detailRequestId.current) {
        setDocumentError("Não foi possível carregar os detalhes do documento.");
      }
    } finally {
      if (requestId === detailRequestId.current) {
        setDocumentLoading(false);
      }
    }
  }

  function closeDocumentModal() {
    detailRequestId.current += 1;
    setSelectedDocument(null);
    setDocumentLoading(false);
    setDocumentError(null);
  }

  return (
    <main className="chat-page">
      <header className="chat-page-header">
        <FiZap className="chat-page-header-icon" size={23} aria-hidden="true" />
        <h1>Chat</h1>
      </header>

      <section className="chat-query-panel" aria-label="Pergunte aos documentos">
        <form className="chat-query-form" onSubmit={handleSubmit}>
          <FiSearch className="chat-query-icon" size={17} aria-hidden="true" />
          <input
            aria-label="Sua pergunta"
            autoComplete="off"
            disabled={loading}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Pergunte sobre normas, procedimentos ou relatórios..."
            value={question}
          />
          <button
            className="chat-submit-button"
            type="submit"
            disabled={!question.trim() || loading}
            aria-label="Enviar pergunta"
            title="Enviar pergunta"
          >
            <FiZap size={17} aria-hidden="true" />
          </button>
        </form>
        <p className="chat-privacy-note">
          <FiLock size={12} aria-hidden="true" />
          A IA busca apenas nos documentos aos quais o seu perfil tem acesso.
        </p>
      </section>

      <section className="chat-conversation" aria-label="Conversa com o assistente">
        {messages.length === 0 ? (
          <div className="chat-empty-state">
            <div className="chat-empty-icon" aria-hidden="true">
              <FiMessageCircle size={31} />
            </div>
            <h2>Como posso te ajudar?</h2>
            <p>
              Descreva a informação que você precisa. A inteligência artificial
              fará o cruzamento entre manuais, normas e relatórios técnicos.
            </p>
            <div className="chat-suggestions" aria-label="Sugestões de perguntas">
              {SUGGESTED_QUESTIONS.map((suggestion) => (
                <button
                  className="chat-suggestion"
                  key={suggestion}
                  type="button"
                  disabled={loading}
                  onClick={() => void submitQuestion(suggestion)}
                >
                  <FiMessageCircle size={15} aria-hidden="true" />
                  <span>{suggestion}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="chat-message-list" aria-live="polite">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onOpenSource={loadDocumentDetails}
              />
            ))}
            {loading && <ChatLoadingState />}
            <div ref={conversationEndRef} />
          </div>
        )}
      </section>

      {selectedDocument && (
        <DocumentModal
          document={selectedDocument}
          loading={documentLoading}
          error={documentError}
          onClose={closeDocumentModal}
          onRetry={() => void loadDocumentDetails(selectedDocument)}
        />
      )}
    </main>
  );
}
