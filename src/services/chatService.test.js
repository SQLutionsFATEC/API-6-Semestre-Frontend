import { describe, expect, it, vi } from "vitest";

import api from "./api";
import { sendChatMessage } from "./chatService";

vi.mock("./api", () => ({
  default: { post: vi.fn() },
}));

describe("sendChatMessage", () => {
  it("envia a pergunta ao endpoint autenticado e retorna a resposta", async () => {
    const payload = { resposta: "Resposta baseada nos documentos.", fontes: [] };
    vi.mocked(api.post).mockResolvedValue({ data: payload });

    await expect(sendChatMessage("Onde está o procedimento?")).resolves.toEqual(
      payload
    );
    expect(api.post).toHaveBeenCalledWith("/api/chat/", {
      pergunta: "Onde está o procedimento?",
    });
  });
});
