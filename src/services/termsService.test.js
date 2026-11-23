import { beforeEach, describe, expect, it, vi } from "vitest";

import api from "./api";
import {
  acceptTerms,
  fetchTerms,
  fetchUserConsents,
  updateUserConsents,
} from "./termsService";

vi.mock("./api", () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const responseData = {
  id_termo: 1,
  clausulas: [
    {
      id_clausula: 10,
      requisito: "nome",
      desc: "Coleta de nome",
      obrigatoria: true,
      aceita: true,
    },
    {
      id_clausula: 20,
      requisito: "email",
      desc: "Coleta de e-mail",
      obrigatoria: false,
      aceita: null,
    },
  ],
};

const terms = [
  { id: 10, description: "Coleta de nome", required: true },
  { id: 20, description: "Coleta de e-mail", required: false },
];

describe("termsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mapeia as cláusulas atuais para os termos da interface", async () => {
    api.get.mockResolvedValue({ data: responseData });

    await expect(fetchTerms()).resolves.toEqual(terms);
    expect(api.get).toHaveBeenCalledWith("/api/consentimento/");
  });

  it("retorna os IDs de cláusulas aceitas pelo usuário", async () => {
    api.get.mockResolvedValue({ data: responseData });

    await expect(fetchUserConsents()).resolves.toEqual([10]);
    expect(api.get).toHaveBeenCalledWith("/api/consentimento/");
  });

  it("atualiza aceite e revogação enviando booleanos para cada cláusula", async () => {
    api.patch.mockResolvedValue({
      data: {
        ...responseData,
        clausulas: responseData.clausulas.map((clause) => ({
          ...clause,
          aceita: clause.id_clausula === 10,
        })),
      },
    });

    await expect(updateUserConsents([10], terms)).resolves.toEqual({
      success: true,
      accepted: [10],
    });
    expect(api.patch).toHaveBeenCalledWith("/api/consentimento/", {
      "10": true,
      "20": false,
    });
  });

  it("aceita os termos iniciais usando a mesma rota de atualização", async () => {
    api.patch.mockResolvedValue({
      data: {
        ...responseData,
        clausulas: responseData.clausulas.map((clause) => ({
          ...clause,
          aceita: true,
        })),
      },
    });

    await expect(acceptTerms([10, 20], terms)).resolves.toEqual({
      success: true,
      accepted: [10, 20],
    });
  });

  it("propaga falhas da API ao carregar os termos", async () => {
    api.get.mockRejectedValue(new Error("Falha de rede"));

    await expect(fetchTerms()).rejects.toThrow("Falha de rede");
  });

  it("rejeita atualização sem cláusulas carregadas", async () => {
    await expect(updateUserConsents([], [])).rejects.toThrow(
      "Não há cláusulas carregadas para atualizar."
    );
    expect(api.patch).not.toHaveBeenCalled();
  });
});
