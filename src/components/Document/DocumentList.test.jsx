import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DocumentList from "./DocumentList";

const documents = [
  {
    id: 1,
    name: "Documento A",
    type: "Técnico",
    accessLevel: "Gestor",
    updatedAt: "01/01/2026",
    fileType: "PDF",
  },
  {
    id: 2,
    name: "Documento B",
    type: "Normativo",
    accessLevel: "Público",
    updatedAt: "02/01/2026",
    fileType: "PDF",
  },
];

describe("DocumentList", () => {
  it("renderiza os documentos recebidos", () => {
    render(
      <DocumentList
        documents={documents}
        onView={vi.fn()}
      />,
    );

    expect(screen.getByText("Documento A")).toBeInTheDocument();
    expect(screen.getByText("Documento B")).toBeInTheDocument();
  });

  it("exibe a mensagem quando a lista está vazia", () => {
    render(
      <DocumentList
        documents={[]}
        onView={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Nenhum documento encontrado."),
    ).toBeInTheDocument();
  });

  it("renderiza os cabeçalhos da lista", () => {
    render(
      <DocumentList
        documents={documents}
        onView={vi.fn()}
      />,
    );

    expect(screen.getByText("Arquivo")).toBeInTheDocument();
    expect(screen.getByText("Nome do documento")).toBeInTheDocument();
    expect(screen.getByText("Setor/Tipo")).toBeInTheDocument();
    expect(screen.getByText("Atualizado")).toBeInTheDocument();
    expect(screen.getByText("Nível de Acesso")).toBeInTheDocument();
  });
});
