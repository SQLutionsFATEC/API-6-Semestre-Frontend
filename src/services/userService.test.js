import { beforeEach, describe, expect, it, vi } from "vitest";

import api from "./api";
import { deleteOwnAccount } from "./userService";

vi.mock("./api", () => ({
  default: {
    delete: vi.fn(),
  },
}));

describe("userService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deleta a conta do usuário autenticado", async () => {
    const response = { status: 204 };
    api.delete.mockResolvedValue(response);

    await expect(deleteOwnAccount()).resolves.toBeUndefined();

    expect(api.delete).toHaveBeenCalledWith("/api/usuarios/");
  });

  it("propaga o erro quando a exclusão da conta falha", async () => {
    const error = new Error("Falha ao excluir a conta");
    api.delete.mockRejectedValue(error);

    await expect(deleteOwnAccount()).rejects.toThrow(
      "Falha ao excluir a conta"
    );
  });
});
