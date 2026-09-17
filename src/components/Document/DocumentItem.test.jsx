import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DocumentItem from "./DocumentItem";

const document = {
  id: 1,
  name: "Documento de teste",
  type: "Técnico",
  accessLevel: "Gestor",
  updatedAt: "05/05/2004",
  fileType: "PDF",
};

describe("DocumentItem", () => {
  it("renderiza as informações do documento", () => {
    render(
      <DocumentItem
        document={document}
        onView={vi.fn()}
      />,
    );

    expect(screen.getByText("PDF")).toBeInTheDocument();
    expect(screen.getByText("Documento de teste")).toBeInTheDocument();
    expect(screen.getByText("Técnico")).toBeInTheDocument();
    expect(screen.getByText("Gestor")).toBeInTheDocument();
    expect(screen.getByText("05/05/2004")).toBeInTheDocument();
  });

  it("chama onView com o documento ao clicar em Visualizar", () => {
    const onView = vi.fn();

    render(
      <DocumentItem
        document={document}
        onView={onView}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /visualizar/i }));

    expect(onView).toHaveBeenCalledTimes(1);
    expect(onView).toHaveBeenCalledWith(document);
  });

  it("aplica as classes baseadas no tipo e no nível de acesso", () => {
    const { container } = render(
      <DocumentItem
        document={document}
        onView={vi.fn()}
      />,
    );

    expect(
      container.querySelector(".type-técnico"),
    ).toBeInTheDocument();

    expect(
      container.querySelector(".access-gestor"),
    ).toBeInTheDocument();
  });
});
