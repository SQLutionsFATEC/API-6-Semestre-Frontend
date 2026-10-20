import { beforeEach, describe, expect, it, vi } from "vitest";

import api from "./api";

import {
  createDocument,
  fetchAllAvailableTags,
  fetchDocumentById,
  fetchDocuments,
  fetchTags,
  updateDocument,
} from "./documentService";

vi.mock("./api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("fetchDocuments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("busca documentos por nome e contexto", async () => {
    const responseData = {
      pages: 1,
      results: [
        {
          id_documento: 42,
          nome: "Manual.pdf",
          acesso_permitido: true,
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
        contexto: "manual",
        page: 1,
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
        page: 1,
      },
    });
  });

  it("envia os filtros de etiquetas, setor e data de atualização", async () => {
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
        etiquetas: "seguranca redes",
        setor: "Técnico, Normativo",
        data_atualizacao: "2026-10-01",
      })
    ).resolves.toEqual(responseData);

    expect(api.get).toHaveBeenCalledWith("/api/documentos/", {
      params: {
        page: 1,
        etiquetas: "seguranca redes",
        setor: "Técnico, Normativo",
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
        etiquetas: "",
        setor: "",
        data_atualizacao: "",
      })
    ).resolves.toEqual(responseData);

    expect(api.get).toHaveBeenCalledWith("/api/documentos/", {
      params: {
        nome: "documento",
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
        etiquetas: "Normativo",
        setor: "Normativo",
        data_atualizacao: "2026-09-30",
      })
    ).resolves.toEqual(responseData);

    expect(api.get).toHaveBeenCalledWith("/api/documentos/", {
      params: {
        nome: "LGPD",
        page: 1,
        contexto: "LGPD",
        etiquetas: "Normativo",
        setor: "Normativo",
        data_atualizacao: "2026-09-30",
      },
    });
  });

  it("preserva o acesso permitido retornado pela API", async () => {
    const responseData = {
      pages: 1,
      results: [
        {
          id_documento: 2,
          nome: "Documento restrito.pdf",
          acesso_permitido: false,
        },
      ],
    };

    api.get.mockResolvedValue({
      data: responseData,
    });

    await expect(fetchDocuments()).resolves.toEqual(responseData);
  });

  it("retorna o payload como está quando a resposta não traz results", async () => {
    const payload = { detail: "sem resultados" };
    api.get.mockResolvedValue({ data: payload });

    await expect(fetchDocuments()).resolves.toEqual(payload);
  });

  it("calcula acesso_permitido pelo id quando a API não informa o campo", async () => {
    api.get.mockResolvedValue({
      data: {
        pages: 1,
        results: [
          { id_documento: 3, nome: "ímpar.pdf" },
          { id_documento: 4, nome: "par.pdf" },
        ],
      },
    });

    const result = await fetchDocuments();

    expect(result.results[0].acesso_permitido).toBe(true);
    expect(result.results[1].acesso_permitido).toBe(false);
  });

  it("usa o índice da lista como fallback quando o documento não tem id", async () => {
    api.get.mockResolvedValue({
      data: {
        pages: 1,
        results: [{ nome: "primeiro" }, { nome: "segundo" }],
      },
    });

    const result = await fetchDocuments();

    expect(result.results[0].acesso_permitido).toBe(true);
    expect(result.results[1].acesso_permitido).toBe(false);
  });

  describe("critérios de aceitação da A6-36 / US-4", () => {
    it("não envia data_atualizacao quando a data estiver vazia", async () => {
      api.get.mockResolvedValue({ data: { results: [], pages: 1 } });

      await fetchDocuments({
        data_atualizacao: "",
      });

      expect(api.get).toHaveBeenCalledWith("/api/documentos/", {
        params: { page: 1 },
      });
      expect(api.get.mock.calls[0][1].params.data_atualizacao).toBeUndefined();
    });

    it("não envia etiquetas quando nenhuma etiqueta for selecionada (string vazia ou array vazio)", async () => {
      api.get.mockResolvedValue({ data: { results: [], pages: 1 } });

      await fetchDocuments({
        etiquetas: "",
        tags: [],
      });

      expect(api.get).toHaveBeenCalledWith("/api/documentos/", {
        params: { page: 1 },
      });
      expect(api.get.mock.calls[0][1].params.etiquetas).toBeUndefined();
    });

    it("envia os nomes das etiquetas selecionadas no painel de filtros", async () => {
      api.get.mockResolvedValue({ data: { results: [], pages: 1 } });

      await fetchDocuments({
        tags: ["Qualitativo", "Normativo"],
      });

      expect(api.get).toHaveBeenCalledWith("/api/documentos/", {
        params: {
          etiquetas: "Qualitativo Normativo",
          page: 1,
        },
      });
    });

    it("não envia setor quando o campo estiver vazio (string vazia ou array vazio)", async () => {
      api.get.mockResolvedValue({ data: { results: [], pages: 1 } });

      await fetchDocuments({
        setor: "",
        tipo: [],
      });

      expect(api.get).toHaveBeenCalledWith("/api/documentos/", {
        params: { page: 1 },
      });
      expect(api.get.mock.calls[0][1].params.setor).toBeUndefined();
    });

    it("formata etiquetas como string separada por espaço e setor separado por vírgula", async () => {
      api.get.mockResolvedValue({ data: { results: [], pages: 1 } });

      await fetchDocuments({
        nome: "Contrato",
        contexto: "Cláusula rescisória",
        page: 2,
        etiquetas: [{ nome: "juridico" }, { nome: "urgente" }],
        setor: ["Técnico", "Jurídico"],
        data_atualizacao: "2026-05-10",
      });

      expect(api.get).toHaveBeenCalledWith("/api/documentos/", {
        params: {
          nome: "Contrato",
          contexto: "Cláusula rescisória",
          page: 2,
          etiquetas: "juridico urgente",
          setor: "Técnico, Jurídico",
          data_atualizacao: "2026-05-10",
        },
      });
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

describe("fetchAllAvailableTags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("busca todas as etiquetas sem filtro na rota /api/etiquetas/", async () => {
    const responseData = [
      { id_etiqueta: 1, nome: "juridico" },
      { id_etiqueta: 2, nome: "normativo" },
    ];

    api.get.mockResolvedValue({
      data: responseData,
    });

    await expect(fetchAllAvailableTags()).resolves.toEqual(responseData);
    expect(api.get).toHaveBeenCalledWith("/api/etiquetas/");
  });

  it("percorre todas as páginas quando a API pagina as etiquetas", async () => {
    api.get
      .mockResolvedValueOnce({
        data: {
          results: [{ id_etiqueta: 1, nome: "a" }],
          next: "http://localhost/api/etiquetas/?page=2",
        },
      })
      .mockResolvedValueOnce({
        data: {
          results: [{ id_etiqueta: 2, nome: "b" }],
          next: null,
        },
      });

    await expect(fetchAllAvailableTags()).resolves.toEqual([
      { id_etiqueta: 1, nome: "a" },
      { id_etiqueta: 2, nome: "b" },
    ]);

    expect(api.get).toHaveBeenCalledTimes(2);
    expect(api.get).toHaveBeenNthCalledWith(
      2,
      "http://localhost/api/etiquetas/?page=2"
    );
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
      acesso_permitido: true,
    };

    api.get.mockResolvedValue({
      data: document,
    });

    await expect(fetchDocumentById(42)).resolves.toEqual(document);

    expect(api.get).toHaveBeenCalledWith("/api/documentos/42/");
  });

  it("calcula o acesso quando a API não retorna acesso_permitido", async () => {
    const document = {
      id_documento: 42,
      nome: "Manual.pdf",
    };

    api.get.mockResolvedValue({
      data: document,
    });

    await expect(fetchDocumentById(42)).resolves.toEqual({
      ...document,
      acesso_permitido: false,
    });
  });
});

describe("createDocument", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("envia os dados do documento para a API e retorna a resposta", async () => {
    const file = new File(["teste"], "doc.pdf", {
      type: "application/pdf",
    });
    const createdDocument = {
      id_documento: 101,
      nome: "doc.pdf",
      setor: "Técnico",
      nivel: "Básico",
      tipo_arquivo: "pdf",
    };
    api.post.mockResolvedValue({ data: createdDocument });

    await expect(
      createDocument({
        nome: "doc.pdf",
        setor: "Técnico",
        nivel: "Básico",
        file,
      })
    ).resolves.toEqual(createdDocument);

    expect(api.post).toHaveBeenCalledTimes(1);
    const [url, formData] = api.post.mock.calls[0];
    expect(url).toBe("/api/documentos/");
    expect(formData.get("nome")).toBe("doc.pdf");
    expect(formData.get("setor")).toBe("Técnico");
    expect(formData.get("nivel")).toBe("Básico");
    expect(formData.get("tipo_arquivo")).toBe("pdf");
    expect(formData.get("data")).toBe(file);
  });

  it("não envia o arquivo quando file é nulo", async () => {
    api.post.mockResolvedValue({ data: { id_documento: 1 } });

    await createDocument({
      nome: "doc",
      setor: "Tecnico",
      nivel: "Basico",
    });

    const [, formData] = api.post.mock.calls[0];
    expect(formData.get("data")).toBeNull();
    expect(formData.get("tipo_arquivo")).toBe("pdf");
  });
});

describe("updateDocument", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("envia o payload de atualização e retorna a resposta da API", async () => {
    const updated = {
      id_documento: 42,
      nome: "Atualizado.pdf",
      setor: "juridico",
      nivel: "operador",
    };
    api.patch.mockResolvedValue({ data: updated });

    await expect(
      updateDocument(42, {
        nome: "Atualizado.pdf",
        setor: "juridico",
        nivel: "operador",
      })
    ).resolves.toEqual(updated);

    expect(api.patch).toHaveBeenCalledWith("/api/documentos/42/", {
      nome: "Atualizado.pdf",
      setor: "juridico",
      nivel: "operador",
    });
  });

  it("lança erro quando o id não é informado", async () => {
    await expect(updateDocument(null, { nome: "x" })).rejects.toThrow(
      "O identificador do documento é obrigatório."
    );

    expect(api.patch).not.toHaveBeenCalled();
  });
});