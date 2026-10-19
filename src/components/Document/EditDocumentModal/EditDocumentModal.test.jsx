import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import EditDocumentModal from "./EditDocumentModal";

const documentMock = {
  id_documento: 10,
  nome: "Relatório financeiro.pdf",
  tipo_arquivo: "pdf",
  setor: "tecnico",
  nivel: "basico",
  etiquetas: [
    { id_etiqueta: 1, nome: "financeiro" },
  ],
  acesso_permitido: true,
};

describe("EditDocumentModal", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("exibe os dados do documento e mantém o arquivo não editável", () => {
    render(
      <EditDocumentModal
        document={documentMock}
        onClose={vi.fn()}
        onBackToDetails={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Nome do documento *")).toHaveValue(
      "Relatório financeiro.pdf"
    );
    expect(screen.getByLabelText("Setor responsável *")).toHaveValue(
      "tecnico"
    );
    expect(screen.getByLabelText("Nível de acesso *")).toHaveValue(
      "basico"
    );
    expect(screen.getByText(/O arquivo não pode ser alterado nesta tela/)).toBeInTheDocument();
    expect(screen.getByText("financeiro")).toBeInTheDocument();
  });

  it("exibe os setores e níveis com os rótulos corretos", () => {
    render(
      <EditDocumentModal
        document={documentMock}
        onClose={vi.fn()}
        onBackToDetails={vi.fn()}
      />
    );

    expect(screen.getByRole("option", { name: "Técnico" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Não atribuído" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Básico" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Operador" })).toBeInTheDocument();
  });

  it("valida o nome com alert antes de enviar", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const updateDocumentFn = vi.fn();

    render(
      <EditDocumentModal
        document={documentMock}
        onClose={vi.fn()}
        onBackToDetails={vi.fn()}
        updateDocumentFn={updateDocumentFn}
      />
    );

    fireEvent.change(screen.getByLabelText("Nome do documento *"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(alertSpy).toHaveBeenCalledWith(
      "O nome do documento é obrigatório."
    );
    expect(updateDocumentFn).not.toHaveBeenCalled();
  });

  it("retorna aos detalhes ao clicar no botão", () => {
    const onBackToDetails = vi.fn();

    render(
      <EditDocumentModal
        document={documentMock}
        onClose={vi.fn()}
        onBackToDetails={onBackToDetails}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Voltar aos detalhes/i }));

    expect(onBackToDetails).toHaveBeenCalledTimes(1);
  });

  it("pesquisa e permite selecionar etiquetas", async () => {
    const fetchTagsFn = vi.fn().mockResolvedValue([
      { id_etiqueta: 2, nome: "financeiro anual" },
    ]);

    render(
      <EditDocumentModal
        document={documentMock}
        onClose={vi.fn()}
        onBackToDetails={vi.fn()}
        fetchTagsFn={fetchTagsFn}
      />
    );

    fireEvent.change(screen.getByLabelText("Etiquetas"), {
      target: { value: "anual" },
    });

    await waitFor(() => {
      expect(fetchTagsFn).toHaveBeenCalledWith("anual");
    });

    fireEvent.click(
      await screen.findByRole("option", { name: /financeiro anual/i })
    );

    expect(screen.getByText("financeiro")).toBeInTheDocument();
    expect(screen.getByText("financeiro anual")).toBeInTheDocument();
  });

  it("envia os valores internos ao salvar", async () => {
    const updateDocumentFn = vi.fn().mockResolvedValue({
      id_documento: 10,
      nome: "Relatório atualizado",
      setor: "juridico",
      nivel: "operador",
    });
    const onDocumentUpdated = vi.fn();

    render(
      <EditDocumentModal
        document={documentMock}
        onClose={vi.fn()}
        onBackToDetails={vi.fn()}
        onDocumentUpdated={onDocumentUpdated}
        updateDocumentFn={updateDocumentFn}
      />
    );

    fireEvent.change(screen.getByLabelText("Nome do documento *"), {
      target: { value: "Relatório atualizado" },
    });
    fireEvent.change(screen.getByLabelText("Setor responsável *"), {
      target: { value: "juridico" },
    });
    fireEvent.change(screen.getByLabelText("Nível de acesso *"), {
      target: { value: "operador" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => {
      expect(updateDocumentFn).toHaveBeenCalledWith(10, {
        nome: "Relatório atualizado",
        setor: "juridico",
        nivel: "operador",
        etiquetas: [1],
      });
    });

    expect(onDocumentUpdated).toHaveBeenCalled();
  });
});
