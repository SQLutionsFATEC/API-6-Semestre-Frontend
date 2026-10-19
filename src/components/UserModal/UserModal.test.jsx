import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import UserModal from "./UserModal";

const mockUser = {
  name: "João Silva",
  email: "joao@teste.com",
  role: "Técnico",
  level: "Nível 1",
};

describe("UserModal", () => {
  it("não renderiza nada quando isOpen é false", () => {
    const { container } = render(
      <UserModal isOpen={false} onClose={() => {}} user={mockUser} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renderiza os dados padrão quando user não é informado", () => {
    render(<UserModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText("Nome do usuário")).toBeInTheDocument();
    expect(screen.getByText("NomeUltimoNome@gmail.com")).toBeInTheDocument();
    expect(screen.getByText("Técnico")).toBeInTheDocument();
    expect(screen.getByText("Nível 1")).toBeInTheDocument();
  });

  it("exibe os dados do usuário no modo visualização", () => {
    render(<UserModal isOpen={true} onClose={() => {}} user={mockUser} />);
    expect(screen.getByText("João Silva")).toBeInTheDocument();
    expect(screen.getByText("joao@teste.com")).toBeInTheDocument();
    expect(screen.getByText("Cargo")).toBeInTheDocument();
    expect(screen.getByText("Técnico")).toBeInTheDocument();
    expect(screen.getByText("Nível de Acesso")).toBeInTheDocument();
    expect(screen.getByText("Nível 1")).toBeInTheDocument();
  });

  it("fecha o modal ao clicar fora (backdrop)", () => {
    const onClose = vi.fn();
    const { container } = render(
      <UserModal isOpen={true} onClose={onClose} user={mockUser} />
    );
    const backdrop = container.querySelector(".user-modal-backdrop");
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("não fecha o modal ao clicar dentro do card", () => {
    const onClose = vi.fn();
    const { container } = render(
      <UserModal isOpen={true} onClose={onClose} user={mockUser} />
    );
    const card = container.querySelector(".user-modal-card");
    fireEvent.click(card);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("muda para modo edição ao clicar em Editar informações", () => {
    render(<UserModal isOpen={true} onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText(/Editar informações/i));
    expect(screen.getByDisplayValue("João Silva")).toBeInTheDocument();
    expect(screen.getByDisplayValue("joao@teste.com")).toBeInTheDocument();
    expect(screen.getByText(/Concluir edição/i)).toBeInTheDocument();
    expect(screen.getByText(/Cancelar/i)).toBeInTheDocument();
  });

  it("cancela a edição e restaura os valores originais ao clicar em Cancelar", () => {
    render(<UserModal isOpen={true} onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText(/Editar informações/i));

    const nameInput = screen.getByDisplayValue("João Silva");
    fireEvent.change(nameInput, { target: { value: "Nome Alterado" } });
    expect(screen.getByDisplayValue("Nome Alterado")).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Cancelar/i));

    expect(screen.getByText("João Silva")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Nome Alterado")).not.toBeInTheDocument();
  });

  it("valida campo nome vazio ao salvar", () => {
    render(<UserModal isOpen={true} onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText(/Editar informações/i));

    const nameInput = screen.getByDisplayValue("João Silva");
    fireEvent.change(nameInput, { target: { value: "   " } });
    fireEvent.click(screen.getByText(/Concluir edição/i));

    expect(screen.getByText(/O nome não pode estar vazio/i)).toBeInTheDocument();
  });

  it("valida campo email vazio ao salvar", () => {
    render(<UserModal isOpen={true} onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText(/Editar informações/i));

    const emailInput = screen.getByDisplayValue("joao@teste.com");
    fireEvent.change(emailInput, { target: { value: "" } });
    fireEvent.click(screen.getByText(/Concluir edição/i));

    expect(screen.getByText(/O email não pode estar vazio/i)).toBeInTheDocument();
  });

  it("valida ambos os campos vazios simultaneamente ao salvar", () => {
    render(<UserModal isOpen={true} onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText(/Editar informações/i));

    const nameInput = screen.getByDisplayValue("João Silva");
    const emailInput = screen.getByDisplayValue("joao@teste.com");

    fireEvent.change(nameInput, { target: { value: "" } });
    fireEvent.change(emailInput, { target: { value: "" } });
    fireEvent.click(screen.getByText(/Concluir edição/i));

    expect(screen.getByText(/O nome não pode estar vazio/i)).toBeInTheDocument();
    expect(screen.getByText(/O email não pode estar vazio/i)).toBeInTheDocument();
  });

  it("limpa os erros dos campos individualmente ao alterar os inputs", () => {
    render(<UserModal isOpen={true} onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText(/Editar informações/i));

    const nameInput = screen.getByDisplayValue("João Silva");
    const emailInput = screen.getByDisplayValue("joao@teste.com");

    fireEvent.change(nameInput, { target: { value: "" } });
    fireEvent.change(emailInput, { target: { value: "" } });
    fireEvent.click(screen.getByText(/Concluir edição/i));

    expect(screen.getByText(/O nome não pode estar vazio/i)).toBeInTheDocument();
    expect(screen.getByText(/O email não pode estar vazio/i)).toBeInTheDocument();

    fireEvent.change(nameInput, { target: { value: "Novo Nome" } });
    expect(screen.queryByText(/O nome não pode estar vazio/i)).not.toBeInTheDocument();
    expect(screen.getByText(/O email não pode estar vazio/i)).toBeInTheDocument();

    fireEvent.change(emailInput, { target: { value: "novo@teste.com" } });
    expect(screen.queryByText(/O email não pode estar vazio/i)).not.toBeInTheDocument();
  });

  it("salva as alterações e chama onUserUpdated", () => {
    const onUserUpdated = vi.fn();
    render(
      <UserModal
        isOpen={true}
        onClose={() => {}}
        user={mockUser}
        onUserUpdated={onUserUpdated}
      />
    );
    fireEvent.click(screen.getByText(/Editar informações/i));

    const nameInput = screen.getByDisplayValue("João Silva");
    const emailInput = screen.getByDisplayValue("joao@teste.com");

    fireEvent.change(nameInput, { target: { value: " Carlos Souza  " } });
    fireEvent.change(emailInput, { target: { value: " carlos@teste.com  " } });
    fireEvent.click(screen.getByText(/Concluir edição/i));

    expect(onUserUpdated).toHaveBeenCalledWith({
      name: "Carlos Souza",
      email: "carlos@teste.com",
    });
    expect(screen.getByText(/Editar informações/i)).toBeInTheDocument();
  });

  it("salva alterações com sucesso mesmo se onUserUpdated não for passado", () => {
    render(<UserModal isOpen={true} onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText(/Editar informações/i));

    const nameInput = screen.getByDisplayValue("João Silva");
    fireEvent.change(nameInput, { target: { value: "Novo Nome" } });
    fireEvent.click(screen.getByText(/Concluir edição/i));

    expect(screen.getByText(/Editar informações/i)).toBeInTheDocument();
  });

  it("abre confirmação de exclusão ao clicar em Excluir minha conta", () => {
    render(<UserModal isOpen={true} onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText(/Excluir minha conta/i));
    expect(screen.getByText(/Deseja excluir sua conta/i)).toBeInTheDocument();
    expect(screen.getByText("Confirmar")).toBeInTheDocument();
    expect(screen.getByText("Cancelar")).toBeInTheDocument();
  });

  it("cancela a exclusão e volta ao modo visualização", () => {
    render(<UserModal isOpen={true} onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText(/Excluir minha conta/i));
    expect(screen.getByText(/Deseja excluir sua conta/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Cancelar"));
    expect(screen.queryByText(/Deseja excluir sua conta/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Excluir minha conta/i)).toBeInTheDocument();
  });

  it("confirma a exclusão chamando onUserDeleted e onClose", () => {
    const onUserDeleted = vi.fn();
    const onClose = vi.fn();

    render(
      <UserModal
        isOpen={true}
        onClose={onClose}
        user={mockUser}
        onUserDeleted={onUserDeleted}
      />
    );
    fireEvent.click(screen.getByText(/Excluir minha conta/i));
    fireEvent.click(screen.getByText("Confirmar"));

    expect(onUserDeleted).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("confirma exclusão chamando onClose mesmo sem onUserDeleted fornecido", () => {
    const onClose = vi.fn();

    render(<UserModal isOpen={true} onClose={onClose} user={mockUser} />);
    fireEvent.click(screen.getByText(/Excluir minha conta/i));
    fireEvent.click(screen.getByText("Confirmar"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("trata usuário com campos nulos ou indefinidos de forma segura", () => {
    const incompleteUser = {
      name: null,
      email: undefined,
      role: "Visitante",
      level: "Nível 0",
    };

    render(<UserModal isOpen={true} onClose={() => {}} user={incompleteUser} />);
    fireEvent.click(screen.getByText(/Editar informações/i));

    const inputs = screen.getAllByRole("textbox");
    expect(inputs[0].value).toBe("");
    expect(inputs[1].value).toBe("");
  });

  it("atualiza o estado interno e redefine o formulário se o objeto user for atualizado", () => {
    const initialUser = { ...mockUser };
    const { rerender } = render(
      <UserModal isOpen={true} onClose={() => {}} user={initialUser} />
    );

    // Entra em edição e altera input
    fireEvent.click(screen.getByText(/Editar informações/i));
    const nameInput = screen.getByDisplayValue("João Silva");
    fireEvent.change(nameInput, { target: { value: "Alteração Temporária" } });
    expect(screen.getByDisplayValue("Alteração Temporária")).toBeInTheDocument();

    // Rerenderiza com mesma chave (mesmo name e email), mas nova referência de objeto (ex: cargo alterado)
    const updatedUser = { ...initialUser, role: "Supervisor" };
    rerender(
      <UserModal isOpen={true} onClose={() => {}} user={updatedUser} />
    );

    // Deve voltar ao modo view e exibir o novo cargo
    expect(screen.getByText("Supervisor")).toBeInTheDocument();
    expect(screen.getByText("João Silva")).toBeInTheDocument();
  });
});