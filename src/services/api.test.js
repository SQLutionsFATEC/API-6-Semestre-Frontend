import { beforeEach, describe, expect, it, vi } from "vitest";

import api from "./api";
import {
  getAccessToken,
  restartLoginAfterUnauthorized,
} from "./keycloak";

vi.mock("./keycloak", () => ({
  getAccessToken: vi.fn(),
  restartLoginAfterUnauthorized: vi.fn(),
}));

describe("api authentication interceptors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAccessToken).mockResolvedValue("access-token");
    api.defaults.adapter = vi.fn(async (config) => ({
      data: {},
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    }));
  });

  it("envia o token como Bearer nas chamadas da API", async () => {
    await api.get("/api/documentos/");

    const [{ headers }] = api.defaults.adapter.mock.calls[0];
    expect(headers.Authorization).toBe("Bearer access-token");
    expect(getAccessToken).toHaveBeenCalledOnce();
  });

  it("não envia o token para URLs de outra origem", async () => {
    await api.get("https://files.example.com/documento.pdf");

    const [{ headers }] = api.defaults.adapter.mock.calls[0];
    expect(headers.Authorization).toBeUndefined();
    expect(getAccessToken).not.toHaveBeenCalled();
  });

  it("limpa a sessão e reinicia o login quando a API retorna 401", async () => {
    api.defaults.adapter = vi.fn((config) => {
      const error = new Error("Unauthorized");
      error.config = config;
      error.response = { status: 401, config };
      return Promise.reject(error);
    });

    await expect(api.get("/api/documentos/")).rejects.toThrow("Unauthorized");

    expect(restartLoginAfterUnauthorized).toHaveBeenCalledOnce();
  });

  it("não reinicia o login por um 401 de outra origem", async () => {
    api.defaults.adapter = vi.fn((config) => {
      const error = new Error("Unauthorized");
      error.config = config;
      error.response = { status: 401, config };
      return Promise.reject(error);
    });

    await expect(
      api.get("https://files.example.com/documento.pdf")
    ).rejects.toThrow("Unauthorized");

    expect(restartLoginAfterUnauthorized).not.toHaveBeenCalled();
  });
});
