import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Home from "../../pages/Home/Home";
import {
  fetchDocumentById,
  fetchDocuments,
} from "../../services/documentService";

vi.mock("../../services/documentService", () => ({
  fetchDocuments: vi.fn(),
  fetchDocumentById: vi.fn(),
}));

vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: { workerSrc: "" },
  getDocument: vi.fn(() => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: vi.fn().mockResolvedValue({
        getViewport: vi.fn(({ scale }) => ({
          width: 600 * scale,
          height: 800 * scale,
        })),
        render: vi.fn(() => ({
          promise: Promise.resolve(),
          cancel: vi.fn(),
        })),
      }),
    }),
    destroy: vi.fn(),
  })),
}));

vi.mock("docx-preview", () => ({
  renderAsync: vi.fn(async (_document, contentContainer) => {
    const paragraph = globalThis.document.createElement("p");
    paragraph.textContent = "Conteúdo renderizado do DOCX";
    contentContainer.append(paragraph);
  }),
}));

vi.mock("@mdgate/doc", () => ({
  toMarkdown: vi.fn().mockResolvedValue("# Documento DOC\n\nTexto do documento legado."),
}));

vi.mock("react-markdown", () => ({
  default: ({ children }) => children,
}));

const documentsPage = {
  results: [
    {
      id_documento: 1,
      tipo_arquivo: "pdf",
      nome: "Manual do sistema.pdf",
      setor: "Engenharia",
      data_atualizacao: "2026-09-20T12:00:00Z",
      nivel: "Básico",
      data: "http://localhost:8000/media/documentos/manual.pdf",
      acesso_permitido: true,
    },
    {
      id_documento: 2,
      tipo_arquivo: "docx",
      nome: "Ata de reuniao.docx",
      setor: "Administrativo",
      data_atualizacao: "2026-08-01T09:00:00Z",
      nivel: "Comercial",
      acesso_permitido: true,
    },
    {
      id_documento: 3,
      tipo_arquivo: "pdf",
      nome: "Plano Militar Confidencial.pdf",
      setor: "Defesa",
      data_atualizacao: "2026-07-15T09:00:00Z",
      nivel: "Militar",
      data: "http://localhost:8000/media/documentos/militar.pdf",
      acesso_permitido: false,
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
  nivel: "Básico",
  data: "http://localhost:8000/media/documentos/manual.pdf",
  acesso_permitido: true,
  etiquetas: [{ id_etiqueta: 1, nome: "Tecnico" }],
};

function getModal() {
  return globalThis.document.querySelector(".document-modal");
}

function openFirstDocument() {
  fireEvent.click(screen.getByText("Manual do sistema.pdf"));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({});

  vi.mocked(fetchDocuments).mockResolvedValue(documentsPage);
  vi.mocked(fetchDocumentById).mockResolvedValue(documentDetail);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Home", () => {
  it("carrega e exibe a lista de documentos", async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Manual do sistema.pdf")).toBeInTheDocument();
    });

    expect(screen.getByText("Ata de reuniao.docx")).toBeInTheDocument();
    expect(fetchDocuments).toHaveBeenCalledWith({
      nome: "",
      contexto: "",
      page: 1,
      tags: [],
      tipo: [],
      data_atualizacao: "",
    });
  });

  it("busca novamente a lista após o cadastro de um documento", async () => {
    const { rerender } = render(<Home documentsRefreshKey={0} />);

    await waitFor(() => {
      expect(fetchDocuments).toHaveBeenCalledTimes(1);
    });

    rerender(<Home documentsRefreshKey={1} />);

    await waitFor(() => {
      expect(fetchDocuments).toHaveBeenCalledTimes(2);
    });
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
      expect(fetchDocuments).toHaveBeenLastCalledWith({
        nome: "manual",
        contexto: "manual",
        page: 1,
        tags: [],
        tipo: [],
        data_atualizacao: "",
      });
    });
  });

  it("muda de pagina pela paginacao", async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Manual do sistema.pdf")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Próxima página" }));

    await waitFor(() => {
      expect(fetchDocuments).toHaveBeenLastCalledWith({
        nome: "",
        contexto: "",
        page: 2,
        tags: [],
        tipo: [],
        data_atualizacao: "",
      });
    });
  });

  it("ignora mudanca de pagina fora dos limites", async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Manual do sistema.pdf")).toBeInTheDocument();
    });

    const callsBeforeClick = fetchDocuments.mock.calls.length;

    fireEvent.click(
      screen.getByRole("button", { name: "Página anterior" })
    );

    expect(fetchDocuments).toHaveBeenCalledTimes(callsBeforeClick);
  });

  it("abre o modal com os detalhes do documento selecionado ao clicar no cartão", async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Manual do sistema.pdf")).toBeInTheDocument();
    });

    openFirstDocument();

    await waitFor(() => {
      expect(getModal()).toBeInTheDocument();
    });

    expect(fetchDocumentById).toHaveBeenCalledWith(1);
    expect(screen.getByText("Tecnico")).toBeInTheDocument();
  });

  it("abre o PDF no visualizador ao clicar no botão do cartão", async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Manual do sistema.pdf")).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Visualizar" })[0]);

    expect(screen.getByRole("dialog", { name: /Manual do sistema.pdf/ })).toBeInTheDocument();
    expect(await screen.findByLabelText("Página 1")).toBeInTheDocument();
    expect(fetchDocumentById).not.toHaveBeenCalled();

    const pdfjs = await import("pdfjs-dist");
    expect(pdfjs.getDocument).toHaveBeenCalledWith({
      url: "http://localhost:8000/media/documentos/manual.pdf",
    });
  });

  it("limita o zoom do visualizador entre 50% e 400% e permite fechá-lo", async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Manual do sistema.pdf")).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Visualizar" })[0]);

    const zoomIn = screen.getByRole("button", { name: "Aumentar zoom" });
    for (let index = 0; index < 20; index += 1) fireEvent.click(zoomIn);

    expect(screen.getByText("400%")).toBeInTheDocument();
    expect(zoomIn).toBeDisabled();

    const zoomOut = screen.getByRole("button", { name: "Diminuir zoom" });
    for (let index = 0; index < 20; index += 1) fireEvent.click(zoomOut);

    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(zoomOut).toBeDisabled();

    fireEvent.click(screen.getByLabelText("Fechar visualização"));
    expect(
      screen.queryByRole("dialog", { name: /Manual do sistema.pdf/ })
    ).not.toBeInTheDocument();
  });

  it("fecha ao clicar fora e bloqueia o menu de contexto no documento", async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Manual do sistema.pdf")).toBeInTheDocument();
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Visualizar" })[0]);
    await screen.findByLabelText("Página 1");

    const viewerContent = screen.getByLabelText("Página 1").parentElement.parentElement;
    const contextMenuEvent = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
    });
    fireEvent(viewerContent, contextMenuEvent);
    expect(contextMenuEvent.defaultPrevented).toBe(true);

    fireEvent.click(globalThis.document.querySelector(".pdf-viewer-overlay"));
    expect(
      screen.queryByRole("dialog", { name: /Manual do sistema.pdf/ })
    ).not.toBeInTheDocument();
  });

  it("renderiza DOCX localmente dentro do visualizador", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
      })
    );
    vi.mocked(fetchDocuments).mockResolvedValue({
      ...documentsPage,
      results: [
        {
          ...documentsPage.results[0],
          nome: "Manual Word.docx",
          tipo_arquivo: "docx",
          data: "http://localhost:8000/media/documentos/manual.docx",
        },
      ],
    });

    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText("Manual Word.docx")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "Visualizar" }));

    expect(
      await screen.findByText("Conteúdo renderizado do DOCX")
    ).toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://localhost:8000/media/documentos/manual.docx",
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it("exibe DOC legado localmente sem gerar PDF", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
      })
    );
    vi.mocked(fetchDocuments).mockResolvedValue({
      ...documentsPage,
      results: [
        {
          ...documentsPage.results[0],
          nome: "Manual legado.doc",
          tipo_arquivo: "doc",
          data: "http://localhost:8000/media/documentos/manual.doc",
        },
      ],
    });

    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText("Manual legado.doc")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "Visualizar" }));

    const legacyContent = await screen.findByText((_, element) =>
      element.classList.contains("word-markdown-content")
    );
    expect(legacyContent).toHaveTextContent("Documento DOC");
    expect(legacyContent).toHaveTextContent("Texto do documento legado.");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://localhost:8000/media/documentos/manual.doc",
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
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
      screen.getByText(
        "Não foi possível carregar os detalhes do documento."
      )
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

    fireEvent.click(
      globalThis.document.querySelector(".document-modal-overlay")
    );

    expect(getModal()).not.toBeInTheDocument();
  });

  it("abre o PDF no visualizador ao visualizar pelos detalhes", async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Manual do sistema.pdf")).toBeInTheDocument();
    });

    openFirstDocument();

    await waitFor(() => {
      expect(screen.getByText("Tecnico")).toBeInTheDocument();
    });

    fireEvent.click(getModal().querySelector("footer .modal-view-button"));

    expect(screen.getByRole("dialog", { name: /Manual do sistema.pdf/ })).toBeInTheDocument();
  });

  it("nao abre o visualizador quando o documento nao tem URL de arquivo", async () => {
    vi.mocked(fetchDocumentById).mockResolvedValue({
      ...documentDetail,
      data: null,
    });

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
    expect(screen.queryByRole("dialog", { name: /Manual do sistema.pdf/ })).not.toBeInTheDocument();
  });

  it("documentos restritos exibem inequivocamente o ícone de cadeado", async () => {
    render(<Home />);

    await waitFor(() => {
      expect(
        screen.getByText("Plano Militar Confidencial.pdf")
      ).toBeInTheDocument();
    });

    expect(screen.getByTestId("lock-icon")).toBeInTheDocument();
  });

  it("ao clicar no cartão de documento restrito, abre o modal exibindo o indicativo de acesso bloqueado", async () => {
    vi.mocked(fetchDocumentById).mockResolvedValue({
      ...documentsPage.results[2],
      descricao: "Documento restrito teste",
    });

    render(<Home />);

    await waitFor(() => {
      expect(
        screen.getByText("Plano Militar Confidencial.pdf")
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Plano Militar Confidencial.pdf"));

    await waitFor(() => {
      expect(getModal()).toBeInTheDocument();
    });

    expect(screen.getByText("Acesso Bloqueado")).toBeInTheDocument();
    expect(
      screen.getByText("Documento com Acesso Restrito")
    ).toBeInTheDocument();
  });

  it("ao clicar no botão de cadeado de um documento restrito, abre o modal de detalhes com o indicativo de bloqueio", async () => {
    vi.mocked(fetchDocumentById).mockResolvedValue({
      ...documentsPage.results[2],
      descricao: "Documento restrito teste",
    });

    render(<Home />);

    await waitFor(() => {
      expect(
        screen.getByText("Plano Militar Confidencial.pdf")
      ).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole("button", { name: "Visualizar" });
    const restrictedButton = buttons[2];

    fireEvent.click(restrictedButton);

    await waitFor(() => {
      expect(getModal()).toBeInTheDocument();
    });

    expect(screen.getByText("Acesso Bloqueado")).toBeInTheDocument();
  });

  it("ao tentar visualizar documento restrito pelo modal de detalhes, exibe o modal de acesso restrito e não abre o link", async () => {
    vi.mocked(fetchDocumentById).mockResolvedValue({
      ...documentDetail,
      acesso_permitido: false,
    });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Manual do sistema.pdf")).toBeInTheDocument();
    });

    openFirstDocument();

    await waitFor(() => {
      expect(getModal()).toBeInTheDocument();
    });

    fireEvent.click(getModal().querySelector("footer .modal-view-button"));

    expect(
      screen.getByRole("heading", { name: "Acesso Restrito" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: /Manual do sistema.pdf/ })).not.toBeInTheDocument();
  });
});