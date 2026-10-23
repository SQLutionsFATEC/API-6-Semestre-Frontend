import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import Sidebar from "./Sidebar";
import { keycloak } from "../../services/keycloak";

vi.mock("../../services/keycloak", () => ({
  keycloak: {
    logout: vi.fn().mockResolvedValue(undefined),
    hasRealmRole: vi.fn().mockReturnValue(true),
  },
}));

describe("Sidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    keycloak.logout.mockResolvedValue(undefined);
    keycloak.hasRealmRole.mockReturnValue(true);
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
    expect(screen.getByRole("heading", { name: "Cadastrar documento" })).toBeInTheDocument();
    const closeBtn = screen.getByRole("button", { name: "Fechar" });
    fireEvent.click(closeBtn);
    expect(screen.queryByRole("heading", { name: "Cadastrar documento" })).not.toBeInTheDocument();
  });

  it("chama o logout do Keycloak ao clicar em Deslogar", () => {
    render(<Sidebar />);
    const logoutBtn = screen.getByRole("button", { name: /Deslogar/i });
    fireEvent.click(logoutBtn);
    expect(keycloak.logout).toHaveBeenCalled();
  });

  it("lida com erro ao tentar deslogar", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    keycloak.logout.mockRejectedValueOnce(new Error("Erro no logout"));

    render(<Sidebar />);
    const logoutBtn = screen.getByRole("button", { name: /Deslogar/i });
    fireEvent.click(logoutBtn);

    await vi.waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Erro ao fazer logout:", expect.any(Error));
    });

    consoleSpy.mockRestore();
  });
});