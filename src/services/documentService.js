import api from "./api";

export async function fetchDocuments({ nome = "", page = 1 } = {}) {
  const response = await api.get("/api/documentos/", {
    params: {
      nome: nome,   
      page: page,
    },
  });

  return response.data;
}

export async function fetchDocumentById(idDocumento) {
  const response = await api.get(`/api/documentos/${idDocumento}/`);

  return response.data;
}
