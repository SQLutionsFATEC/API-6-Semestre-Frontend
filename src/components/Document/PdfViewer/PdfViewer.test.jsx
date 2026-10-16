import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import PdfViewer from "./PdfViewer";

const { getDocument, workerSrc } = vi.hoisted(() => ({
  getDocument: vi.fn(),
  workerSrc: { value: "" },
}));

vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: workerSrc,
  getDocument,
}));

vi.mock("pdfjs-dist/build/pdf.worker.min.mjs?url", () => ({
  default: "/mock-pdf-worker.js",
}));

function createPdfDocument(pageCount = 1) {
  const renderTask = {
    promise: Promise.resolve(),
    cancel: vi.fn(),
  };
  const page = {
    getViewport: vi.fn(({ scale }) => ({
      width: 600 * scale,
      height: 800 * scale,
    })),
    render: vi.fn(() => renderTask),
  };
  const pdfDocument = {
    numPages: pageCount,
    getPage: vi.fn().mockResolvedValue(page),
  };

  return { pdfDocument, page, renderTask };
}

const pdf = {
  nome: "Manual do sistema.pdf",
  tipo_arquivo: "pdf",
  data: "https://example.com/manual.pdf",
};

describe("PdfViewer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({});

    const { pdfDocument } = createPdfDocument();
    getDocument.mockReturnValue({
      promise: Promise.resolve(pdfDocument),
      destroy: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("não renderiza quando não há documento", () => {
    const { container } = render(
      <PdfViewer document={null} onClose={vi.fn()} />
    );

    expect(container).toBeEmptyDOMElement();
    expect(getDocument).not.toHaveBeenCalled();
  });

  it("carrega e renderiza as páginas do PDF", async () => {
    const { pdfDocument } = createPdfDocument(2);
    getDocument.mockReturnValue({
      promise: Promise.resolve(pdfDocument),
      destroy: vi.fn(),
    });

    render(<PdfViewer document={pdf} onClose={vi.fn()} />);

    expect(
      await screen.findByRole("dialog", {
        name: "Visualização de Manual do sistema.pdf",
      })
    ).toBeInTheDocument();
    expect(await screen.findByLabelText("Página 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Página 2")).toBeInTheDocument();
    expect(getDocument).toHaveBeenCalledWith({ url: pdf.data });
    expect(workerSrc.workerSrc).toBe("/mock-pdf-worker.js");
    expect(pdfDocument.getPage).toHaveBeenCalledTimes(2);
  });

  it("limita o zoom entre 50% e 400%", async () => {
    render(<PdfViewer document={pdf} onClose={vi.fn()} />);
    await screen.findByLabelText("Página 1");

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
  });

  it("fecha pelo botão, pelo overlay e pela tecla Escape", async () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <PdfViewer document={pdf} onClose={onClose} />
    );

    fireEvent.click(screen.getByLabelText("Fechar visualização"));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("heading", { name: pdf.nome }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(3);

    rerender(<PdfViewer document={null} onClose={onClose} />);
    await waitFor(() => {
      expect(document.body).not.toHaveClass("pdf-viewer-open");
    });
  });

  it("exibe uma mensagem quando o formato não é PDF", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <PdfViewer
        document={{
          nome: "Manual legado.doc",
          tipo_arquivo: "doc",
          data: "https://example.com/manual.doc",
        }}
        onClose={vi.fn()}
      />
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível carregar ou exibir o documento."
    );
    expect(getDocument).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalled();
  });

  it("exibe uma mensagem quando o PDF não pode ser carregado", async () => {
    getDocument.mockReturnValue({
      promise: Promise.reject(new Error("PDF inválido")),
      destroy: vi.fn(),
    });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<PdfViewer document={pdf} onClose={vi.fn()} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível carregar ou exibir o documento."
    );
    expect(consoleError).toHaveBeenCalled();
  });
});
