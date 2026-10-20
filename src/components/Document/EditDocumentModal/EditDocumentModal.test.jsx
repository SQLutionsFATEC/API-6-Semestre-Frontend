import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import EditDocumentModal from "./EditDocumentModal";

const documentMock = {
  id_documento: 10,
  nome: "Relatório financeiro.pdf",
  tipo_arquivo: "pdf",
  setor: "tecnico",
  nivel: "basico",
  etiquetas: [{ id_etiqueta: 1, nome: "financeiro" }],
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
    expect(screen.getByLabelText("Nível de acesso *")).toHaveValue("basico");
    expect(
      screen.getByText(/O arquivo não pode ser alterado nesta tela/)
    ).toBeInTheDocument();
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

    expect(
      screen.getByRole("option", { name: "Técnico" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Não atribuído" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Básico" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Operador" })
    ).toBeInTheDocument();
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

    fireEvent.click(
      screen.getByRole("button", { name: /Voltar aos detalhes/i })
    );

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

  it("fecha pelo botão X do cabeçalho", () => {
    const onClose = vi.fn();
    render(
      <EditDocumentModal
        document={documentMock}
        onClose={onClose}
        onBackToDetails={vi.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText("Fechar edição"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("fecha ao clicar no overlay", () => {
    const onClose = vi.fn();
    render(
      <EditDocumentModal
        document={documentMock}
        onClose={onClose}
        onBackToDetails={vi.fn()}
      />
    );

    fireEvent.click(
      globalThis.document.querySelector(".edit-document-overlay")
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("não fecha ao clicar dentro do modal", () => {
    const onClose = vi.fn();
    render(
      <EditDocumentModal
        document={documentMock}
        onClose={onClose}
        onBackToDetails={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Editar documento"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("cancela pelo botão Cancelar", () => {
    const onClose = vi.fn();
    render(
      <EditDocumentModal
        document={documentMock}
        onClose={onClose}
        onBackToDetails={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("valida setor obrigatório antes de enviar", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const updateDocumentFn = vi.fn();

    render(
      <EditDocumentModal
        document={{ ...documentMock, setor: "" }}
        onClose={vi.fn()}
        onBackToDetails={vi.fn()}
        updateDocumentFn={updateDocumentFn}
      />
    );

    const submitButton = screen.getByRole("button", {
      name: "Salvar alterações",
    });
    const form = submitButton.closest("form");

    // Desativa a validação nativa do HTML5 (o select tem required)
    // para garantir que o onSubmit do React rode mesmo com setor vazio.
    form.noValidate = true;

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "O setor responsável é obrigatório."
      );
    });
    expect(updateDocumentFn).not.toHaveBeenCalled();
  });

  it("alerta quando o documento não tem id para edição", () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const updateDocumentFn = vi.fn();

    render(
      <EditDocumentModal
        document={{ ...documentMock, id_documento: undefined }}
        onClose={vi.fn()}
        onBackToDetails={vi.fn()}
        updateDocumentFn={updateDocumentFn}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(alertSpy).toHaveBeenCalledWith(
      "Não foi possível identificar o documento para edição."
    );
    expect(updateDocumentFn).not.toHaveBeenCalled();
  });

  it("exibe erro de detalhe retornado pela API ao falhar ao salvar", async () => {
    const updateDocumentFn = vi.fn().mockRejectedValue({
      response: { data: { detail: "Nome inválido" } },
    });

    render(
      <EditDocumentModal
        document={documentMock}
        onClose={vi.fn()}
        onBackToDetails={vi.fn()}
        updateDocumentFn={updateDocumentFn}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Nome inválido"
    );
  });

  it("usa a mensagem do erro quando a API não retorna detalhe", async () => {
    const updateDocumentFn = vi
      .fn()
      .mockRejectedValue(new Error("Network error"));

    render(
      <EditDocumentModal
        document={documentMock}
        onClose={vi.fn()}
        onBackToDetails={vi.fn()}
        updateDocumentFn={updateDocumentFn}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Network error"
    );
  });

  it("usa mensagem padrão quando o erro não traz mensagem", async () => {
    const updateDocumentFn = vi.fn().mockRejectedValue({});

    render(
      <EditDocumentModal
        document={documentMock}
        onClose={vi.fn()}
        onBackToDetails={vi.fn()}
        updateDocumentFn={updateDocumentFn}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível salvar as alterações."
    );
  });

  it("remove etiqueta selecionada", () => {
    render(
      <EditDocumentModal
        document={documentMock}
        onClose={vi.fn()}
        onBackToDetails={vi.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Remover etiqueta financeiro" })
    );

    expect(screen.queryByText("financeiro")).not.toBeInTheDocument();
  });

  it("não mostra opções que já estão selecionadas", async () => {
    const fetchTagsFn = vi.fn().mockResolvedValue([
      { id_etiqueta: 1, nome: "financeiro" },
      { id_etiqueta: 2, nome: "nova" },
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
      target: { value: "fin" },
    });

    await screen.findByRole("option", { name: /nova/i });
    expect(
      screen.queryByRole("option", { name: /^financeiro$/i })
    ).not.toBeInTheDocument();
  });

  it("fecha as opções ao pressionar Escape", async () => {
    const fetchTagsFn = vi
      .fn()
      .mockResolvedValue([{ id_etiqueta: 2, nome: "nova" }]);

    render(
      <EditDocumentModal
        document={documentMock}
        onClose={vi.fn()}
        onBackToDetails={vi.fn()}
        fetchTagsFn={fetchTagsFn}
      />
    );

    const input = screen.getByLabelText("Etiquetas");
    fireEvent.change(input, { target: { value: "nov" } });
    await screen.findByRole("option", { name: /nova/i });

    fireEvent.keyDown(input, { key: "Escape" });
    expect(
      screen.queryByRole("option", { name: /nova/i })
    ).not.toBeInTheDocument();
  });

  it("seleciona a primeira opção com Enter", async () => {
    const fetchTagsFn = vi.fn().mockResolvedValue([
      { id_etiqueta: 5, nome: "nova1" },
      { id_etiqueta: 6, nome: "nova2" },
    ]);

    render(
      <EditDocumentModal
        document={documentMock}
        onClose={vi.fn()}
        onBackToDetails={vi.fn()}
        fetchTagsFn={fetchTagsFn}
      />
    );

    const input = screen.getByLabelText("Etiquetas");
    fireEvent.change(input, { target: { value: "nov" } });
    await screen.findByRole("option", { name: /nova1/i });

    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.getByText("nova1")).toBeInTheDocument();
  });

  it("mostra mensagem quando nenhuma etiqueta é encontrada", async () => {
    const fetchTagsFn = vi.fn().mockResolvedValue([]);

    render(
      <EditDocumentModal
        document={documentMock}
        onClose={vi.fn()}
        onBackToDetails={vi.fn()}
        fetchTagsFn={fetchTagsFn}
      />
    );

    fireEvent.change(screen.getByLabelText("Etiquetas"), {
      target: { value: "xyz" },
    });

    expect(
      await screen.findByText("Nenhuma etiqueta encontrada.")
    ).toBeInTheDocument();
  });

  it("trata erro na busca de etiquetas sem quebrar o formulário", async () => {
    const fetchTagsFn = vi.fn().mockRejectedValue(new Error("boom"));

    render(
      <EditDocumentModal
        document={documentMock}
        onClose={vi.fn()}
        onBackToDetails={vi.fn()}
        fetchTagsFn={fetchTagsFn}
      />
    );

    fireEvent.change(screen.getByLabelText("Etiquetas"), {
      target: { value: "nov" },
    });

    expect(
      await screen.findByText("Nenhuma etiqueta encontrada.")
    ).toBeInTheDocument();
  });

  it("renderiza sem etiquetas quando o documento não possui etiquetas", () => {
    render(
      <EditDocumentModal
        document={{ ...documentMock, etiquetas: undefined }}
        onClose={vi.fn()}
        onBackToDetails={vi.fn()}
      />
    );

    expect(screen.queryByText("financeiro")).not.toBeInTheDocument();
  });

  it("reconhece o setor NAO_ATRIBUIDO", () => {
    render(
      <EditDocumentModal
        document={{ ...documentMock, setor: "NAO_ATRIBUIDO" }}
        onClose={vi.fn()}
        onBackToDetails={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Setor responsável *")).toHaveValue(
      "NAO_ATRIBUIDO"
    );
  });

  it("não busca etiquetas quando a busca tem menos de 2 caracteres", async () => {
    const fetchTagsFn = vi.fn();

    render(
      <EditDocumentModal
        document={documentMock}
        onClose={vi.fn()}
        onBackToDetails={vi.fn()}
        fetchTagsFn={fetchTagsFn}
      />
    );

    fireEvent.change(screen.getByLabelText("Etiquetas"), {
      target: { value: "a" },
    });

    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(fetchTagsFn).not.toHaveBeenCalled();
  });

  it("reexibe opções ao focar o campo depois de fechar com Escape", async () => {
    const fetchTagsFn = vi
      .fn()
      .mockResolvedValue([{ id_etiqueta: 2, nome: "nova" }]);

    render(
      <EditDocumentModal
        document={documentMock}
        onClose={vi.fn()}
        onBackToDetails={vi.fn()}
        fetchTagsFn={fetchTagsFn}
      />
    );

    const input = screen.getByLabelText("Etiquetas");
    fireEvent.change(input, { target: { value: "nov" } });
    await screen.findByRole("option", { name: /nova/i });

    fireEvent.keyDown(input, { key: "Escape" });
    expect(
      screen.queryByRole("option", { name: /nova/i })
    ).not.toBeInTheDocument();

    fireEvent.focus(input);
    expect(
      screen.getByRole("option", { name: /nova/i })
    ).toBeInTheDocument();
  });
});