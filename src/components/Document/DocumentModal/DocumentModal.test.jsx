import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import DocumentModal from "./DocumentModal";

const documentData = {
  id_documento: 1,
  tipo_arquivo: "pdf",
  nome: "Manual de teste.pdf",
  setor: "Engenharia",
  data_atualizacao: "2026-09-20T12:00:00Z",
  nivel: "Publico",
  data: "http://localhost:8000/media/documentos/manual.pdf",
  etiquetas: [
    { id_etiqueta: 1, nome: "Tecnico" },
    { id_etiqueta: 2, nome: "Aprovado" },
  ],
};

function renderModal(props = {}) {
  return render(
    <DocumentModal
      document={documentData}
      onClose={vi.fn()}
      onViewPdf={vi.fn()}
      {...props}
    />
  );
}

describe("DocumentModal", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exibe os metadados e as etiquetas retornados pela API", () => {
    renderModal();

    expect(screen.getByText("Manual de teste.pdf")).toBeInTheDocument();
    expect(screen.getByText("Engenharia")).toBeInTheDocument();
    expect(screen.getByText("Publico")).toBeInTheDocument();
    expect(screen.getByText("Tecnico")).toBeInTheDocument();
    expect(screen.getByText("Aprovado")).toBeInTheDocument();
  });

  it("exibe o setor formatado no card de estatísticas", () => {
    renderModal({ document: { ...documentData, setor: "juridico" } });
    expect(screen.getByText("Jurídico")).toBeInTheDocument();
  });

  it("informa quando o documento nao possui etiquetas", () => {
    renderModal({ document: { ...documentData, etiquetas: [] } });
    expect(
      screen.getByText("Nenhuma etiqueta atribuída.")
    ).toBeInTheDocument();
  });

  it("fecha pelo botao e pelo clique no overlay, mas nao pelo conteudo", () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    fireEvent.click(screen.getByText("Manual de teste.pdf"));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText("Fechar"));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(
      globalThis.document.querySelector(".document-modal-overlay")
    );
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("encaminha o documento com a URL do PDF ao visualizar", () => {
    const onViewPdf = vi.fn();
    renderModal({ onViewPdf });

    fireEvent.click(screen.getByRole("button", { name: "Visualizar" }));
    expect(onViewPdf).toHaveBeenCalledWith(documentData);
  });

  it("desabilita a visualizacao sem URL de arquivo", () => {
    renderModal({ document: { ...documentData, data: "" } });

    expect(
      screen.getByRole("button", { name: "Visualizar" })
    ).toBeDisabled();
  });

  it("exibe o estado de carregamento", () => {
    renderModal({ loading: true });

    expect(
      screen.getByText("Carregando detalhes do documento...")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Manual de teste.pdf")
    ).not.toBeInTheDocument();
  });

  it("exibe o erro e permite tentar novamente", () => {
    const onRetry = vi.fn();
    renderModal({ error: "Falha ao carregar detalhes.", onRetry });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Falha ao carregar detalhes."
    );

    fireEvent.click(screen.getByText("Tentar novamente"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("não mostra botão Tentar novamente quando onRetry não é fornecido", () => {
    renderModal({ error: "x", onRetry: undefined });

    expect(screen.queryByText("Tentar novamente")).not.toBeInTheDocument();
  });

  it("permite fechar o modal durante o carregamento", () => {
    const onClose = vi.fn();
    renderModal({ loading: true, onClose });

    fireEvent.click(screen.getByLabelText("Fechar"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("nao renderiza nada sem documento", () => {
    const { container } = renderModal({ document: null });
    expect(container).toBeEmptyDOMElement();
  });

  it("usa o badge padrao quando o tipo de arquivo esta ausente", () => {
    renderModal({
      document: { ...documentData, tipo_arquivo: undefined },
    });
    expect(screen.getByText("ARQUIVO", { selector: ".modal-pdf-badge" })).toBeInTheDocument();
  });

  it("formata a data de atualizacao e trata valores invalidos", () => {
    renderModal({
      document: {
        ...documentData,
        data_atualizacao: "2026-01-05T10:00:00Z",
      },
    });
    expect(screen.getByText("05/01/2026")).toBeInTheDocument();

    renderModal({
      document: { ...documentData, data_atualizacao: "data-invalida" },
    });
    expect(screen.getByText("data-invalida")).toBeInTheDocument();

    renderModal({
      document: { ...documentData, data_atualizacao: "" },
    });
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("fecha pelo clique no overlay mesmo em estado de erro", () => {
    const onClose = vi.fn();
    renderModal({ error: "Falha", onClose });

    fireEvent.click(
      globalThis.document.querySelector(".document-modal-overlay")
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("exibe badge e indicador visual de acesso bloqueado quando acesso_permitido e false", () => {
    renderModal({
      document: { ...documentData, acesso_permitido: false },
    });

    expect(screen.getByText("Acesso Bloqueado")).toBeInTheDocument();
    expect(
      screen.getByText("Documento com Acesso Restrito")
    ).toBeInTheDocument();
  });

  it("exibe badge de acesso liberado quando acesso_permitido e true", () => {
    renderModal({
      document: { ...documentData, acesso_permitido: true },
    });
    expect(screen.getByText("Acesso Liberado")).toBeInTheDocument();
  });

  it("desabilita o botão de editar quando o documento é restrito", () => {
    renderModal({
      document: { ...documentData, acesso_permitido: false },
    });

    const editButton = screen.getByRole("button", {
      name: /editar documento/i,
    });
    expect(editButton).toBeDisabled();
    expect(editButton).toHaveAttribute("title", "Edição bloqueada");
  });

  it("mantém o botão de editar habilitado quando o documento é liberado", () => {
    renderModal({
      document: { ...documentData, acesso_permitido: true },
    });

    const editButton = screen.getByRole("button", {
      name: /editar documento/i,
    });
    expect(editButton).not.toBeDisabled();
  });

  it("fecha ao pressionar Escape no modal", () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("não fecha ao pressionar outras teclas", () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Enter" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("chama onView quando não há onViewPdf", () => {
    const onView = vi.fn();
    renderModal({ onViewPdf: undefined, onView });

    fireEvent.click(screen.getByRole("button", { name: "Visualizar" }));
    expect(onView).toHaveBeenCalledWith(
      expect.objectContaining({ arquivo_url: documentData.data })
    );
  });

  it("abre window.open quando não há onViewPdf nem onView", () => {
    const windowOpen = vi.spyOn(window, "open").mockImplementation(() => {});
    renderModal({ onViewPdf: undefined, onView: undefined });

    fireEvent.click(screen.getByRole("button", { name: "Visualizar" }));
    expect(windowOpen).toHaveBeenCalledWith(
      documentData.data,
      "_blank",
      "noopener,noreferrer"
    );
  });

  it("não chama onView nem window.open quando doc é restrito e sem onViewPdf", () => {
    const onView = vi.fn();
    const windowOpen = vi.spyOn(window, "open").mockImplementation(() => {});
    renderModal({
      onViewPdf: undefined,
      onView,
      document: { ...documentData, acesso_permitido: false },
    });

    fireEvent.click(screen.getByRole("button", { name: "Visualizar" }));
    expect(onView).not.toHaveBeenCalled();
    expect(windowOpen).not.toHaveBeenCalled();
  });

  it("chama onEdit ao clicar em Editar", () => {
    const onEdit = vi.fn();
    renderModal({ onEdit });

    fireEvent.click(
      screen.getByRole("button", { name: "Editar documento" })
    );
    expect(onEdit).toHaveBeenCalledWith(documentData);
  });

  it("não chama onEdit quando documento é restrito", () => {
    const onEdit = vi.fn();
    renderModal({
      onEdit,
      document: { ...documentData, acesso_permitido: false },
    });

    const editButton = screen.getByRole("button", {
      name: "Editar documento",
    });
    expect(editButton).toBeDisabled();
    fireEvent.click(editButton);
    expect(onEdit).not.toHaveBeenCalled();
  });

  it("não quebra quando onEdit não é fornecido", () => {
    renderModal({ onEdit: undefined });

    const editButton = screen.getByRole("button", {
      name: "Editar documento",
    });
    expect(editButton).not.toBeDisabled();
    fireEvent.click(editButton);
  });

  it("exibe 'Não informado' quando descrição está ausente", () => {
    renderModal({
      document: {
        ...documentData,
        descricao: null,
        observacao: null,
        observacoes: null,
      },
    });
    // descrição e nível podem aparecer como "Não informado" ao mesmo tempo;
    // verifica que o bloco de descrição está com o texto esperado.
    const description = globalThis.document.querySelector(
      ".document-description"
    );
    expect(description).toHaveTextContent("Não informado");
  });

  it("exibe 'Não informado' quando nível está ausente", () => {
    renderModal({ document: { ...documentData, nivel: undefined } });

    // Procura "Não informado" especificamente no stat-value do nível
    const levelCard = screen.getByText("Nível de acesso").closest(".modal-stat-card");
    const levelValue = levelCard.querySelector(".stat-value");
    expect(levelValue).toHaveTextContent("Não informado");
  });

  it("usa document.tags quando etiquetas não estão presentes", () => {
    renderModal({
      document: {
        ...documentData,
        etiquetas: undefined,
        tags: [{ id: 1, nome: "via-tags" }],
      },
    });
    expect(screen.getByText("via-tags")).toBeInTheDocument();
  });

  it("ignora etiquetas sem nome válido", () => {
    renderModal({
      document: {
        ...documentData,
        etiquetas: [{ id: 1 }, { nome: "válida" }],
      },
    });
    expect(screen.getByText("válida")).toBeInTheDocument();
  });

  it("usa titulo quando nome não está presente", () => {
    renderModal({
      document: { ...documentData, nome: undefined, titulo: "Titulo.pdf" },
    });
    expect(screen.getByText("Titulo.pdf")).toBeInTheDocument();
  });

  it("usa nome_arquivo quando nome e titulo não estão presentes", () => {
    renderModal({
      document: {
        ...documentData,
        nome: undefined,
        titulo: undefined,
        nome_arquivo: "Nome_arquivo.pdf",
      },
    });
    expect(screen.getByText("Nome_arquivo.pdf")).toBeInTheDocument();
  });

  it("usa arquivo_nome quando os demais estão ausentes", () => {
    renderModal({
      document: {
        ...documentData,
        nome: undefined,
        titulo: undefined,
        nome_arquivo: undefined,
        arquivo_nome: "arquivo_nome.pdf",
      },
    });
    expect(screen.getByText("arquivo_nome.pdf")).toBeInTheDocument();
  });

  it("usa 'Documento sem título' quando nenhum nome está presente", () => {
    renderModal({
      document: {
        ...documentData,
        nome: undefined,
        titulo: undefined,
        nome_arquivo: undefined,
        arquivo_nome: undefined,
      },
    });
    expect(screen.getByText("Documento sem título")).toBeInTheDocument();
  });

  it("remove prefixo '.' do tipo de arquivo", () => {
    renderModal({
      document: { ...documentData, tipo_arquivo: ".docx" },
    });
    expect(screen.getByText("DOCX", { selector: ".modal-pdf-badge" })).toBeInTheDocument();
  });

  it("usa extensao quando tipo_arquivo está ausente", () => {
    renderModal({
      document: { ...documentData, tipo_arquivo: undefined, extensao: "xlsx" },
    });
    expect(screen.getByText("XLSX", { selector: ".modal-pdf-badge" })).toBeInTheDocument();
  });

  it("usa ARQUIVO quando tipo_arquivo é string vazia", () => {
    renderModal({
      document: { ...documentData, tipo_arquivo: "   " },
    });
    expect(screen.getByText("ARQUIVO", { selector: ".modal-pdf-badge" })).toBeInTheDocument();
  });

  it("usa url_arquivo quando arquivo_url está ausente", () => {
    renderModal({
      document: {
        ...documentData,
        arquivo_url: undefined,
        url_arquivo: "https://example.com/b.pdf",
      },
    });
    expect(
      screen.getByRole("button", { name: "Visualizar" })
    ).not.toBeDisabled();
  });

  it("usa arquivo como objeto com url", () => {
    renderModal({
      document: {
        ...documentData,
        arquivo_url: undefined,
        data: undefined,
        arquivo: { url: "https://example.com/c.pdf" },
      },
    });
    expect(
      screen.getByRole("button", { name: "Visualizar" })
    ).not.toBeDisabled();
  });

  it("usa arquivo como string", () => {
    renderModal({
      document: {
        ...documentData,
        arquivo_url: undefined,
        data: undefined,
        arquivo: "https://example.com/d.pdf",
      },
    });
    expect(
      screen.getByRole("button", { name: "Visualizar" })
    ).not.toBeDisabled();
  });

  it("usa file_url quando demais estão ausentes", () => {
    renderModal({
      document: {
        ...documentData,
        arquivo_url: undefined,
        url_arquivo: undefined,
        arquivo: undefined,
        url: undefined,
        file_url: "https://example.com/e.pdf",
      },
    });
    expect(
      screen.getByRole("button", { name: "Visualizar" })
    ).not.toBeDisabled();
  });

  it("usa url quando demais estão ausentes", () => {
    renderModal({
      document: {
        ...documentData,
        arquivo_url: undefined,
        url_arquivo: undefined,
        arquivo: undefined,
        url: "https://example.com/f.pdf",
      },
    });
    expect(
      screen.getByRole("button", { name: "Visualizar" })
    ).not.toBeDisabled();
  });

  it("desabilita Visualizar quando erro presente", () => {
    renderModal({ error: "Algo" });

    expect(
      screen.getByRole("button", { name: "Visualizar" })
    ).toBeDisabled();
  });

  it("desabilita Visualizar durante loading", () => {
    renderModal({ loading: true });

    expect(
      screen.getByRole("button", { name: "Visualizar" })
    ).toBeDisabled();
  });
});