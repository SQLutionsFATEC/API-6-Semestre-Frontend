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

// posteriormente, basta alterar o mock abaixo por a função post de /api/documentos/
export async function createDocument({
  nome = "",
  setor = "",
  nivel = "Básico",
  file = null,
} = {}) {
  const formData = new FormData();
  formData.append("tipo_arquivo", "pdf");
  formData.append("nome", (nome || "").trim());
  formData.append("setor", (setor || "").trim());
  formData.append("nivel", (nivel || "").trim());
  if (file) {
    formData.append("data", file);
  }

  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    id_documento: Date.now(),
    tipo_arquivo: "pdf",
    nome: (nome || "").trim(),
    setor: (setor || "").trim(),
    nivel: (nivel || "").trim(),
    data_atualizacao: new Date().toISOString(),
    etiquetas: [{ id_etiqueta: 1, nome: (setor || "").trim() }],
  };
}

