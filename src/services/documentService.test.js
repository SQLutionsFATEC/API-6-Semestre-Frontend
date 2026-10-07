import { describe, expect, it, vi } from "vitest";

import api from "./api";
import {
  createDocument,
  fetchDocumentById,
  fetchDocuments,
} from "./documentService";

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
        contexto: "manual",
      },
    });
  });

  it("não envia contexto quando ele está vazio", async () => {
    const responseData = {
      pages: 1,
      results: [],
    };

    api.get.mockResolvedValue({ data: responseData });

    await expect(
      fetchDocuments({
        nome: "",
        contexto: "",
        page: 1,
      })
    ).resolves.toEqual(responseData);

    expect(api.get).toHaveBeenCalledWith("/api/documentos/", {
      params: {
        nome: "",
        etiquetas: "",
        page: 1,
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

describe("createDocument", () => {
  it("mocka a criação do documento e retorna os dados formatados", async () => {
    const file = new File(["teste"], "doc.pdf", { type: "application/pdf" });
    const result = await createDocument({
      nome: "doc.pdf",
      setor: "Técnico",
      nivel: "Básico",
      file,
    });

    expect(result).toHaveProperty("id_documento");
    expect(result.nome).toBe("doc.pdf");
    expect(result.setor).toBe("Técnico");
    expect(result.nivel).toBe("Básico");
    expect(result.tipo_arquivo).toBe("pdf");
    expect(result.etiquetas).toEqual([{ id_etiqueta: 1, nome: "Técnico" }]);
  });
});