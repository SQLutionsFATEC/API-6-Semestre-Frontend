import { describe, expect, it, vi, beforeEach } from "vitest";
import api from "./api";
import { updateProfile, fetchUserProfile } from "./userService";

vi.mock("./api", () => ({
  default: {
    patch: vi.fn(),
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
    },
  },
}));

describe("userService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateProfile", () => {
    it("faz uma requisição PATCH para /api/usuarios/ com os dados informados", async () => {
      const mockData = { nome: "Novo Nome", email: "novo@email.com" };
      const mockResponse = { id: 1, ...mockData };
      
      api.patch.mockResolvedValue({ data: mockResponse });

      const result = await updateProfile(mockData);

      expect(api.patch).toHaveBeenCalledWith("/api/usuarios/", mockData);
      expect(result).toEqual(mockResponse);
    });

    it("propaga o erro da API caso a requisição falhe", async () => {
      const mockError = new Error("Erro de rede");
      api.patch.mockRejectedValue(mockError);

      await expect(updateProfile({ nome: "Teste" })).rejects.toThrow("Erro de rede");
    });
  });

  describe("fetchUserProfile", () => {
    it("faz uma requisição GET para /api/perfil/ e retorna os dados do usuário", async () => {
      const mockResponse = {
        nome: "Usuário Teste",
        email: "teste@teste.com",
        nivel_acesso: "basico",
        setor: "tecnico",
      };
      
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await fetchUserProfile();

      expect(api.get).toHaveBeenCalledWith("/api/perfil/");
      expect(result).toEqual(mockResponse);
    });

    it("propaga o erro da API caso a requisição de perfil falhe", async () => {
      const mockError = new Error("Falha ao buscar perfil");
      api.get.mockRejectedValue(mockError);

      await expect(fetchUserProfile()).rejects.toThrow("Falha ao buscar perfil");
    });
  });
});