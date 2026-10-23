import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Home from "../../pages/Home/Home";
import {
  fetchDocumentById,
  fetchDocuments,
  updateDocument,
} from "../../services/documentService";

vi.mock("../../services/documentService", () => ({
  fetchDocuments: vi.fn(),
  fetchDocumentById: vi.fn(),
  createDocument: vi.fn(),
  fetchAllAvailableTags: vi.fn(),
  fetchTags: vi.fn(),
  updateDocument: vi.fn(),
}));

vi.mock("../../services/userService", () => ({
  fetchUserProfile: vi.fn().mockResolvedValue({
    nome: "Usuário Teste",
    email: "teste@teste.com",
    nivel_acesso: "basico",
    setor: "tecnico",
  }),
  updateProfile: vi.fn(),
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

vi.mock("../../services/keycloak", () => ({
  getAccessToken: vi.fn().mockResolvedValue("access-token"),
  restartLoginAfterUnauthorized: vi.fn(),
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
      tipo_arquivo: "pdf",
      nome: "Ata de reuniao.pdf",
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

    await screen.findByText("Manual do sistema.pdf");

    expect(screen.getByText("Ata de reuniao.pdf")).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchDocuments).toHaveBeenCalledWith({
        nome: "",
        contexto: "",
        page: 1,
        tags: [],
        tipo: [],
        data_atualizacao: "",
      });
    });
  });

  it("busca novamente a lista quando documentsRefreshKey muda", async () => {
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

    expect(await screen.findByText("Erro ao carregar")).toBeInTheDocument();

    expect(
      screen.getByText("Não foi possível carregar os documentos.")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Manual do sistema.pdf")
    ).not.toBeInTheDocument();
  });

  it("busca novamente ao digitar na barra de pesquisa", async () => {
    render(<Home />);

    await screen.findByText("Manual do sistema.pdf");

    fireEvent.change(
      screen.getByPlaceholderText(
        "Pesquise por nome, tag, conteúdo ou autor..."
      ),
      { target: { value: "manual" } }
    );

    await waitFor(() => {
      expect(fetchDocuments).toHaveBeenLastCalledWith({
        nome: "manual",
        contexto: "",
        page: 1,
        tags: [],
        tipo: [],
        data_atualizacao: "",
      });
    });
  });

  it("indica no botão quando há filtros ativos", async () => {
    render(<Home />);

    await screen.findByText("Manual do sistema.pdf");

    fireEvent.click(screen.getByRole("button", { name: "Filtros" }));

    fireEvent.click(
      screen.getByRole("button", { name: "Selecionar setor/tipo" })
    );

    fireEvent.click(screen.getByLabelText("Técnico"));

    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    expect(
      screen.getByRole("button", { name: "Filtros: 1 ativo" })
    ).toBeInTheDocument();
  });

  it("mantém o painel aberto ao limpar os filtros", async () => {
    render(<Home />);

    await screen.findByText("Manual do sistema.pdf");

    fireEvent.click(screen.getByRole("button", { name: "Filtros" }));

    fireEvent.click(
      screen.getByRole("button", { name: "Selecionar setor/tipo" })
    );

    fireEvent.click(screen.getByLabelText("Técnico"));

    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    fireEvent.click(screen.getByRole("button", { name: "Filtros: 1 ativo" }));

    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Selecionar setor/tipo" })
    ).toBeInTheDocument();
  });

  it("limpa filtros aplicados e refaz a busca com valores padrão", async () => {
    render(<Home />);

    await screen.findByText("Manual do sistema.pdf");

    fireEvent.click(screen.getByRole("button", { name: "Filtros" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Selecionar setor/tipo" })
    );
    fireEvent.click(screen.getByLabelText("Técnico"));
    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    await waitFor(() => {
      expect(fetchDocuments).toHaveBeenLastCalledWith(
        expect.objectContaining({ tipo: ["tecnico"] })
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Filtros: 1 ativo" }));
    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));

    await waitFor(() => {
      expect(fetchDocuments).toHaveBeenLastCalledWith(
        expect.objectContaining({ tipo: [] })
      );
    });
  });

  it("muda de página pela paginação", async () => {
    render(<Home />);

    await screen.findByText("Manual do sistema.pdf");

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

  it("ignora mudança de página fora dos limites", async () => {
    render(<Home />);

    await screen.findByText("Manual do sistema.pdf");

    const callsBeforeClick = fetchDocuments.mock.calls.length;

    fireEvent.click(screen.getByRole("button", { name: "Página anterior" }));

    expect(fetchDocuments).toHaveBeenCalledTimes(callsBeforeClick);
  });

  it("abre os detalhes do documento selecionado ao clicar no cartão", async () => {
    render(<Home />);

    await screen.findByText("Manual do sistema.pdf");

    openFirstDocument();

    await waitFor(() => {
      expect(getModal()).toBeInTheDocument();
      expect(screen.getByText("Tecnico")).toBeInTheDocument();
    });

    expect(fetchDocumentById).toHaveBeenCalledWith(1);
  });

  it("abre o PDF no visualizador ao clicar no botão do cartão", async () => {
    render(<Home />);

    await screen.findByText("Manual do sistema.pdf");

    fireEvent.click(
      screen.getAllByRole("button", { name: "Visualizar" })[0]
    );

    expect(
      await screen.findByRole("dialog", {
        name: /Manual do sistema.pdf/,
      })
    ).toBeInTheDocument();

    expect(await screen.findByLabelText("Página 1")).toBeInTheDocument();

    expect(fetchDocumentById).not.toHaveBeenCalled();

    const pdfjs = await import("pdfjs-dist");

    expect(pdfjs.getDocument).toHaveBeenCalledWith({
      url: "http://localhost:8000/media/documentos/manual.pdf",
      httpHeaders: { Authorization: "Bearer access-token" },
    });
  });

  it("mostra console.log ao tentar visualizar documento sem URL", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    render(<Home />);

    await screen.findByText("Manual do sistema.pdf");

    fireEvent.click(
      screen.getAllByRole("button", { name: "Visualizar" })[1]
    );

    await waitFor(() => {
      expect(logSpy).toHaveBeenCalledWith(
        "PDF ainda não disponível:",
        "Ata de reuniao.pdf"
      );
    });
  });

  it("limita o zoom entre 50% e 400% e permite fechar o visualizador", async () => {
    render(<Home />);

    await screen.findByText("Manual do sistema.pdf");

    fireEvent.click(
      screen.getAllByRole("button", { name: "Visualizar" })[0]
    );

    const zoomIn = screen.getByRole("button", { name: "Aumentar zoom" });

    for (let index = 0; index < 20; index += 1) {
      fireEvent.click(zoomIn);
    }

    expect(screen.getByText("400%")).toBeInTheDocument();
    expect(zoomIn).toBeDisabled();

    const zoomOut = screen.getByRole("button", { name: "Diminuir zoom" });

    for (let index = 0; index < 20; index += 1) {
      fireEvent.click(zoomOut);
    }

    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(zoomOut).toBeDisabled();

    fireEvent.click(screen.getByLabelText("Fechar visualização"));

    expect(
      screen.queryByRole("dialog", { name: /Manual do sistema.pdf/ })
    ).not.toBeInTheDocument();
  });

  it("fecha ao clicar fora e bloqueia o menu de contexto no documento", async () => {
    render(<Home />);

    await screen.findByText("Manual do sistema.pdf");

    fireEvent.click(
      screen.getAllByRole("button", { name: "Visualizar" })[0]
    );

    await screen.findByLabelText("Página 1");

    const viewerContent = screen
      .getByLabelText("Página 1")
      .parentElement.parentElement;

    const contextMenuEvent = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
    });

    fireEvent(viewerContent, contextMenuEvent);

    expect(contextMenuEvent.defaultPrevented).toBe(true);

    fireEvent.click(
      globalThis.document.querySelector(".pdf-viewer-overlay")
    );

    expect(
      screen.queryByRole("dialog", { name: /Manual do sistema.pdf/ })
    ).not.toBeInTheDocument();
  });

  it("abre o modal de detalhes para o documento selecionado", async () => {
    render(<Home />);

    await screen.findByText("Manual do sistema.pdf");

    openFirstDocument();

    await waitFor(() => {
      expect(getModal()).toBeInTheDocument();
      expect(screen.getByText("Tecnico")).toBeInTheDocument();
    });
  });

  it("exibe erro nos detalhes e permite tentar novamente", async () => {
    vi.mocked(fetchDocumentById).mockRejectedValueOnce(new Error("falha"));

    render(<Home />);

    await screen.findByText("Manual do sistema.pdf");

    openFirstDocument();

    expect(await screen.findByRole("alert")).toBeInTheDocument();

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

  it("fecha o modal pelo botão e pelo overlay", async () => {
    render(<Home />);

    await screen.findByText("Manual do sistema.pdf");

    openFirstDocument();

    await waitFor(() => {
      expect(getModal()).toBeInTheDocument();
      expect(getModal()).toHaveTextContent("Arquivo");
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

    await screen.findByText("Manual do sistema.pdf");

    openFirstDocument();

    await screen.findByText("Tecnico");

    fireEvent.click(getModal().querySelector("footer .modal-view-button"));

    expect(
      await screen.findByRole("dialog", {
        name: /Manual do sistema.pdf/,
      })
    ).toBeInTheDocument();
  });

  it("não abre o visualizador quando o documento não tem URL de arquivo", async () => {
    vi.mocked(fetchDocumentById).mockResolvedValue({
      ...documentDetail,
      data: null,
    });

    render(<Home />);

    await screen.findByText("Manual do sistema.pdf");

    openFirstDocument();

    await waitFor(() => {
      expect(getModal()).toBeInTheDocument();
    });

    const viewButton = getModal().querySelector("footer .modal-view-button");

    expect(viewButton).toBeDisabled();

    expect(
      screen.queryByRole("dialog", { name: /Manual do sistema.pdf/ })
    ).not.toBeInTheDocument();
  });

  it("exibe o ícone de cadeado nos documentos restritos", async () => {
    render(<Home />);

    await screen.findByText("Plano Militar Confidencial.pdf");

    expect(screen.getByTestId("lock-icon")).toBeInTheDocument();
  });

  it("abre os detalhes com indicação de acesso bloqueado ao clicar no cartão restrito", async () => {
    vi.mocked(fetchDocumentById).mockResolvedValue({
      ...documentsPage.results[2],
      descricao: "Documento restrito teste",
    });

    render(<Home />);

    await screen.findByText("Plano Militar Confidencial.pdf");

    fireEvent.click(screen.getByText("Plano Militar Confidencial.pdf"));

    await waitFor(() => {
      expect(getModal()).toBeInTheDocument();
    });

    expect(screen.getByText("Acesso Bloqueado")).toBeInTheDocument();

    expect(
      screen.getByText("Documento com Acesso Restrito")
    ).toBeInTheDocument();
  });

  it("exibe o aviso de acesso restrito ao clicar no botão do documento restrito", async () => {
    render(<Home />);

    await screen.findByText("Plano Militar Confidencial.pdf");

    const buttons = screen.getAllByRole("button", { name: "Visualizar" });

    fireEvent.click(buttons[2]);

    expect(
      await screen.findByRole("heading", { name: "Acesso Restrito" })
    ).toBeInTheDocument();
    expect(getModal()).not.toBeInTheDocument();
    expect(fetchDocumentById).not.toHaveBeenCalled();
  });

  it("avisa ao tentar visualizar documento restrito e não abre o PDF", async () => {
    vi.mocked(fetchDocumentById).mockResolvedValue({
      ...documentDetail,
      acesso_permitido: false,
    });

    render(<Home />);

    await screen.findByText("Manual do sistema.pdf");

    openFirstDocument();

    await waitFor(() => {
      expect(getModal()).toBeInTheDocument();
      expect(getModal()).toHaveTextContent("Acesso Bloqueado");
    });

    fireEvent.click(getModal().querySelector("footer .modal-view-button"));

    expect(
      await screen.findByRole("heading", { name: "Acesso Restrito" })
    ).toBeInTheDocument();

    expect(getModal()).not.toBeInTheDocument();

    expect(
      screen.queryByRole("dialog", { name: /Manual do sistema.pdf/ })
    ).not.toBeInTheDocument();
  });

  it("abre o EditDocumentModal ao clicar em Editar", async () => {
    render(<Home />);

    await screen.findByText("Manual do sistema.pdf");

    openFirstDocument();

    await screen.findByText("Tecnico");

    fireEvent.click(
      screen.getByRole("button", { name: "Editar documento" })
    );

    expect(screen.getByLabelText("Nome do documento *")).toBeInTheDocument();
  });

  it("volta aos detalhes ao cancelar o EditDocumentModal", async () => {
    render(<Home />);

    await screen.findByText("Manual do sistema.pdf");

    openFirstDocument();

    await screen.findByText("Tecnico");

    fireEvent.click(
      screen.getByRole("button", { name: "Editar documento" })
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Voltar aos detalhes/i })
    );

    await waitFor(() => {
      expect(getModal()).toBeInTheDocument();
    });
  });

  it("salva edição e atualiza a lista de documentos", async () => {
    vi.mocked(updateDocument).mockResolvedValue({
      id_documento: 1,
      nome: "Manual atualizado.pdf",
      setor: "tecnico",
      nivel: "basico",
    });

    render(<Home />);

    await screen.findByText("Manual do sistema.pdf");

    openFirstDocument();

    await screen.findByText("Tecnico");

    fireEvent.click(
      screen.getByRole("button", { name: "Editar documento" })
    );

    fireEvent.change(screen.getByLabelText("Nome do documento *"), {
      target: { value: "Manual atualizado.pdf" },
    });

    fireEvent.change(screen.getByLabelText("Setor responsável *"), {
      target: { value: "tecnico" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Salvar alterações" })
    );

    await waitFor(() => {
      expect(updateDocument).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ nome: "Manual atualizado.pdf" })
      );
    });

    // Após salvar, o nome aparece no modal de detalhes E no card da lista.
    // Confirma que a lista (card) foi atualizada, olhando especificamente
    // para o item com a classe `.document-name`.
    await waitFor(() => {
      const cardNames = Array.from(
        globalThis.document.querySelectorAll(".document-name")
      ).map((element) => element.textContent);

      expect(cardNames).toContain("Manual atualizado.pdf");
    });

    // E o modal de detalhes também reflete a atualização.
    const modalTitle = getModal()?.querySelector(".modal-code");
    expect(modalTitle).toHaveTextContent("Manual atualizado.pdf");
  });
});