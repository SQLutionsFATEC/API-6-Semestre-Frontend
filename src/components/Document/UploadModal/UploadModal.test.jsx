import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import UploadModal from "./UploadModal";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("UploadModal", () => {
  it("não renderiza quando isOpen é false", () => {
    const { container } = render(<UploadModal isOpen={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("inicia com nível de acesso 'Básico' e exibe os níveis corretos com acentuação", () => {
    render(<UploadModal isOpen={true} onClose={vi.fn()} />);

    const selectLevel = screen.getByLabelText(/Nível de acesso/i);
    expect(selectLevel.value).toBe("Básico");

    const levelOptions = Array.from(selectLevel.querySelectorAll("option")).map(
      (opt) => opt.textContent
    );
    expect(levelOptions).toEqual(["Básico", "Comercial", "Militar"]);
    expect(levelOptions).not.toContain("Operador");
    expect(levelOptions).not.toContain("operador");

    expect(screen.queryByLabelText(/Setor responsável/i)).not.toBeInTheDocument();
  });

  it("permite alterar o nível de acesso", () => {
    render(<UploadModal isOpen={true} onClose={vi.fn()} />);

    const selectLevel = screen.getByLabelText(/Nível de acesso/i);
    fireEvent.change(selectLevel, { target: { value: "Militar" } });
    expect(selectLevel.value).toBe("Militar");
  });

  it("preenche automaticamente o nome do documento com o nome do arquivo anexado e permite edição", () => {
    render(<UploadModal isOpen={true} onClose={vi.fn()} />);

    const fileInput = document.querySelector(".upload-file-input");
    const testFile = new File(["dummy pdf content"], "Manual de manutenção.pdf", {
      type: "application/pdf",
    });

    fireEvent.change(fileInput, { target: { files: [testFile] } });

    const nameInput = screen.getByLabelText(/Nome do documento/i);
    expect(nameInput.value).toBe("Manual de manutenção.pdf");

    fireEvent.change(nameInput, { target: { value: "Manual Editado 2026" } });
    expect(nameInput.value).toBe("Manual Editado 2026");
  });

  it("suporta interação de drag and drop e clique na área de upload", () => {
    render(<UploadModal isOpen={true} onClose={vi.fn()} />);

    const dropzone = screen.getByRole("button", {
      name: /Selecionar arquivo PDF/i,
    });
    const fileInput = document.querySelector(".upload-file-input");
    const clickSpy = vi.spyOn(fileInput, "click");

    fireEvent.click(dropzone);
    expect(clickSpy).toHaveBeenCalled();

    fireEvent.dragOver(dropzone);
    expect(dropzone).toHaveClass("dragging");

    fireEvent.dragLeave(dropzone);
    expect(dropzone).not.toHaveClass("dragging");

    const testFile = new File(["conteudo"], "relatorio.pdf", {
      type: "application/pdf",
    });
    fireEvent.drop(dropzone, { dataTransfer: { files: [testFile] } });

    expect(screen.getByLabelText(/Nome do documento/i).value).toBe("relatorio.pdf");
  });

  it("rejeita arquivos que não são do formato PDF", () => {
    render(<UploadModal isOpen={true} onClose={vi.fn()} />);

    const fileInput = document.querySelector(".upload-file-input");
    const invalidFile = new File(["image"], "foto.png", { type: "image/png" });

    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    expect(
      screen.getByText("Apenas arquivos no formato PDF são permitidos.")
    ).toBeInTheDocument();
  });

  it("não deve aceitar cadastro sem documento anexado", async () => {
    render(<UploadModal isOpen={true} onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/Nome do documento/i), {
      target: { value: "Meu Documento" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Cadastrar documento" }));

    expect(
      screen.getByText("Cadastro sem documento anexado não é permitido.")
    ).toBeInTheDocument();
  });

  it("não deve aceitar formulário com nome vazio", async () => {
    render(<UploadModal isOpen={true} onClose={vi.fn()} />);

    const fileInput = document.querySelector(".upload-file-input");
    const testFile = new File(["pdf"], "doc.pdf", { type: "application/pdf" });
    fireEvent.change(fileInput, { target: { files: [testFile] } });

    fireEvent.change(screen.getByLabelText(/Nome do documento/i), {
      target: { value: "   " },
    });

    fireEvent.click(screen.getByRole("button", { name: "Cadastrar documento" }));

    expect(
      screen.getByText("O nome do documento é obrigatório.")
    ).toBeInTheDocument();
  });

  it("fecha o modal pelo botão Fechar, pelo botão Cancelar e pelo clique no overlay", () => {
    const handleClose = vi.fn();
    const { rerender } = render(<UploadModal isOpen={true} onClose={handleClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(handleClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(handleClose).toHaveBeenCalledTimes(2);

    const overlay = document.querySelector(".upload-modal-overlay");
    fireEvent.click(overlay);
    expect(handleClose).toHaveBeenCalledTimes(3);

    const container = document.querySelector(".upload-modal-container");
    fireEvent.click(container);
    expect(handleClose).toHaveBeenCalledTimes(3);

    rerender(<UploadModal isOpen={true} onClose={handleClose} />);
  });

  it("trata erro na criação do documento", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const mockCreate = vi.fn().mockRejectedValue({
      message: "Request failed with status code 400",
      response: {
        data: {
          erro: "Não foi possível gerar o embedding no Ollama.",
        },
      },
    });

    render(
      <UploadModal
        isOpen={true}
        onClose={vi.fn()}
        createDocumentFn={mockCreate}
      />
    );

    const fileInput = document.querySelector(".upload-file-input");
    const testFile = new File(["pdf content"], "Manual.pdf", { type: "application/pdf" });
    fireEvent.change(fileInput, { target: { files: [testFile] } });

    fireEvent.click(screen.getByRole("button", { name: "Cadastrar documento" }));

    expect(
      await screen.findByText("Não foi possível gerar o embedding no Ollama.")
    ).toBeInTheDocument();
    expect(alertSpy).toHaveBeenCalledWith(
      "Não foi possível gerar o embedding no Ollama."
    );
  });

  it("realiza o upload com sucesso, chama onDocumentCreated e exibe o modal de detalhes", async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      id_documento: 101,
      nome: "Manual de manutenção.pdf",
      setor: "Técnico",
    });
    const handleCreated = vi.fn();

    render(
      <UploadModal
        isOpen={true}
        onClose={vi.fn()}
        createDocumentFn={mockCreate}
        onDocumentCreated={handleCreated}
      />
    );

    const fileInput = document.querySelector(".upload-file-input");
    const testFile = new File(["pdf content"], "Manual de manutenção.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(fileInput, { target: { files: [testFile] } });

    fireEvent.click(screen.getByRole("button", { name: "Cadastrar documento" }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        nome: "Manual de manutenção.pdf",
        nivel: "Básico",
        file: testFile,
      });
      expect(handleCreated).toHaveBeenCalledWith({
        id_documento: 101,
        nome: "Manual de manutenção.pdf",
        setor: "Técnico",
      });
    });


    expect(await screen.findByText("Documento cadastrado com sucesso!")).toBeInTheDocument();
    
    const viewBtn = screen.getByRole("button", { name: "Ver documento" });
    fireEvent.click(viewBtn);
    
    expect(
      await screen.findByRole("dialog", { name: "Detalhes do documento" })
    ).toBeInTheDocument();
    expect(screen.getByText("Tags")).toBeInTheDocument();
    expect(screen.getByText("Técnico")).toBeInTheDocument();
  });

  it("limpa o formulário ao clicar em Cadastrar outro na tela de sucesso", async () => {
    const mockCreate = vi.fn().mockResolvedValue({ id_documento: 101 });

    render(
      <UploadModal
        isOpen={true}
        onClose={vi.fn()}
        createDocumentFn={mockCreate}
      />
    );

    const testFile = new File(["pdf content"], "Manual.pdf", { type: "application/pdf" });
    fireEvent.change(document.querySelector(".upload-file-input"), { target: { files: [testFile] } });
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar documento" }));
    
    await screen.findByText("Documento cadastrado com sucesso!");
    
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar outro" }));
    expect(screen.getByRole("heading", { name: "Cadastrar documento" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome do documento/i).value).toBe("");
  });

  it("cobre falha na API sem detalhes (fallback genérico de erro)", async () => {
    const mockCreate = vi.fn().mockRejectedValue({ message: "" });
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(
      <UploadModal isOpen={true} onClose={vi.fn()} createDocumentFn={mockCreate} />
    );

    const fileInput = document.querySelector(".upload-file-input");
    fireEvent.change(fileInput, {
      target: { files: [new File(["pdf"], "doc.pdf", { type: "application/pdf" })] },
    });

    fireEvent.click(screen.getByRole("button", { name: "Cadastrar documento" }));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Não foi possível cadastrar o documento.");
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível cadastrar o documento."
    );
  });

  it("fecha o modal pelo X na tela de sucesso e cobre clique fora na mesma tela", async () => {
    const handleClose = vi.fn();
    const { container } = render(
      <UploadModal
        isOpen={true}
        onClose={handleClose}
        createDocumentFn={vi.fn().mockResolvedValue({ id_documento: 1 })}
      />
    );

    fireEvent.change(document.querySelector(".upload-file-input"), {
      target: { files: [new File(["pdf"], "doc.pdf", { type: "application/pdf" })] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar documento" }));

    await screen.findByText("Documento cadastrado com sucesso!");

    const overlay = container.querySelector(".upload-modal-overlay");
    fireEvent.click(overlay);
    expect(handleClose).toHaveBeenCalledTimes(1);

    const closeBtn = screen.getByRole("button", { name: "Fechar" });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it("desabilita os campos de entrada durante o envio (isSubmitting)", async () => {
    const mockCreate = vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));

    render(
      <UploadModal isOpen={true} onClose={vi.fn()} createDocumentFn={mockCreate} />
    );

    const fileInput = document.querySelector(".upload-file-input");
    fireEvent.change(fileInput, {
      target: { files: [new File(["pdf"], "doc.pdf", { type: "application/pdf" })] },
    });

    const nameInput = screen.getByLabelText(/Nome do documento/i);
    const levelSelect = screen.getByLabelText(/Nível de acesso/i);
    expect(nameInput).not.toBeDisabled();
    expect(levelSelect).not.toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Cadastrar documento" }));

    await waitFor(() => {
      expect(nameInput).toBeDisabled();
      expect(levelSelect).toBeDisabled();
    });
  });
});
