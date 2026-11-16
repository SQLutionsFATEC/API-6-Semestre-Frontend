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
    <div className="chat-loading ml-[46px] mt-[3px] w-[min(calc(100%-46px),690px)] max-[640px]:ml-[38px] max-[640px]:w-[calc(100%-38px)]" role="status" aria-live="polite">
      <div className="chat-loading-label mb-[11px] inline-flex items-center gap-2 rounded-[10px] border border-[#e6edf7] bg-white px-[14px] py-[11px] text-[12px] font-semibold text-[#3c4c65]">
        <FiMessageCircle className="animate-pulse text-[#2867f5] motion-reduce:animate-none" size={17} />
        Buscando informações nos documentos mapeados para o seu perfil...
      </div>
      <p className="chat-loading-caption mb-[10px] text-[10px] text-[#8a98ad]">
        Identificando documentos relacionados e preparando a resposta.
      </p>
      {[0, 1, 2].map((item) => (
        <div className="chat-skeleton-card mb-[9px] flex min-h-[60px] items-center gap-[13px] rounded-[11px] border border-[#e3eaf4] bg-white/85 p-[10px]" key={item} aria-hidden="true">
          <span className="chat-skeleton-icon h-[38px] w-[38px] shrink-0 animate-pulse rounded-[9px] bg-[#edf1f8] motion-reduce:animate-none" />
          <span className="chat-skeleton-lines grid flex-1 gap-[7px]">
            <span className="chat-skeleton-line h-2 w-[min(64%,280px)] animate-pulse rounded-full bg-[#edf1f8] motion-reduce:animate-none" />
            <span className="chat-skeleton-line h-2 w-[min(38%,170px)] animate-pulse rounded-full bg-[#edf1f8] motion-reduce:animate-none" />
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
    <main className="chat-page flex min-h-[calc(100vh-64px)] w-full max-w-[1120px] flex-col mx-auto text-[#26344a] max-[640px]:min-h-[calc(100vh-48px)]">
      <header className="chat-page-header mb-[17px] flex items-center gap-3">
        <FiZap className="chat-page-header-icon text-[#83002f]" size={23} aria-hidden="true" />
        <h1 className="m-0 text-[clamp(24px,3vw,30px)] font-extrabold tracking-[-0.035em] text-[#71002a]">Chat</h1>
      </header>

      <section className="chat-query-panel rounded-2xl border border-[#e7edf5] bg-white/90 p-[17px] shadow-[0_7px_22px_rgb(36_57_88_/_5%)] max-[640px]:p-3" aria-label="Pergunte aos documentos">
        <form className="chat-query-form flex min-h-[46px] items-center gap-[9px] rounded-[11px] border border-[#dce5f1] bg-white py-1 px-[5px] pl-[13px] transition-[border-color,box-shadow] duration-150 focus-within:border-[#95b5ff] focus-within:shadow-[0_0_0_3px_rgb(37_99_235_/_9%)]" onSubmit={handleSubmit}>
          <FiSearch className="chat-query-icon shrink-0 text-[#8da0ba]" size={17} aria-hidden="true" />
          <input
            className="h-9 min-w-0 flex-1 border-0 bg-transparent text-[13px] text-[#26364f] outline-none placeholder:text-[#8998ad]"
            aria-label="Sua pergunta"
            autoComplete="off"
            disabled={loading}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Pergunte sobre normas, procedimentos ou relatórios..."
            value={question}
          />
          <button
            className="chat-submit-button grid h-9 w-9 shrink-0 place-items-center rounded-[9px] border-0 bg-[#2867f5] text-white shadow-[0_3px_8px_rgb(37_99_235_/_20%)] transition-[background,transform] duration-150 hover:-translate-y-px hover:bg-[#1452df] disabled:cursor-not-allowed disabled:opacity-55"
            type="submit"
            disabled={!question.trim() || loading}
            aria-label="Enviar pergunta"
            title="Enviar pergunta"
          >
            <FiZap size={17} aria-hidden="true" />
          </button>
        </form>
        <p className="chat-privacy-note mt-[10px] flex items-center gap-[6px] text-[10px] leading-[1.5] text-[#8290a5] max-[640px]:items-start">
          <FiLock className="shrink-0 text-[#7e94b4]" size={12} aria-hidden="true" />
          A IA busca apenas nos documentos aos quais o seu perfil tem acesso.
        </p>
      </section>

      <section className="chat-conversation w-full flex-1 px-0 pt-7 pb-3 max-[640px]:pt-5" aria-label="Conversa com o assistente">
        {messages.length === 0 ? (
          <div className="chat-empty-state flex min-h-[clamp(300px,53vh,500px)] flex-col items-center justify-center px-[10px] pt-5 pb-[34px] text-center">
            <div className="chat-empty-icon mb-[15px] grid h-[70px] w-[70px] place-items-center rounded-[22px] border border-[#e5edfc] bg-[linear-gradient(145deg,#f4f8ff,#eaf2ff)] text-[#2867f5] shadow-[0_10px_24px_rgb(37_99_235_/_7%)]" aria-hidden="true">
              <FiMessageCircle size={31} />
            </div>
            <h2 className="mb-[7px] mt-0 text-[clamp(19px,2.4vw,22px)] font-extrabold tracking-[-0.025em] text-[#74002c]">Como posso te ajudar?</h2>
            <p className="m-0 max-w-[560px] text-[13px] leading-[1.65] text-[#718096]">
              Descreva a informação que você precisa. A inteligência artificial
              fará o cruzamento entre manuais, normas e relatórios técnicos.
            </p>
            <div className="chat-suggestions mt-[23px] grid w-full max-w-[660px] grid-cols-2 gap-[11px] text-left max-[640px]:mt-[18px] max-[640px]:grid-cols-1 max-[640px]:gap-2" aria-label="Sugestões de perguntas">
              {SUGGESTED_QUESTIONS.map((suggestion) => (
                <button
                  className="chat-suggestion flex min-h-[62px] items-start gap-3 rounded-[11px] border border-[#e2eaf5] bg-white px-[14px] py-[13px] text-left text-[11px] leading-[1.55] text-[#3e506b] transition-[border-color,background,transform] duration-150 hover:-translate-y-px hover:border-[#bfd1f7] hover:bg-[#fbfdff] disabled:cursor-wait disabled:opacity-65 max-[640px]:min-h-[52px]"
                  key={suggestion}
                  type="button"
                  disabled={loading}
                  onClick={() => void submitQuestion(suggestion)}
                >
                  <FiMessageCircle className="mt-px shrink-0 text-[#2867f5]" size={15} aria-hidden="true" />
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
