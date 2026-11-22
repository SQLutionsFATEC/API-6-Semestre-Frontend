import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "./api";
import { sendChatMessage } from "./chatService";

vi.mock("./api", () => ({
  default: { post: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("sendChatMessage", () => {
  it("envia a pergunta no campo context sem timeout para o endpoint autenticado", async () => {
    const payload = {
      response: "Resposta baseada nos documentos.",
      documents: [],
    };
    vi.mocked(api.post).mockResolvedValue({ data: payload });

    await expect(
      sendChatMessage("  Onde está o procedimento?  ")
    ).resolves.toEqual(payload);

    expect(api.post).toHaveBeenCalledWith(
      "/api/chat/",
      { context: ["Onde está o procedimento?"] },
      { timeout: 0 }
    );
  });

  it("inclui o histórico válido da conversa e ignora turnos com erro", async () => {
    const payload = {
      response: "Segunda resposta do RAG.",
      documents: [{ id_documento: 10, nome: "FAR-25.pdf", conteudo: "Trecho" }],
    };
    vi.mocked(api.post).mockResolvedValue({ data: payload });

    const history = [
      { role: "user", content: "Primeira pergunta" },
      { role: "assistant", content: "Primeira resposta" },
      { role: "user", content: "Pergunta que falhou" },
      { role: "assistant", content: "Erro temporário", isError: true },
      "Mensagem avulsa",
    ];

    await expect(
      sendChatMessage("Segunda pergunta", history)
    ).resolves.toEqual(payload);

    expect(api.post).toHaveBeenCalledWith(
      "/api/chat/",
      {
        context: [
          "Primeira pergunta",
          "Primeira resposta",
          "Mensagem avulsa",
          "Segunda pergunta",
        ],
      },
      { timeout: 0 }
    );
  });

  it("aceita diretamente uma lista de mensagens como contexto", async () => {
    const payload = { response: "Resposta", documents: [] };
    vi.mocked(api.post).mockResolvedValue({ data: payload });

    await sendChatMessage(["  Pergunta 1 ", "", "Resposta 1", "Pergunta 2"]);

    expect(api.post).toHaveBeenCalledWith(
      "/api/chat/",
      { context: ["Pergunta 1", "Resposta 1", "Pergunta 2"] },
      { timeout: 0 }
    );
  });
});
