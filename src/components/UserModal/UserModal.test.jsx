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

  it("exibe os dados do usuário no modo visualização", () => {
    render(<UserModal isOpen={true} onClose={() => {}} user={mockUser} />);
    expect(screen.getByText("João Silva")).toBeInTheDocument();
    expect(screen.getByText("joao@teste.com")).toBeInTheDocument();
  });

  it("muda para modo edição ao clicar em Editar informações", () => {
    render(<UserModal isOpen={true} onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText(/Editar informações/i));
    expect(screen.getByDisplayValue("João Silva")).toBeInTheDocument();
  });

  it("valida campo nome vazio ao salvar", () => {
    render(<UserModal isOpen={true} onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText(/Editar informações/i));

    const nameInput = screen.getByDisplayValue("João Silva");
    fireEvent.change(nameInput, { target: { value: "" } });
    fireEvent.click(screen.getByText(/Concluir edição/i));

    expect(screen.getByText(/O nome não pode estar vazio/i)).toBeInTheDocument();
  });

  it("abre confirmação de exclusão ao clicar em Excluir minha conta", () => {
    render(<UserModal isOpen={true} onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText(/Excluir minha conta/i));
    expect(screen.getByText(/Deseja excluir sua conta/i)).toBeInTheDocument();
  });

  it("fecha o modal ao clicar fora (backdrop)", () => {
    const onClose = vi.fn();
    const { container } = render(
      <UserModal isOpen={true} onClose={onClose} user={mockUser} />
    );
    const backdrop = container.querySelector(".user-modal-backdrop");
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });
});