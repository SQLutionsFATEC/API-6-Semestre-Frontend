import { act, fireEvent, render, screen } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import Home from "../../pages/Home/Home";
import {
  fetchDocumentById,
  fetchDocuments,
} from "../../services/documentService";

vi.mock("../../services/documentService", () => ({
  fetchDocuments: vi.fn(),
  fetchDocumentById: vi.fn(),
}));

vi.mock("../../components/SearchBar/SearchBar", () => ({
  default: ({ value, onChange }) => (
    <input
      aria-label="Pesquisar"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

vi.mock("../../components/Document/DocumentList/DocumentList", () => ({
  default: ({ documents = [], onView }) => (
    <div data-testid="document-list">
      {documents.map((document) => (
        <button
          key={document.id_documento}
          type="button"
          onClick={() => onView(document)}
        >
          {document.nome}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("../../components/Pagination/Pagination", () => ({
  default: ({ currentPage, totalPages, onPageChange }) => (
    <div data-testid="pagination">
      <span>
        Página {currentPage} de {totalPages}
      </span>

      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Página anterior
      </button>

      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Próxima página
      </button>
    </div>
  ),
}));

vi.mock("../../components/FilterSidebar/FilterSidebar", () => ({
  default: ({ isOpen, filters, onClose, onApplyFilters }) => {
    if (!isOpen) {
      return null;
    }

    return (
      <aside data-testid="filter-sidebar">
        <span data-testid="current-filter-data">
          {JSON.stringify(filters)}
        </span>

        <button type="button" onClick={onClose}>
          Fechar filtros
        </button>

        <button
          type="button"
          onClick={() =>
            onApplyFilters({
              tags: [1, 2],
              tipo: ["Técnico", "Normativo"],
              data_atualizacao: "2026-10-01",
            })
          }
        >
          Aplicar filtros de teste
        </button>

        <button
          type="button"
          onClick={() =>
            onApplyFilters({
              tags: [],
              tipo: [],
              data_atualizacao: "",
            })
          }
        >
          Limpar filtros
        </button>
      </aside>
    );
  },
}));

vi.mock("../../components/Document/DocumentModal/DocumentModal", () => ({
  default: ({ document, loading, error, onClose, onRetry }) => {
    if (!document && !loading && !error) {
      return null;
    }

    return (
      <div data-testid="document-modal">
        {document?.nome && <span>{document.nome}</span>}

        {loading && <p>Carregando detalhes...</p>}

        {error && <p role="alert">{String(error)}</p>}

        <button type="button" onClick={onClose}>
          Fechar documento
        </button>

        {error && (
          <button type="button" onClick={onRetry}>
            Tentar novamente
          </button>
        )}
      </div>
    );
  },
}));

const documentsPage = {
  results: [
    {
      id_documento: 1,
      nome: "Manual.pdf",
      tipo_arquivo: "pdf",
    },
    {
      id_documento: 2,
      nome: "Contrato.pdf",
      tipo_arquivo: "pdf",
    },
  ],
  pages: 2,
};

const documentDetail = {
  id_documento: 1,
  nome: "Manual.pdf",
  tipo_arquivo: "pdf",
  etiquetas: [{ id_etiqueta: 1, nome: "Importante" }],
};

const emptyFilters = {
  tags: [],
  tipo: [],
  data_atualizacao: "",
};

const selectedFilters = {
  tags: [1, 2],
  tipo: ["Técnico", "Normativo"],
  data_atualizacao: "2026-10-01",
};

async function advanceSearchDebounce() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(500);
  });
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

function openFilterSidebar() {
  fireEvent.click(
    screen.getByRole("button", {
      name: "Filtros",
      exact: true,
    })
  );
}

async function loadHome() {
  render(<Home />);
  await advanceSearchDebounce();
}

function openDocument(name = "Manual.pdf") {
  fireEvent.click(
    screen.getByRole("button", {
      name,
      exact: true,
    })
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();

  fetchDocuments.mockResolvedValue(documentsPage);
  fetchDocumentById.mockResolvedValue(documentDetail);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Home", () => {
  it("renderiza o título, o campo de pesquisa e o botão de filtros", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: "Documentos" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("textbox", { name: "Pesquisar" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Filtros",
        exact: true,
      })
    ).toBeInTheDocument();
  });

  it("carrega os documentos inicialmente usando os parâmetros da A6-33", async () => {
    await loadHome();

    expect(fetchDocuments).toHaveBeenCalledWith({
      nome: "",
      contexto: "",
      page: 1,
      tags: [],
      tipo: [],
      data_atualizacao: "",
    });
  });

  it("realiza uma nova busca ao alterar o texto", async () => {
    await loadHome();
    fetchDocuments.mockClear();

    fireEvent.change(screen.getByRole("textbox", { name: "Pesquisar" }), {
      target: { value: "LGPD" },
    });

    await advanceSearchDebounce();

    expect(fetchDocuments).toHaveBeenLastCalledWith({
      nome: "LGPD",
      contexto: "LGPD",
      page: 1,
      ...emptyFilters,
    });
  });

  it("abre a sidebar de filtros ao clicar no botão Filtros", () => {
    render(<Home />);

    openFilterSidebar();

    expect(screen.getByTestId("filter-sidebar")).toBeInTheDocument();
  });

  it("fecha a sidebar de filtros ao executar onClose", () => {
    render(<Home />);

    openFilterSidebar();

    expect(screen.getByTestId("filter-sidebar")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Fechar filtros" })
    );

    expect(
      screen.queryByTestId("filter-sidebar")
    ).not.toBeInTheDocument();
  });

  it("aplica filtros e reinicia a paginação para a página 1", async () => {
    await loadHome();

    fireEvent.click(
      screen.getByRole("button", { name: "Próxima página" })
    );

    await advanceSearchDebounce();

    expect(screen.getByTestId("pagination")).toHaveTextContent(
      "Página 2 de 2"
    );

    openFilterSidebar();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Aplicar filtros de teste",
      })
    );

    expect(
      screen.queryByTestId("filter-sidebar")
    ).not.toBeInTheDocument();

    await advanceSearchDebounce();

    expect(fetchDocuments).toHaveBeenLastCalledWith({
      nome: "",
      contexto: "",
      page: 1,
      ...selectedFilters,
    });

    expect(screen.getByTestId("pagination")).toHaveTextContent(
      "Página 1 de 2"
    );
  });

  it("mantém a busca textual ao aplicar filtros", async () => {
    await loadHome();

    fireEvent.change(screen.getByRole("textbox", { name: "Pesquisar" }), {
      target: { value: "LGPD" },
    });

    await advanceSearchDebounce();

    openFilterSidebar();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Aplicar filtros de teste",
      })
    );

    await advanceSearchDebounce();

    expect(fetchDocuments).toHaveBeenLastCalledWith({
      nome: "LGPD",
      contexto: "LGPD",
      page: 1,
      ...selectedFilters,
    });

    expect(
      screen.getByRole("textbox", { name: "Pesquisar" })
    ).toHaveValue("LGPD");
  });

  it("limpa os filtros sem apagar a busca textual", async () => {
    await loadHome();

    fireEvent.change(screen.getByRole("textbox", { name: "Pesquisar" }), {
      target: { value: "Contrato" },
    });

    await advanceSearchDebounce();

    openFilterSidebar();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Aplicar filtros de teste",
      })
    );

    await advanceSearchDebounce();

    openFilterSidebar();

    fireEvent.click(
      screen.getByRole("button", { name: "Limpar filtros" })
    );

    await advanceSearchDebounce();

    expect(fetchDocuments).toHaveBeenLastCalledWith({
      nome: "Contrato",
      contexto: "Contrato",
      page: 1,
      ...emptyFilters,
    });

    expect(
      screen.getByRole("textbox", { name: "Pesquisar" })
    ).toHaveValue("Contrato");

    expect(
      screen.queryByTestId("filter-sidebar")
    ).not.toBeInTheDocument();
  });

  it("exibe os documentos retornados pela API", async () => {
    await loadHome();

    const documentList = screen.getByTestId("document-list");

    expect(documentList).toHaveTextContent("Manual.pdf");
    expect(documentList).toHaveTextContent("Contrato.pdf");

    expect(
      screen.queryByTestId("document-modal")
    ).not.toBeInTheDocument();
  });

  it("exibe mensagem de erro quando a busca falha", async () => {
    fetchDocuments.mockRejectedValueOnce(new Error("Erro de rede"));

    render(<Home />);

    await advanceSearchDebounce();

    expect(
      screen.getByText("Não foi possível carregar os documentos.")
    ).toBeInTheDocument();
  });

  it("abre os detalhes de um documento", async () => {
    await loadHome();

    await act(async () => {
      openDocument("Manual.pdf");
      await flushPromises();
    });

    expect(fetchDocumentById).toHaveBeenCalledWith(1);

    expect(screen.getByTestId("document-modal")).toHaveTextContent(
      "Manual.pdf"
    );
  });

  it("fecha os detalhes do documento", async () => {
    await loadHome();

    await act(async () => {
      openDocument("Manual.pdf");
      await flushPromises();
    });

    expect(screen.getByTestId("document-modal")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Fechar documento" })
    );

    expect(
      screen.queryByTestId("document-modal")
    ).not.toBeInTheDocument();
  });

  it("permite tentar novamente ao ocorrer erro ao carregar detalhes", async () => {
    fetchDocumentById
      .mockRejectedValueOnce(new Error("Erro de rede"))
      .mockResolvedValueOnce(documentDetail);

    await loadHome();

    await act(async () => {
      openDocument("Manual.pdf");
      await flushPromises();
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Não foi possível carregar os detalhes do documento."
    );

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Tentar novamente" })
      );
      await flushPromises();
    });

    expect(fetchDocumentById).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    expect(screen.getByTestId("document-modal")).toHaveTextContent(
      "Manual.pdf"
    );
  });

  it("ignora uma resposta antiga de detalhes depois que outro documento foi aberto", async () => {
    const pendingResolvers = [];

    fetchDocumentById.mockImplementation(
      () =>
        new Promise((resolve) => {
          pendingResolvers.push(resolve);
        })
    );

    await loadHome();

    await act(async () => {
      openDocument("Manual.pdf");
      await flushPromises();
    });

    await act(async () => {
      openDocument("Contrato.pdf");
      await flushPromises();
    });

    expect(fetchDocumentById).toHaveBeenNthCalledWith(1, 1);
    expect(fetchDocumentById).toHaveBeenNthCalledWith(2, 2);
    expect(pendingResolvers).toHaveLength(2);

    await act(async () => {
      pendingResolvers[1]({
        id_documento: 2,
        nome: "Contrato.pdf",
        tipo_arquivo: "pdf",
      });

      await flushPromises();
    });

    expect(screen.getByTestId("document-modal")).toHaveTextContent(
      "Contrato.pdf"
    );

    await act(async () => {
      pendingResolvers[0]({
        id_documento: 1,
        nome: "Resposta antiga.pdf",
        tipo_arquivo: "pdf",
      });

      await flushPromises();
    });

    expect(screen.getByTestId("document-modal")).toHaveTextContent(
      "Contrato.pdf"
    );

    expect(screen.getByTestId("document-modal")).not.toHaveTextContent(
      "Resposta antiga.pdf"
    );
  });
});
