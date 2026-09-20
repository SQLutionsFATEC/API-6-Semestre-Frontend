import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DocumentList from "../../components/Document/DocumentList/DocumentList";

vi.mock("../../components/Document/DocumentItem/DocumentItem", () => ({
  default: ({ document, onView }) => (
    <div data-testid="document-item">
      <span>{document.nome}</span>
      <button onClick={() => onView(document)}>Visualizar</button>
    </div>
  ),
}));

describe("DocumentList", () => {
  it("renderiza os cabeçalhos da lista", () => {
    render(<DocumentList documents={[]} onView={vi.fn()} />);

    expect(screen.getByText("Arquivo")).toBeInTheDocument();
    expect(screen.getByText("Nome do documento")).toBeInTheDocument();
    expect(screen.getByText("Setor/Tipo")).toBeInTheDocument();
    expect(screen.getByText("Atualizado")).toBeInTheDocument();
    expect(screen.getByText("Nível de Acesso")).toBeInTheDocument();
  });

  it("renderiza os documentos recebidos", () => {
    const documents = [
      { id: 1, nome: "Documento 1" },
      { id: 2, nome: "Documento 2" },
    ];

    render(<DocumentList documents={documents} onView={vi.fn()} />);

    expect(screen.getAllByTestId("document-item")).toHaveLength(2);
    expect(screen.getByText("Documento 1")).toBeInTheDocument();
    expect(screen.getByText("Documento 2")).toBeInTheDocument();
  });

  it("exibe mensagem quando não existem documentos", () => {
    render(<DocumentList documents={[]} onView={vi.fn()} />);

    expect(
      screen.getByText("Nenhum documento encontrado.")
    ).toBeInTheDocument();
  });

  it("chama onView ao visualizar um documento", async () => {
    const onView = vi.fn();
    const document = { id: 1, nome: "Documento 1" };

    render(<DocumentList documents={[document]} onView={onView} />);

    fireEvent.click(screen.getByRole("button", { name: "Visualizar" }));

    expect(onView).toHaveBeenCalledWith(document);
  });
});
