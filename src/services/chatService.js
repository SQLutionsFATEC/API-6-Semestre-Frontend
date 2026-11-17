/**
 * Temporary mock while the chat endpoint is unavailable.
 * Keep this signature so the API call can replace the mock when the endpoint exists.
 */
export function sendChatMessage(question) {
  void question;
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        resposta:
          "Encontrei alguns documentos relacionados a sua pesquisa, seriam: FAR-271.75 e MLT-HDBK-3927. Encontrou o que precisava? Ou os não são estes documentos?",
        fontes: [],
      });
    }, 5000);
  });
}
