import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Chat from "./Chat";
import { sendChatMessage } from "../../services/chatService";
import { fetchDocumentById } from "../../services/documentService";

vi.mock("../../services/chatService", () => ({
  sendChatMessage: vi.fn(),
}));

vi.mock("../../services/documentService", () => ({
  fetchDocumentById: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Chat", () => {
  it("mostra o estado inicial e sugestões de perguntas", () => {
    render(<Chat />);

    expect(screen.getByRole("heading", { name: "Chat" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Como posso te ajudar?" })
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button").filter((button) =>
      button.classList.contains("chat-suggestion")
    )).toHaveLength(4);
    expect(
      screen.getByText(/apenas nos documentos aos quais o seu perfil tem acesso/i)
    ).toBeInTheDocument();
  });

  it("envia a pergunta e renderiza a resposta e suas fontes", async () => {
    vi.mocked(sendChatMessage).mockResolvedValue({
      resposta: "A norma aborda ensaios de fadiga em estruturas.",
      documentos: [
        {
          id_documento: 23,
          nome: "Norma FAR 25.pdf",
          trecho: "Requisitos para fadiga e integridade estrutural.",
        },
      ],
    });

    render(<Chat />);
    fireEvent.change(screen.getByRole("textbox", { name: "Sua pergunta" }), {
      target: { value: "O que diz a FAR 25 sobre fadiga?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar pergunta" }));

    expect(
      await screen.findByText("A norma aborda ensaios de fadiga em estruturas.")
    ).toBeInTheDocument();
    expect(sendChatMessage).toHaveBeenCalledWith(
      "O que diz a FAR 25 sobre fadiga?"
    );
    expect(screen.getByText("Norma FAR 25.pdf")).toBeInTheDocument();
    expect(screen.getByText(/Requisitos para fadiga/)).toBeInTheDocument();
  });

  it("abre o modal de detalhes ao selecionar um documento citado", async () => {
    vi.mocked(sendChatMessage).mockResolvedValue({
      resposta: "Veja o documento relacionado.",
      fontes: [{ id_documento: 23, nome: "Norma FAR 25.pdf" }],
    });
    vi.mocked(fetchDocumentById).mockResolvedValue({
      id_documento: 23,
      nome: "Norma FAR 25.pdf",
      tipo_arquivo: "pdf",
      setor: "Engenharia",
      nivel: "Básico",
      data: "https://example.test/norma.pdf",
      acesso_permitido: true,
      etiquetas: [],
    });

    render(<Chat />);
    fireEvent.change(screen.getByRole("textbox", { name: "Sua pergunta" }), {
      target: { value: "Encontre a norma." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar pergunta" }));

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Abrir documento: Norma FAR 25.pdf",
      })
    );

    expect(await screen.findByText("Engenharia")).toBeInTheDocument();
    expect(fetchDocumentById).toHaveBeenCalledWith(23);
    expect(screen.getByRole("dialog", { name: "Detalhes do documento" })).toBeInTheDocument();
  });

  it("mostra uma mensagem de erro quando a consulta falha", async () => {
    vi.mocked(sendChatMessage).mockRejectedValue(new Error("offline"));

    render(<Chat />);
    fireEvent.change(screen.getByRole("textbox", { name: "Sua pergunta" }), {
      target: { value: "Pergunta para testar erro" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar pergunta" }));

    expect(
      await screen.findByText(/Não foi possível consultar os documentos agora/)
    ).toBeInTheDocument();
  });
});
