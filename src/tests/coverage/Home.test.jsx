import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Home from "./Home";
import { fetchDocuments } from "../services/documentService";

vi.mock("../services/documentService", () => ({
  fetchDocuments: vi.fn(),
}));

vi.mock("../components/SearchBar/SearchBar", () => ({
  default: ({ value, onChange }) => (
    <input
      aria-label="Pesquisar"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

vi.mock("../components/Document/DocumentList", () => ({
  default: ({ documents, onView }) => (
    <div>
      {documents.map((document) => (
        <button key={document.id} onClick={() => onView(document)}>
          {document.nome}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("../components/Pagination/Pagination", () => ({
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

vi.mock("../components/Document/DocumentModal", () => ({
  default: ({ document, onViewPdf }) =>
    document ? (
      <button onClick={() => onViewPdf(document)}>Abrir PDF</button>
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

    expect(screen.getByText("Carregando documentos...")).toBeInTheDocument();

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

  it("abre o PDF do documento selecionado", async () => {
    const windowOpen = vi
      .spyOn(window, "open")
      .mockImplementation(() => null);

    fetchDocuments.mockResolvedValue({
      results: [
        {
          id: 1,
          nome: "Documento 1",
          pdfUrl: "https://exemplo.com/documento.pdf",
        },
      ],
      pages: 1,
    });

    render(<Home />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    fireEvent.click(screen.getByText("Documento 1"));
    fireEvent.click(screen.getByText("Abrir PDF"));

    expect(windowOpen).toHaveBeenCalledWith(
      "https://exemplo.com/documento.pdf",
      "_blank"
    );

    windowOpen.mockRestore();
  });
});