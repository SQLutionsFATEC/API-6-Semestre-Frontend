import { afterEach, describe, expect, it, vi } from "vitest";
import { sendChatMessage } from "./chatService";

afterEach(() => {
  vi.useRealTimers();
});

describe("sendChatMessage", () => {
  it("retorna a resposta template após cinco segundos", async () => {
    vi.useFakeTimers();
    const request = sendChatMessage("Onde está o procedimento?");

    let resolved = false;
    request.then(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(4999);
    expect(resolved).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await expect(request).resolves.toEqual({
      resposta:
        "Encontrei alguns documentos relacionados a sua pesquisa, seriam: FAR-271.75 e MLT-HDBK-3927. Encontrou o que precisava? Ou os não são estes documentos?",
      fontes: [],
    });
  });
});
