import { beforeEach, describe, expect, it, vi } from "vitest";

import api from "./api";

import {
  createDocument,
  fetchDocumentById,
  fetchDocuments,
  fetchTags,
} from "./documentService";

vi.mock("./api", () => ({
  default: {
    get: vi.fn(),
  },
}));

describe("fetchDocuments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

    api.get.mockResolvedValue({
      data: responseData,
    });

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

    api.get.mockResolvedValue({
      data: responseData,
    });

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

  it("envia os filtros de tags, tipo e data de atualização", async () => {
    const responseData = {
      pages: 1,
      results: [],
    };

    api.get.mockResolvedValue({
      data: responseData,
    });

    await expect(
      fetchDocuments({
        nome: "",
        contexto: "",
        page: 1,
        tags: [1, 2],
        tipo: ["Técnico", "Normativo"],
        data_atualizacao: "2026-10-01",
      })
    ).resolves.toEqual(responseData);

    expect(api.get).toHaveBeenCalledWith("/api/documentos/", {
      params: {
        nome: "",
        etiquetas: "",
        page: 1,
        tags: [1, 2],
        tipo: ["Técnico", "Normativo"],
        data_atualizacao: "2026-10-01",
      },
    });
  });

  it("não envia parâmetros de filtros quando eles estão vazios", async () => {
    const responseData = {
      pages: 1,
      results: [],
    };

    api.get.mockResolvedValue({
      data: responseData,
    });

    await expect(
      fetchDocuments({
        nome: "documento",
        contexto: "documento",
        page: 1,
        tags: [],
        tipo: [],
        data_atualizacao: "",
      })
    ).resolves.toEqual(responseData);

    expect(api.get).toHaveBeenCalledWith("/api/documentos/", {
      params: {
        nome: "documento",
        etiquetas: "documento",
        page: 1,
        contexto: "documento",
      },
    });
  });

  it("usa os valores padrão quando nenhum parâmetro é informado", async () => {
    const responseData = {
      pages: 1,
      results: [],
    };

    api.get.mockResolvedValue({
      data: responseData,
    });

    await expect(fetchDocuments()).resolves.toEqual(responseData);

    expect(api.get).toHaveBeenCalledWith("/api/documentos/", {
      params: {
        nome: "",
        etiquetas: "",
        page: 1,
      },
    });
  });

  it("envia filtros junto com a busca textual", async () => {
    const responseData = {
      pages: 1,
      results: [],
    };

    api.get.mockResolvedValue({
      data: responseData,
    });

    await expect(
      fetchDocuments({
        nome: "LGPD",
        contexto: "LGPD",
        page: 1,
        tags: [10],
        tipo: ["Normativo"],
        data_atualizacao: "2026-09-30",
      })
    ).resolves.toEqual(responseData);

    expect(api.get).toHaveBeenCalledWith("/api/documentos/", {
      params: {
        nome: "LGPD",
        etiquetas: "LGPD",
        page: 1,
        contexto: "LGPD",
        tags: [10],
        tipo: ["Normativo"],
        data_atualizacao: "2026-09-30",
      },
    });
  });
});

describe("fetchTags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("não consulta a API quando a busca possui menos de 2 caracteres", async () => {
    await expect(fetchTags("a")).resolves.toEqual([]);

    expect(api.get).not.toHaveBeenCalled();
  });

  it("não consulta a API quando a busca está vazia", async () => {
    await expect(fetchTags("")).resolves.toEqual([]);

    expect(api.get).not.toHaveBeenCalled();
  });

  it("não consulta a API quando a busca contém apenas espaços", async () => {
    await expect(fetchTags("   ")).resolves.toEqual([]);

    expect(api.get).not.toHaveBeenCalled();
  });

  it("consulta a API quando a busca possui 2 caracteres", async () => {
    const responseData = {
      results: [
        {
          id_etiqueta: 1,
          nome: "LG",
        },
      ],
    };

    api.get.mockResolvedValue({
      data: responseData,
    });

    await expect(fetchTags("LG")).resolves.toEqual(responseData.results);

    expect(api.get).toHaveBeenCalledWith("/api/etiquetas/", {
      params: {
        busca: "LG",
      },
    });
  });

  it("consulta a API quando a busca possui mais de 2 caracteres", async () => {
    const responseData = {
      results: [
        {
          id_etiqueta: 10,
          nome: "Importante",
        },
      ],
    };

    api.get.mockResolvedValue({
      data: responseData,
    });

    await expect(fetchTags("Imp")).resolves.toEqual(responseData.results);

    expect(api.get).toHaveBeenCalledWith("/api/etiquetas/", {
      params: {
        busca: "Imp",
      },
    });
  });

  it("remove espaços antes de enviar a busca de tags", async () => {
    const responseData = {
      results: [],
    };

    api.get.mockResolvedValue({
      data: responseData,
    });

    await expect(fetchTags("  LGPD  ")).resolves.toEqual([]);

    expect(api.get).toHaveBeenCalledWith("/api/etiquetas/", {
      params: {
        busca: "LGPD",
      },
    });
  });

  it("aceita uma resposta da API em formato de array", async () => {
    const responseData = [
      {
        id_etiqueta: 1,
        nome: "LGPD",
      },
      {
        id_etiqueta: 2,
        nome: "Dados",
      },
    ];

    api.get.mockResolvedValue({
      data: responseData,
    });

    await expect(fetchTags("LGPD")).resolves.toEqual(responseData);

    expect(api.get).toHaveBeenCalledWith("/api/etiquetas/", {
      params: {
        busca: "LGPD",
      },
    });
  });
});

describe("fetchDocumentById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("busca o detalhe do documento pelo id e retorna o payload da API", async () => {
    const document = {
      id_documento: 42,
      nome: "Manual.pdf",
      etiquetas: [
        {
          id_etiqueta: 7,
          nome: "Importante",
        },
      ],
    };

    api.get.mockResolvedValue({
      data: document,
    });

    await expect(fetchDocumentById(42)).resolves.toEqual(document);

    expect(api.get).toHaveBeenCalledWith("/api/documentos/42/");
  });
});

describe("createDocument", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mocka a criação do documento e retorna os dados formatados", async () => {
    const file = new File(["teste"], "doc.pdf", {
      type: "application/pdf",
    });

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

    expect(result.etiquetas).toEqual([
      {
        id_etiqueta: 1,
        nome: "Técnico",
      },
    ]);
  });
});