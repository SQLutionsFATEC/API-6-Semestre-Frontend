import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Home from "./Home";
import { fetchDocumentById, fetchDocuments } from "../../services/documentService";

vi.mock("../../services/documentService", () => ({
  fetchDocuments: vi.fn(),
  fetchDocumentById: vi.fn(),
}));

const documentsPage = {
  results: [
    {
      id_documento: 1,
      tipo_arquivo: "pdf",
      nome: "Manual do sistema.pdf",
      setor: "Engenharia",
      data_atualizacao: "2026-09-20T12:00:00Z",
      nivel: "Publico",
    },
    {
      id_documento: 2,
      tipo_arquivo: "docx",
      nome: "Ata de reuniao.docx",
      setor: "Administrativo",
      data_atualizacao: "2026-08-01T09:00:00Z",
      nivel: "Interno",
    },
  ],
  pages: 2,
};

const documentDetail = {
  id_documento: 1,
  nome: "Manual do sistema.pdf",
  tipo_arquivo: "pdf",
  setor: "Engenharia",
  data_atualizacao: "2026-09-20T12:00:00Z",
  nivel: "Publico",
  data: "http://localhost:8000/media/documentos/manual.pdf",
  etiquetas: [{ id_etiqueta: 1, nome: "Tecnico" }],
};

function getModal() {
  return globalThis.document.querySelector(".document-modal");
}

function openFirstDocument() {
  fireEvent.click(screen.getAllByRole("button", { name: "Visualizar" })[0]);
}

beforeEach(() => {
  vi.mocked(fetchDocuments).mockResolvedValue(documentsPage);
  vi.mocked(fetchDocumentById).mockResolvedValue(documentDetail);
});

describe("Home", () => {
  it("carrega e exibe a lista de documentos", async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Manual do sistema.pdf")).toBeInTheDocument();
    });
    expect(screen.getByText("Ata de reuniao.docx")).toBeInTheDocument();
    expect(fetchDocuments).toHaveBeenCalledWith({ nome: "", page: 1 });
  });

  it("exibe mensagem de erro quando a busca falha", async () => {
    vi.mocked(fetchDocuments).mockRejectedValue(new Error("falha"));

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Erro ao carregar")).toBeInTheDocument();
    });
    expect(
      screen.getByText("Não foi possível carregar os documentos.")
    ).toBeInTheDocument();
    expect(screen.queryByText("Manual do sistema.pdf")).not.toBeInTheDocument();
  });

  it("busca novamente ao digitar na barra de pesquisa", async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Manual do sistema.pdf")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Pesquisar documentos..."), {
      target: { value: "manual" },
    });

    await waitFor(() => {
      expect(fetchDocuments).toHaveBeenLastCalledWith({ nome: "manual", page: 1 });
    });
  });

  it("muda de pagina pela paginacao", async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Manual do sistema.pdf")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Próxima página" }));

    await waitFor(() => {
      expect(fetchDocuments).toHaveBeenLastCalledWith({ nome: "", page: 2 });
    });
  });

  it("ignora mudanca de pagina fora dos limites", async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Manual do sistema.pdf")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Página anterior" }));

    expect(fetchDocuments).toHaveBeenCalledTimes(1);
  });

  it("abre o modal com os detalhes do documento selecionado", async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Manual do sistema.pdf")).toBeInTheDocument();
    });

    openFirstDocument();

    expect(screen.getByText("Carregando detalhes do documento...")).toBeInTheDocument();

    await waitFor(() => {
      expect(getModal()).toBeInTheDocument();
    });
    expect(fetchDocumentById).toHaveBeenCalledWith(1);
    expect(screen.getByText("Tecnico")).toBeInTheDocument();
  });

  it("abre o modal direto quando ja existe documento selecionado", async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Manual do sistema.pdf")).toBeInTheDocument();
    });

    openFirstDocument();

    await waitFor(() => {
      expect(screen.getByText("Tecnico")).toBeInTheDocument();
    });
    expect(getModal()).toBeInTheDocument();
  });

  it("exibe erro nos detalhes e permite tentar novamente", async () => {
    vi.mocked(fetchDocumentById).mockRejectedValue(new Error("falha"));

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Manual do sistema.pdf")).toBeInTheDocument();
    });

    openFirstDocument();

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(
      screen.getByText("NÃ£o foi possÃ­vel carregar os detalhes do documento.")
    ).toBeInTheDocument();

    vi.mocked(fetchDocumentById).mockResolvedValue(documentDetail);
    fireEvent.click(screen.getByText("Tentar novamente"));

    await waitFor(() => {
      expect(screen.getByText("Tecnico")).toBeInTheDocument();
    });
  });

  it("fecha o modal pelo botao e pelo overlay", async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Manual do sistema.pdf")).toBeInTheDocument();
    });

    openFirstDocument();

    await waitFor(() => {
      expect(screen.getByText("Arquivo")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText("Fechar"));
    expect(getModal()).not.toBeInTheDocument();

    openFirstDocument();
    await waitFor(() => {
      expect(getModal()).toBeInTheDocument();
    });

    fireEvent.click(globalThis.document.querySelector(".document-modal-overlay"));
    expect(getModal()).not.toBeInTheDocument();
  });

  it("abre o PDF em nova aba ao visualizar pelo modal", async () => {
    const openSpy = vi
      .spyOn(window, "open")
      .mockImplementation(() => null);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Manual do sistema.pdf")).toBeInTheDocument();
    });

    openFirstDocument();

    await waitFor(() => {
      expect(screen.getByText("Tecnico")).toBeInTheDocument();
    });

    fireEvent.click(getModal().querySelector("footer .modal-view-button"));

    expect(openSpy).toHaveBeenCalledWith(documentDetail.data, "_blank");

    openSpy.mockRestore();
  });

  it("nao abre o PDF quando o documento nao tem URL de arquivo", async () => {
    vi.mocked(fetchDocumentById).mockResolvedValue({
      ...documentDetail,
      data: null,
    });
    const openSpy = vi
      .spyOn(window, "open")
      .mockImplementation(() => null);
    const consoleSpy = vi
      .spyOn(console, "log")
      .mockImplementation(() => {});

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Manual do sistema.pdf")).toBeInTheDocument();
    });

    openFirstDocument();

    await waitFor(() => {
      expect(getModal()).toBeInTheDocument();
    });

    const viewButton = getModal().querySelector("footer .modal-view-button");

    expect(viewButton).toBeDisabled();
    expect(openSpy).not.toHaveBeenCalled();

    openSpy.mockRestore();
    consoleSpy.mockRestore();
  });
});
