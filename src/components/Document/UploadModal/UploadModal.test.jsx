import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import UploadModal from "./UploadModal";

describe("UploadModal", () => {
  it("não renderiza quando isOpen é false", () => {
    const { container } = render(<UploadModal isOpen={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("inicia com nível de acesso 'Básico' e exibe os setores e níveis corretos com acentuação", () => {
    render(<UploadModal isOpen={true} onClose={vi.fn()} />);

    const selectLevel = screen.getByLabelText(/Nível de acesso/i);
    expect(selectLevel.value).toBe("Básico");

    const levelOptions = Array.from(selectLevel.querySelectorAll("option")).map(
      (opt) => opt.textContent
    );
    expect(levelOptions).toEqual(["Básico", "Comercial", "Militar"]);
    expect(levelOptions).not.toContain("Operador");
    expect(levelOptions).not.toContain("operador");

    const selectSector = screen.getByLabelText(/Setor responsável/i);
    const sectorOptions = Array.from(selectSector.querySelectorAll("option")).map(
      (opt) => opt.textContent
    );
    expect(sectorOptions).toEqual([
      "Selecione um setor",
      "Técnico",
      "Normativo",
      "Jurídico",
      "Qualitativo",
    ]);
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

    // Permanece editável
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

    // Click na dropzone aciona o input
    fireEvent.click(dropzone);
    expect(clickSpy).toHaveBeenCalled();

    // Drag over e drag leave
    fireEvent.dragOver(dropzone);
    expect(dropzone).toHaveClass("dragging");

    fireEvent.dragLeave(dropzone);
    expect(dropzone).not.toHaveClass("dragging");

    // Drop de arquivo PDF
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
    fireEvent.change(screen.getByLabelText(/Setor responsável/i), {
      target: { value: "Técnico" },
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

    // Limpa o nome do documento
    fireEvent.change(screen.getByLabelText(/Nome do documento/i), {
      target: { value: "   " },
    });
    fireEvent.change(screen.getByLabelText(/Setor responsável/i), {
      target: { value: "Técnico" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Cadastrar documento" }));

    expect(
      screen.getByText("O nome do documento é obrigatório.")
    ).toBeInTheDocument();
  });

  it("não deve aceitar formulário com setor vazio", async () => {
    render(<UploadModal isOpen={true} onClose={vi.fn()} />);

    const fileInput = document.querySelector(".upload-file-input");
    const testFile = new File(["pdf"], "doc.pdf", { type: "application/pdf" });
    fireEvent.change(fileInput, { target: { files: [testFile] } });

    fireEvent.click(screen.getByRole("button", { name: "Cadastrar documento" }));

    expect(
      screen.getByText("O setor responsável é obrigatório.")
    ).toBeInTheDocument();
  });

  it("fecha o modal pelo botão Fechar, pelo botão Cancelar e pelo clique no overlay", () => {
    const handleClose = vi.fn();
    const { rerender } = render(<UploadModal isOpen={true} onClose={handleClose} />);

    // Fechar pelo botão X
    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Fechar pelo botão Cancelar
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(handleClose).toHaveBeenCalledTimes(2);

    // Fechar pelo clique no overlay
    const overlay = document.querySelector(".upload-modal-overlay");
    fireEvent.click(overlay);
    expect(handleClose).toHaveBeenCalledTimes(3);

    // Clique no conteúdo do modal não fecha
    const container = document.querySelector(".upload-modal-container");
    fireEvent.click(container);
    expect(handleClose).toHaveBeenCalledTimes(3);

    // Fechar pelo botão X na tela de sucesso
    rerender(
      <UploadModal
        isOpen={true}
        onClose={handleClose}
      />
    );
  });

  it("trata erro na criação do documento", async () => {
    const mockCreate = vi.fn().mockRejectedValue(new Error("Falha no servidor local"));

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

    fireEvent.change(screen.getByLabelText(/Setor responsável/i), {
      target: { value: "Técnico" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Cadastrar documento" }));

    expect(await screen.findByText("Falha no servidor local")).toBeInTheDocument();
  });

  it("realiza o upload com sucesso, chama onDocumentCreated e exibe o modal de feedback", async () => {
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

    fireEvent.change(screen.getByLabelText(/Setor responsável/i), {
      target: { value: "Técnico" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Cadastrar documento" }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        nome: "Manual de manutenção.pdf",
        setor: "Técnico",
        nivel: "Básico",
        file: testFile,
      });
      expect(handleCreated).toHaveBeenCalledWith({
        id_documento: 101,
        nome: "Manual de manutenção.pdf",
        setor: "Técnico",
      });
    });

    // Feedback modal (Imagem 2)
    expect(
      await screen.findByText("Documento cadastrado com sucesso!")
    ).toBeInTheDocument();
    expect(
      screen.getByText("O arquivo foi enviado e processado pela API local.")
    ).toBeInTheDocument();
    expect(screen.getByText("Manual de manutenção.pdf")).toBeInTheDocument();
    expect(screen.getByText("Técnico")).toBeInTheDocument();
    expect(
      screen.getByText("Você já pode visualizar ou editar este documento na listagem.")
    ).toBeInTheDocument();

    // Clicar em "Ver documento"
    const viewBtn = screen.getByRole("button", { name: "Ver documento" });
    fireEvent.click(viewBtn);

    // Botão "Cadastrar outro" retorna ao formulário de upload
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar outro" }));
    expect(
      screen.getByRole("heading", { name: "Cadastrar documento" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome do documento/i).value).toBe("");
  });
});
