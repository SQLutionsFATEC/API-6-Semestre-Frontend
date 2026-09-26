import api from "./api";

export async function fetchDocuments({
  nome = "",
  contexto = "",
  page = 1,
} = {}) {
  const response = await api.get("/api/documentos/", {
    params: {
      nome: nome,
      etiquetas: nome,   
      page: page,
    },
    data: {
      contexto: contexto,
    },
  });

  return response.data;
}

export async function fetchDocumentById(idDocumento) {
  const response = await api.get(`/api/documentos/${idDocumento}/`);

  return response.data;
}
