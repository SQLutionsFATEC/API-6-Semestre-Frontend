import { beforeEach, describe, expect, it, vi } from "vitest";

const { client } = vi.hoisted(() => ({
  client: {
    init: vi.fn(),
    login: vi.fn(),
    updateToken: vi.fn(),
    clearToken: vi.fn(),
    token: "access-token",
  },
}));

vi.mock("keycloak-js", () => ({
  default: class KeycloakMock {
    constructor() {
      return client;
    }
  },
}));

import {
  getAccessToken,
  initializeKeycloak,
  restartLoginAfterUnauthorized,
} from "./keycloak";

describe("Keycloak authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.token = "access-token";
    client.init.mockResolvedValue(true);
    client.updateToken.mockResolvedValue(false);
    client.login.mockResolvedValue(undefined);
  });

  it("requires login and enables PKCE with S256", async () => {
    await expect(initializeKeycloak()).resolves.toBe(true);

    expect(client.init).toHaveBeenCalledWith({
      onLoad: "login-required",
      pkceMethod: "S256",
      checkLoginIframe: false,
    });
    expect(client.login).not.toHaveBeenCalled();
  });

  it("renews tokens when near expiration before returning them", async () => {
    await expect(getAccessToken()).resolves.toBe("access-token");

    expect(client.updateToken).toHaveBeenCalledWith(30);
  });

  it("clears the token and starts login again after unauthorized responses", () => {
    restartLoginAfterUnauthorized();

    expect(client.clearToken).toHaveBeenCalledOnce();
    expect(client.login).toHaveBeenCalledOnce();
  });

  it("discards the local credential and restarts login after the account is deleted", async () => {
    await vi.resetModules();
    const auth = await import("./keycloak");

    auth.clearLocalSession();

    expect(client.clearToken).toHaveBeenCalledOnce();
    expect(client.login).toHaveBeenCalledOnce();
  });

  it("clears the token and restarts login when an expired token cannot be renewed", async () => {
    await vi.resetModules();
    client.updateToken.mockRejectedValueOnce(
      new Error("Refresh token expired")
    );
    const auth = await import("./keycloak");

    await expect(auth.getAccessToken()).rejects.toThrow(
      "Refresh token expired"
    );

    expect(client.clearToken).toHaveBeenCalledOnce();
    expect(client.login).toHaveBeenCalledOnce();
  });
});
