import api from "./api";

function normalizeContextMessages(messages = []) {
  const validMessages = [];

  for (let index = 0; index < messages.length; index += 1) {
    const item = messages[index];

    if (typeof item === "string") {
      const trimmed = item.trim();
      if (trimmed) {
        validMessages.push(trimmed);
      }
      continue;
    }

    if (item && typeof item === "object") {
      if (item.isError) {
        if (
          item.role === "assistant" &&
          validMessages.length > 0 &&
          messages[index - 1]?.role === "user"
        ) {
          validMessages.pop();
        }
        continue;
      }

      const trimmed =
        typeof item.content === "string" ? item.content.trim() : "";
      if (trimmed) {
        validMessages.push(trimmed);
      }
    }
  }

  return validMessages;
}

/**
 * Envia o histórico de mensagens da conversa para a rota autenticada de RAG (/api/chat/).
 * Utiliza timeout: 0 para evitar timeout mesmo quando a geração da resposta demorar.
 */
export async function sendChatMessage(questionOrContext, history = []) {
  const context = Array.isArray(questionOrContext)
    ? normalizeContextMessages(questionOrContext)
    : [
        ...normalizeContextMessages(history),
        ...(typeof questionOrContext === "string" && questionOrContext.trim()
          ? [questionOrContext.trim()]
          : []),
      ];

  const response = await api.post(
    "/api/chat/",
    { context },
    { timeout: 0 }
  );

  return response.data;
}
