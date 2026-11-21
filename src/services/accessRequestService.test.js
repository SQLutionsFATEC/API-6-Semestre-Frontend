import { beforeEach, describe, expect, it, vi } from "vitest";

import api from "./api";
import { fetchDocumentById } from "./documentService";
import { fetchUserById } from "./userService";
import {
  fetchAccessRequests,
  requestDocumentAccess,
  resolveAccessRequestDetails,
  updateAccessRequest,
} from "./accessRequestService";

vi.mock("./api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock("./documentService", () => ({
  fetchDocumentById: vi.fn(),
}));

vi.mock("./userService", () => ({
  fetchUserById: vi.fn(),
}));

describe("requestDocumentAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("envia a solicitação com o id do documento e indica que foi criada", async () => {
    const solicitacao = {
      id: 10,
      documento_id: 42,
      usuario_id: "usuario-1",
      data_solicitacao: "2026-11-18T10:00:00Z",
      approved: false,
    };
    api.post.mockResolvedValue({ status: 201, data: solicitacao });

    await expect(requestDocumentAccess(42)).resolves.toEqual({
      solicitacao,
      created: true,
    });

    expect(api.post).toHaveBeenCalledWith("/api/solicitacoes-acesso/", {
      documento_id: 42,
    });
  });

  it("indica que a solicitação já existia quando a API responde 200", async () => {
    api.post.mockResolvedValue({
      status: 200,
      data: { id: 10, documento_id: 42, approved: false },
    });

    const result = await requestDocumentAccess(42);

    expect(result.created).toBe(false);
    expect(result.solicitacao.id).toBe(10);
  });

  it("rejeita a solicitação sem documento", async () => {
    await expect(requestDocumentAccess(null)).rejects.toThrow(
      "O identificador do documento é obrigatório."
    );
    await expect(requestDocumentAccess("  ")).rejects.toThrow(
      "O identificador do documento é obrigatório."
    );
    expect(api.post).not.toHaveBeenCalled();
  });

  it("propaga o erro da API quando a solicitação falha", async () => {
    const erro = { response: { status: 403 } };
    api.post.mockRejectedValue(erro);

    await expect(requestDocumentAccess(42)).rejects.toEqual(erro);
  });
});

describe("fetchAccessRequests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("busca a página informada e retorna contagem e resultados", async () => {
    const payload = {
      count: 12,
      next: null,
      previous: "http://localhost/api/solicitacoes-acesso/?page=1",
      results: [{ id: 1, documento_id: 3, usuario_id: "u1", approved: false }],
    };
    api.get.mockResolvedValue({ data: payload });

    await expect(fetchAccessRequests({ page: 2 })).resolves.toEqual({
      count: 12,
      results: payload.results,
    });

    expect(api.get).toHaveBeenCalledWith("/api/solicitacoes-acesso/", {
      params: { page: 2 },
    });
  });

  it("usa a primeira página por padrão", async () => {
    api.get.mockResolvedValue({ data: { count: 0, results: [] } });

    await fetchAccessRequests();

    expect(api.get).toHaveBeenCalledWith("/api/solicitacoes-acesso/", {
      params: { page: 1 },
    });
  });

  it("aceita uma resposta em formato de array", async () => {
    const solicitacoes = [{ id: 1 }, { id: 2 }];
    api.get.mockResolvedValue({ data: solicitacoes });

    await expect(fetchAccessRequests()).resolves.toEqual({
      count: 2,
      results: solicitacoes,
    });
  });

  it("retorna listagem vazia quando o payload não tem results", async () => {
    api.get.mockResolvedValue({ data: { detail: "sem resultados" } });

    await expect(fetchAccessRequests()).resolves.toEqual({
      count: 0,
      results: [],
    });
  });
});

describe("updateAccessRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aprova a solicitação com PATCH", async () => {
    const updated = { id: 9, documento_id: 1, approved: true };
    api.patch.mockResolvedValue({ data: updated });

    await expect(updateAccessRequest(9, true)).resolves.toEqual(updated);

    expect(api.patch).toHaveBeenCalledWith(
      "/api/solicitacoes-acesso/9/",
      { approved: true }
    );
  });

  it("recusa a solicitação com PATCH", async () => {
    api.patch.mockResolvedValue({ data: { id: 9, approved: false } });

    await updateAccessRequest(9, false);

    expect(api.patch).toHaveBeenCalledWith(
      "/api/solicitacoes-acesso/9/",
      { approved: false }
    );
  });

  it("rejeita a atualização sem identificador", async () => {
    await expect(updateAccessRequest(null, true)).rejects.toThrow(
      "O identificador da solicitação é obrigatório."
    );
    expect(api.patch).not.toHaveBeenCalled();
  });

  it("propaga o erro da API quando a atualização falha", async () => {
    const erro = { response: { status: 404 } };
    api.patch.mockRejectedValue(erro);

    await expect(updateAccessRequest(9, true)).rejects.toEqual(erro);
  });
});

describe("resolveAccessRequestDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("completa a solicitação com o nome do documento e do solicitante", async () => {
    fetchDocumentById.mockResolvedValue({ id_documento: 3, nome: "Manual.pdf" });
    fetchUserById.mockResolvedValue({
      nome: "Maria",
      sobrenome: "Silva",
    });

    const solicitacoes = [
      { id: 1, documento_id: 3, usuario_id: "id-maria", approved: false },
    ];

    await expect(resolveAccessRequestDetails(solicitacoes)).resolves.toEqual([
      {
        id: 1,
        documento_id: 3,
        usuario_id: "id-maria",
        approved: false,
        documentoNome: "Manual.pdf",
        solicitanteNome: "Maria Silva",
      },
    ]);

    expect(fetchDocumentById).toHaveBeenCalledWith(3);
    expect(fetchUserById).toHaveBeenCalledWith("id-maria");
  });

  it("usa o username quando o nome do usuário não está preenchido", async () => {
    fetchDocumentById.mockResolvedValue({ nome: "Manual.pdf" });
    fetchUserById.mockResolvedValue({ nome: "", username: "maria.silva" });

    const [result] = await resolveAccessRequestDetails([
      { id: 1, documento_id: 3, usuario_id: "id-maria" },
    ]);

    expect(result.solicitanteNome).toBe("maria.silva");
  });

  it("mantém identificadores como fallback quando as consultas falham", async () => {
    fetchDocumentById.mockRejectedValue(new Error("404"));
    fetchUserById.mockRejectedValue(new Error("404"));

    const [result] = await resolveAccessRequestDetails([
      { id: 1, documento_id: 8, usuario_id: "id-desconhecido" },
    ]);

    expect(result.documentoNome).toBe("Documento #8");
    expect(result.solicitanteNome).toBe("id-desconhecido");
  });

  it("retorna lista vazia quando não recebe uma lista", async () => {
    await expect(resolveAccessRequestDetails(null)).resolves.toEqual([]);
    expect(fetchDocumentById).not.toHaveBeenCalled();
  });
});
