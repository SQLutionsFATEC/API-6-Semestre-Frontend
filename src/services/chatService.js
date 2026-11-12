import api from "./api";

/**
 * Sends a question to the authenticated semantic-search endpoint.
 * The shared API client attaches the current user's JWT to this request.
 */
export async function sendChatMessage(question) {
  const response = await api.post("/api/chat/", { pergunta: question });
  return response.data;
}
