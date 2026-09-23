import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Home from "../../pages/Home/Home";
import {
  fetchDocumentById,
  fetchDocuments,
} from "../../services/documentService";

vi.mock("../../services/documentService", () => ({
  fetchDocumentById: vi.fn(),
  fetchDocuments: vi.fn(),
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
  default: ({ documents, onView }) => (
    <div>
      {documents.map((document) => (
        <button key={document.id_documento} onClick={() => onView(document)}>
          {document.nome}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("../../components/Pagination/Pagination", () => ({
  default: ({ currentPage, totalPages, onPageChange }) => (
    <button
      aria-label="Próxima página"
      disabled={currentPage >= totalPages}
      onClick={() => onPageChange(currentPage + 1)}
    >
      Próxima
    </button>
  ),
}));

vi.mock("../../components/Document/DocumentModal/DocumentModal", () => ({
  default: ({ document, error, loading, onClose, onRetry, onViewPdf }) =>
    document || error || loading ? (
      <div>
        {loading && <span>Carregando detalhes</span>}
        {error && <button onClick={onRetry}>Tentar novamente</button>}
        {document && !loading && !error && (
          <>
            <span>Detalhe: {document.nome}</span>
            <button onClick={() => onViewPdf(document)}>Abrir PDF</button>
          </>
        )}
        <button onClick={onClose}>Fechar modal</button>
      </div>
    ) : null,
}));

describe("Home", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  it("carrega e exibe os documentos", async () => {
    fetchDocuments.mockResolvedValue({
      results: [{ id: 1, nome: "Documento 1" }],
      pages: 2,
    });

    render(<Home />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(fetchDocuments).toHaveBeenCalledWith({
      nome: "",
      page: 1,
    });
    expect(screen.getByText("Documento 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Próxima página")).toBeEnabled();
  });

  it("exibe mensagem de erro quando a busca falha", async () => {
    fetchDocuments.mockRejectedValue(new Error("Erro na API"));

    render(<Home />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(
      screen.getByText("Não foi possível carregar os documentos.")
    ).toBeInTheDocument();
  });

  it("realiza uma nova busca ao alterar o texto", async () => {
    fetchDocuments.mockResolvedValue({
      results: [],
      pages: 1,
    });

    render(<Home />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    fireEvent.change(screen.getByLabelText("Pesquisar"), {
      target: { value: "relatório" },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(fetchDocuments).toHaveBeenLastCalledWith({
      nome: "relatório",
      page: 1,
    });
  });

  it("busca e exibe os detalhes do documento selecionado", async () => {
    const windowOpen = vi.spyOn(window, "open").mockImplementation(() => null);
    fetchDocuments.mockResolvedValue({
      results: [
        {
          id_documento: 1,
          nome: "Documento 1",
        },
      ],
      pages: 1,
    });
    let resolveDocumentDetails;
    fetchDocumentById.mockReturnValue(
      new Promise((resolve) => {
        resolveDocumentDetails = resolve;
      })
    );

    render(<Home />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    fireEvent.click(screen.getByText("Documento 1"));
    expect(fetchDocumentById).toHaveBeenCalledWith(1);
    expect(screen.getByText("Carregando detalhes")).toBeInTheDocument();

    await act(async () => {
      resolveDocumentDetails({
        id_documento: 1,
        nome: "Documento completo",
        data: "http://localhost:8000/media/documentos/manual.pdf",
      });
    });

    expect(screen.getByText("Detalhe: Documento completo")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Abrir PDF"));
    expect(windowOpen).toHaveBeenCalledWith(
      "http://localhost:8000/media/documentos/manual.pdf",
      "_blank"
    );

    windowOpen.mockRestore();
  });

  it("permite tentar novamente ao falhar ao buscar os detalhes", async () => {
    fetchDocuments.mockResolvedValue({
      results: [{ id_documento: 1, nome: "Documento 1" }],
      pages: 1,
    });
    fetchDocumentById
      .mockRejectedValueOnce(new Error("Erro na API"))
      .mockResolvedValueOnce({ id_documento: 1, nome: "Documento completo" });

    render(<Home />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    fireEvent.click(screen.getByText("Documento 1"));

    await act(async () => {});

    expect(screen.getByText("Tentar novamente")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Tentar novamente"));

    await act(async () => {});

    expect(fetchDocumentById).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Detalhe: Documento completo")).toBeInTheDocument();
  });

  it("ignora a resposta de detalhes depois que o modal Ã© fechado", async () => {
    fetchDocuments.mockResolvedValue({
      results: [{ id_documento: 1, nome: "Documento 1" }],
      pages: 1,
    });
    let resolveDocumentDetails;
    fetchDocumentById.mockReturnValue(
      new Promise((resolve) => {
        resolveDocumentDetails = resolve;
      })
    );

    render(<Home />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    fireEvent.click(screen.getByText("Documento 1"));
    fireEvent.click(screen.getByText("Fechar modal"));

    await act(async () => {
      resolveDocumentDetails({ id_documento: 1, nome: "Documento completo" });
    });

    expect(screen.queryByText("Detalhe: Documento completo")).not.toBeInTheDocument();
  });
});
