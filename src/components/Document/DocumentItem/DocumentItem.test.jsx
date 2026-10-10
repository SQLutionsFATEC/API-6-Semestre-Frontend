import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DocumentItem from "./DocumentItem";

const documentData = {
  id_documento: 1,
  tipo_arquivo: "pdf",
  nome: "Manual do sistema.pdf",
  setor: "Engenharia",
  data_atualizacao: "2026-09-20T12:00:00Z",
  nivel: "Publico",
};

describe("DocumentItem", () => {
  it("exibe os dados do documento", () => {
    render(<DocumentItem document={documentData} onView={vi.fn()} />);

    expect(screen.getByText(documentData.nome)).toBeInTheDocument();
    expect(screen.getByText(documentData.setor)).toBeInTheDocument();
    expect(screen.getByText(documentData.nivel)).toBeInTheDocument();
    expect(screen.getByText(documentData.tipo_arquivo)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Visualizar" })
    ).toBeInTheDocument();
  });

  it("formata a data de atualizacao no padrao pt-BR", () => {
    render(<DocumentItem document={documentData} onView={vi.fn()} />);

    expect(screen.getByText("20/09/2026")).toBeInTheDocument();
  });

  it("exibe '-' quando nao ha data de atualizacao", () => {
    render(
      <DocumentItem
        document={{ ...documentData, data_atualizacao: "" }}
        onView={vi.fn()}
      />
    );

    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("exibe a data original quando ela e invalida", () => {
    render(
      <DocumentItem
        document={{ ...documentData, data_atualizacao: "data-invalida" }}
        onView={vi.fn()}
      />
    );

    expect(screen.getByText("data-invalida")).toBeInTheDocument();
  });

  it("gera as classes css a partir do setor e do nivel", () => {
    const { container } = render(
      <DocumentItem document={documentData} onView={vi.fn()} />
    );

    expect(container.querySelector(".type-engenharia")).toBeInTheDocument();
    expect(container.querySelector(".access-publico")).toBeInTheDocument();
  });

  it("nao quebra quando setor e nivel estao ausentes", () => {
    const { container } = render(
      <DocumentItem
        document={{
          ...documentData,
          setor: undefined,
          nivel: undefined,
        }}
        onView={vi.fn()}
      />
    );

    expect(container.querySelector(".type-badge")).toBeInTheDocument();
    expect(container.querySelector(".access-badge")).toBeInTheDocument();
  });

  it("chama onView com o documento ao clicar em Visualizar", () => {
    const onView = vi.fn();
    render(<DocumentItem document={documentData} onView={onView} />);

    fireEvent.click(screen.getByRole("button", { name: "Visualizar" }));

    expect(onView).toHaveBeenCalledWith(documentData);
  });

  it("chama onOpenDetails ao clicar em qualquer lugar do cartão", () => {
    const onOpenDetails = vi.fn();
    const onView = vi.fn();
    render(
      <DocumentItem
        document={documentData}
        onView={onView}
        onOpenDetails={onOpenDetails}
      />
    );

    fireEvent.click(screen.getByText(documentData.nome));

    expect(onOpenDetails).toHaveBeenCalledWith(documentData);
    expect(onView).not.toHaveBeenCalled();
  });

  it("chama onView e impede propagação ao clicar no botão de visualizar", () => {
    const onOpenDetails = vi.fn();
    const onView = vi.fn();
    render(
      <DocumentItem
        document={documentData}
        onView={onView}
        onOpenDetails={onOpenDetails}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Visualizar" }));

    expect(onView).toHaveBeenCalledWith(documentData);
    expect(onOpenDetails).not.toHaveBeenCalled();
  });

  it("exibe inequivocamente o ícone de cadeado para documentos restritos", () => {
    const restrictedDoc = {
      ...documentData,
      nivel: "Militar",
      acesso_permitido: false,
    };

    const { container } = render(
      <DocumentItem document={restrictedDoc} onView={vi.fn()} />
    );

    expect(screen.getByTestId("lock-icon")).toBeInTheDocument();
    expect(container.querySelector(".access-restricted")).toBeInTheDocument();
    expect(container.querySelector(".access-lock-icon")).toBeInTheDocument();
  });

  it("chama onOpenDetails ao clicar no botão de cadeado de um documento restrito", () => {
    const onOpenDetails = vi.fn();
    const onView = vi.fn();
    const restrictedDoc = {
      ...documentData,
      acesso_permitido: false,
    };
    render(
      <DocumentItem
        document={restrictedDoc}
        onView={onView}
        onOpenDetails={onOpenDetails}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Visualizar" }));

    expect(onOpenDetails).toHaveBeenCalledWith(restrictedDoc);
    expect(onView).not.toHaveBeenCalled();
  });
});
