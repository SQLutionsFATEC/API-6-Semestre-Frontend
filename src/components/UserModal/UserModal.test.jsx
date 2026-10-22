import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import UserModal from "./UserModal";
import * as userService from "../../services/userService";

vi.mock("../../services/userService", () => ({
  updateProfile: vi.fn(),
}));

describe("UserModal", () => {
  const mockUser = {
    name: "João Silva",
    email: "joao@teste.com",
    role: "Técnico",
    level: "Nível 1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  it("não renderiza quando isOpen é false", () => {
    const { container } = render(<UserModal isOpen={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("renderiza os dados do usuário no modo visualização", () => {
    render(<UserModal isOpen={true} onClose={vi.fn()} user={mockUser} />);
    expect(screen.getByText("João Silva")).toBeInTheDocument();
    expect(screen.getByText("joao@teste.com")).toBeInTheDocument();
  });

  it("entra no modo de edição ao clicar em 'Editar informações'", () => {
    render(<UserModal isOpen={true} onClose={vi.fn()} user={mockUser} />);
    fireEvent.click(screen.getByText(/Editar informações/i));
    expect(screen.getByDisplayValue("João Silva")).toBeInTheDocument();
    expect(screen.getByDisplayValue("joao@teste.com")).toBeInTheDocument();
  });

  it("exibe erro vindo do backend ao tentar salvar nome inválido (400)", async () => {
    userService.updateProfile.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { nome: ["O nome não deve conter caracteres que não são letras ou espaço simples."] },
      },
    });

    render(<UserModal isOpen={true} onClose={vi.fn()} user={mockUser} />);
    fireEvent.click(screen.getByText(/Editar informações/i));

    const nameInput = screen.getByDisplayValue("João Silva");
    fireEvent.change(nameInput, { target: { value: "João 123" } });

    fireEvent.click(screen.getByText(/Concluir edição/i));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Erro de validação. Verifique os campos.");
      expect(screen.getByText(/O nome não deve conter caracteres/i)).toBeInTheDocument();
    });
  });

  it("exibe erro vindo do backend ao tentar salvar email inválido (400)", async () => {
    userService.updateProfile.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { email: ["Insira um endereço de email válido."] },
      },
    });

    render(<UserModal isOpen={true} onClose={vi.fn()} user={mockUser} />);
    fireEvent.click(screen.getByText(/Editar informações/i));

    const emailInput = screen.getByDisplayValue("joao@teste.com");
    fireEvent.change(emailInput, { target: { value: "email_errado" } });

    fireEvent.click(screen.getByText(/Concluir edição/i));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Erro de validação. Verifique os campos.");
      expect(screen.getByText(/Insira um endereço de email válido/i)).toBeInTheDocument();
    });
  });

  it("exibe alerta de sessão expirada em caso de erro 401", async () => {
    userService.updateProfile.mockRejectedValueOnce({
      response: { status: 401, data: {} },
    });

    render(<UserModal isOpen={true} onClose={vi.fn()} user={mockUser} />);
    fireEvent.click(screen.getByText(/Editar informações/i));
    fireEvent.change(screen.getByDisplayValue("João Silva"), { target: { value: "Novo" } });
    fireEvent.click(screen.getByText(/Concluir edição/i));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Sessão expirada. Faça login novamente.");
    });
  });

  it("exibe alerta genérico em caso de erro 500", async () => {
    userService.updateProfile.mockRejectedValueOnce({
      response: { status: 500, data: {} },
    });

    render(<UserModal isOpen={true} onClose={vi.fn()} user={mockUser} />);
    fireEvent.click(screen.getByText(/Editar informações/i));
    fireEvent.change(screen.getByDisplayValue("João Silva"), { target: { value: "Novo" } });
    fireEvent.click(screen.getByText(/Concluir edição/i));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Ocorreu um erro ao atualizar o perfil.");
    });
  });

  it("salva as alterações com sucesso, exibe alert e chama onUserUpdated", async () => {
    userService.updateProfile.mockResolvedValueOnce({
      nome: "Carlos Souza",
      email: "joao@teste.com",
    });

    const onUserUpdated = vi.fn();

    render(
      <UserModal 
        isOpen={true} 
        onClose={vi.fn()} 
        user={mockUser} 
        onUserUpdated={onUserUpdated} 
      />
    );

    fireEvent.click(screen.getByText(/Editar informações/i));
    fireEvent.change(screen.getByDisplayValue("João Silva"), { target: { value: "Carlos Souza" } });
    fireEvent.click(screen.getByText(/Concluir edição/i));

    await waitFor(() => {
      expect(userService.updateProfile).toHaveBeenCalledWith({ nome: "Carlos Souza" });
      expect(window.alert).toHaveBeenCalledWith("Perfil atualizado com sucesso!");
      expect(onUserUpdated).toHaveBeenCalledWith({
        name: "Carlos Souza",
        email: "joao@teste.com",
      });
    });
  });

  it("não chama a API se nenhum campo for alterado", async () => {
    render(<UserModal isOpen={true} onClose={vi.fn()} user={mockUser} />);
    fireEvent.click(screen.getByText(/Editar informações/i));
    fireEvent.click(screen.getByText(/Concluir edição/i));

    await waitFor(() => {
      expect(userService.updateProfile).not.toHaveBeenCalled();
      expect(screen.getByText(/Editar informações/i)).toBeInTheDocument();
    });
  });
});