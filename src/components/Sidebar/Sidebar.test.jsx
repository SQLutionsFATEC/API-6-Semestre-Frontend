import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import Sidebar from "./Sidebar";
import { keycloak } from "../../services/keycloak";

// Mock do módulo do Keycloak
vi.mock("../../services/keycloak", () => ({
  keycloak: {
    hasRealmRole: vi.fn(),
    tokenParsed: {
      realm_access: {
        roles: [],
      },
    },
  },
}));

describe("Sidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Por padrão, simulamos que o usuário É um operador para que os testes
    // originais (que esperam o botão de upload visível) continuem passando.
    keycloak.hasRealmRole.mockReturnValue(true);
    keycloak.tokenParsed.realm_access.roles = ["operador"];
  });

  it("renderiza a logo no topo da sidebar", () => {
    render(<Sidebar />);

    const logoImg = screen.getByRole("img", { name: /IAzimute/i });
    expect(logoImg).toBeInTheDocument();
  });

  it("renderiza o botão 'Cadastrar documento' acima do botão 'Deslogar' para operadores", () => {
    render(<Sidebar />);

    const uploadBtn = screen.getByRole("button", { name: /Cadastrar documento/i });
    const logoutBtn = screen.getByRole("button", { name: /Deslogar/i });

    expect(uploadBtn).toBeInTheDocument();
    expect(logoutBtn).toBeInTheDocument();
  });

  it("chama o callback ao clicar no botão de cadastrar documento", () => {
    const handleOpen = vi.fn();
    render(<Sidebar onOpenUploadModal={handleOpen} />);

    const uploadBtn = screen.getByRole("button", { name: /Cadastrar documento/i });
    fireEvent.click(uploadBtn);

    expect(handleOpen).toHaveBeenCalledTimes(1);
  });

  it("abre e fecha o modal de upload ao clicar no botão de fechar", () => {
    render(<Sidebar />);

    const uploadBtn = screen.getByRole("button", { name: /Cadastrar documento/i });
    fireEvent.click(uploadBtn);

    expect(
      screen.getByRole("heading", { name: "Cadastrar documento" })
    ).toBeInTheDocument();

    const closeBtn = screen.getByRole("button", { name: "Fechar" });
    fireEvent.click(closeBtn);

    expect(
      screen.queryByRole("heading", { name: "Cadastrar documento" })
    ).not.toBeInTheDocument();
  });

  // NOVO TESTE: Critério de aceitação da tarefa A6-60
  it("NÃO deve renderizar o botão 'Cadastrar documento' para usuários que não são operadores", () => {
    // Simula que o usuário NÃO possui a role de Operador
    keycloak.hasRealmRole.mockReturnValue(false);
    keycloak.tokenParsed.realm_access.roles = ["UsuarioComum"];

    render(<Sidebar />);

    // Verifica se o botão de upload não está na tela
    const uploadBtn = screen.queryByRole("button", { name: /Cadastrar documento/i });
    expect(uploadBtn).not.toBeInTheDocument();

    // Garante que o botão de deslogar continua visível
    const logoutBtn = screen.getByRole("button", { name: /Deslogar/i });
    expect(logoutBtn).toBeInTheDocument();
  });
});