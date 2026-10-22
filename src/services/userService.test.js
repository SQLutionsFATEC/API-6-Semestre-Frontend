import { describe, expect, it, vi, beforeEach } from "vitest";
import api from "./api";
import { updateProfile } from "./userService";

vi.mock("./api", () => ({
  default: {
    patch: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
    },
  },
}));

describe("userService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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