import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DocumentModal from "./DocumentModal";

const document = {
  id: 1,
  code: "MIL-HDBK-5J",
  name: "Metalic Materials",
  type: "Técnico",
  category: "MIL-HDBK",
  updatedAt: "05/05/2004",
  accessLevel: "Gestor",
  revision: "5J",
  fileSize: "66.8 MB",
};

describe("DocumentModal", () => {
  it("não renderiza quando nenhum documento está selecionado", () => {
    const { container } = render(
      <DocumentModal
        document={null}
        onClose={vi.fn()}
        onViewPdf={vi.fn()}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("renderiza os dados do documento", () => {
    render(
      <DocumentModal
        document={document}
        onClose={vi.fn()}
        onViewPdf={vi.fn()}
      />,
    );

    expect(screen.getByText("MIL-HDBK-5J")).toBeInTheDocument();
    expect(screen.getByText("Metalic Materials")).toBeInTheDocument();
    expect(screen.getByText("Técnico")).toBeInTheDocument();
    expect(screen.getByText("Gestor")).toBeInTheDocument();
    expect(screen.getByText("66.8 MB")).toBeInTheDocument();
    expect(screen.getByText("Materiais metálicos")).toBeInTheDocument();
  });

  it("chama onClose ao clicar no botão Fechar", () => {
    const onClose = vi.fn();

    render(
      <DocumentModal
        document={document}
        onClose={onClose}
        onViewPdf={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Fechar" }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("chama onClose ao clicar no overlay", () => {
    const onClose = vi.fn();

    const { container } = render(
      <DocumentModal
        document={document}
        onClose={onClose}
        onViewPdf={vi.fn()}
      />,
    );

    fireEvent.click(
      container.querySelector(".document-modal-overlay"),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("chama onViewPdf ao clicar em Visualizar", () => {
    const onViewPdf = vi.fn();

    render(
      <DocumentModal
        document={document}
        onClose={vi.fn()}
        onViewPdf={onViewPdf}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /visualizar/i }),
    );

    expect(onViewPdf).toHaveBeenCalledWith(document);
  });
});
