import { describe, expect, it, vi } from "vitest";

import api from "./api";
import { fetchDocumentById, fetchDocuments } from "./documentService";

vi.mock("./api", () => ({
  default: {
    get: vi.fn(),
  },
}));

describe("fetchDocuments", () => {
  it("busca documentos por nome, etiqueta e contexto", async () => {
    const responseData = {
      pages: 1,
      results: [
        {
          id_documento: 42,
          nome: "Manual.pdf",
        },
      ],
    };

    api.get.mockResolvedValue({ data: responseData });

    await expect(
      fetchDocuments({
        nome: "manual",
        contexto: "manual",
        page: 1,
      })
    ).resolves.toEqual(responseData);

    expect(api.get).toHaveBeenCalledWith("/api/documentos/", {
      params: {
        nome: "manual",
        etiquetas: "manual",
        page: 1,
      },
      data: {
        contexto: "manual",
      },
    });
  });

  it("usa os valores padrão quando nenhum parâmetro é informado", async () => {
    const responseData = {
      pages: 1,
      results: [],
    };

    api.get.mockResolvedValue({ data: responseData });

    await expect(fetchDocuments()).resolves.toEqual(responseData);

    expect(api.get).toHaveBeenCalledWith("/api/documentos/", {
      params: {
        nome: "",
        etiquetas: "",
        page: 1,
      },
      data: {
        contexto: "",
      },
    });
  });
});

describe("fetchDocumentById", () => {
  it("busca o detalhe do documento pelo id e retorna o payload da API", async () => {
    const document = {
      id_documento: 42,
      nome: "Manual.pdf",
      etiquetas: [{ id_etiqueta: 7, nome: "Importante" }],
    };

    api.get.mockResolvedValue({ data: document });

    await expect(fetchDocumentById(42)).resolves.toEqual(document);
    expect(api.get).toHaveBeenCalledWith("/api/documentos/42/");
  });
});