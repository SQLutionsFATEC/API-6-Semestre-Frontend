import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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
  it("exibe os metadados e as etiquetas retornados pela API", () => {
    renderModal();

    expect(screen.getByText("Manual de teste.pdf")).toBeInTheDocument();
    expect(screen.getByText("Engenharia")).toBeInTheDocument();
    expect(screen.getByText("Publico")).toBeInTheDocument();
    expect(screen.getByText("Tecnico")).toBeInTheDocument();
    expect(screen.getByText("Aprovado")).toBeInTheDocument();
  });

  it("informa quando o documento nao possui etiquetas", () => {
    renderModal({ document: { ...documentData, etiquetas: [] } });

    expect(screen.getByText("Nenhuma etiqueta atribuida.")).toBeInTheDocument();
  });

  it("fecha pelo botao e pelo clique no overlay, mas nao pelo conteudo", () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    fireEvent.click(screen.getByText("Manual de teste.pdf"));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText("Fechar"));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(globalThis.document.querySelector(".document-modal-overlay"));
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

    expect(screen.getByRole("button", { name: "Visualizar" })).toBeDisabled();
  });
});
