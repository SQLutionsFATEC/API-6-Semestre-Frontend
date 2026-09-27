import api from "./api";

export async function fetchDocuments({
  nome = "",
  contexto = "",
  page = 1,
} = {}) {
  const params = {
    nome: nome,
    etiquetas: nome,
    page: page,
  };

  if (contexto !== "") {
    params.contexto = contexto;
  }

  const response = await api.get("/api/documentos/", {
    params,
  });

  return response.data;
}

export async function fetchDocumentById(idDocumento) {
  const response = await api.get(`/api/documentos/${idDocumento}/`);

  return response.data;
}
