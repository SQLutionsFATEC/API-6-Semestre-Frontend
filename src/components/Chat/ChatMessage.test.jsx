import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ChatMessage from "./ChatMessage";

describe("ChatMessage", () => {
  it("renderiza mensagens do usuário e respostas de erro sem fontes", () => {
    const { rerender } = render(
      <ChatMessage message={{ role: "user", content: "Minha pergunta" }} />
    );

    expect(screen.getByRole("article", { name: "Sua pergunta" })).toHaveClass(
      "chat-message-user"
    );
    expect(screen.getByText("Minha pergunta")).toBeInTheDocument();
    expect(screen.queryByText("Assistente IA")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Documentos relacionados" })
    ).not.toBeInTheDocument();

    rerender(
      <ChatMessage
        message={{ role: "assistant", content: "Falha ao responder", isError: true }}
      />
    );

    expect(
      screen.getByRole("article", { name: "Resposta do assistente" })
    ).toHaveClass("chat-message-assistant", "chat-message-error");
    expect(screen.getByText("Assistente IA")).toBeInTheDocument();
    expect(screen.getByText("Falha ao responder")).toBeInTheDocument();
  });

  it("renderiza fontes com os formatos suportados e abre o documento normalizado", () => {
    const onOpenSource = vi.fn();
    const sources = [
      42,
      "DOC-7",
      { id_documento: 1, nome: "Nome", trecho: "Trecho principal" },
      {
        documento_id: 2,
        titulo: "Título",
        trecho_relevante: "Trecho relevante",
      },
      { documentId: 3, title: "Title", excerpt: "Excerpt" },
      { id: 4, nome_arquivo: "Arquivo.pdf", snippet: "Snippet" },
      { pk: 5, name: "Name" },
      {
        documento: {
          id_documento: 6,
          nome: "Documento aninhado",
          trecho: "Trecho aninhado",
        },
      },
      { documento: { id: 7, titulo: "Documento com id aninhado" } },
      {},
      null,
      { trecho: "", trecho_relevante: "" },
    ];

    render(
      <ChatMessage
        message={{ role: "assistant", content: "Resposta", sources }}
        onOpenSource={onOpenSource}
      />
    );

    expect(screen.getByRole("heading", { name: "Fontes consultadas" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Abrir documento:/ })).toHaveLength(
      sources.length
    );
    [
      "Documento 42",
      "Documento DOC-7",
      "Nome",
      "Título",
      "Title",
      "Arquivo.pdf",
      "Name",
      "Documento aninhado",
      "Documento com id aninhado",
    ].forEach((name) => expect(screen.getByText(name)).toBeInTheDocument());
    expect(screen.getAllByText("Documento relacionado")).toHaveLength(3);
    [
      "Trecho principal",
      "Trecho relevante",
      "Excerpt",
      "Snippet",
      "Trecho aninhado",
    ].forEach((excerpt) => expect(screen.getByText(excerpt)).toBeInTheDocument());
    expect(screen.queryByText("", { selector: ".chat-source-content span" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Abrir documento: Documento aninhado" }));
    expect(onOpenSource).toHaveBeenCalledWith({
      id_documento: 6,
      nome: "Documento aninhado",
      trecho: "Trecho aninhado",
    });

    fireEvent.click(screen.getByRole("button", { name: "Abrir documento: Documento 42" }));
    expect(onOpenSource).toHaveBeenLastCalledWith({ id_documento: 42 });
  });

  it("não renderiza fontes para uma lista vazia e permite abrir fonte sem callback", () => {
    const { rerender } = render(
      <ChatMessage message={{ role: "assistant", content: "Sem fontes", sources: [] }} />
    );

    expect(
      screen.queryByRole("region", { name: "Documentos relacionados" })
    ).not.toBeInTheDocument();

    rerender(
      <ChatMessage
        message={{ role: "assistant", content: "Com fonte", sources: [{ id: 9, name: "Anexo" }] }}
      />
    );

    expect(() =>
      fireEvent.click(screen.getByRole("button", { name: "Abrir documento: Anexo" }))
    ).not.toThrow();
  });
});