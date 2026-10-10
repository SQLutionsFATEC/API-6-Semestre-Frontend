import api from "./api";

export async function fetchDocuments({
  nome = "",
  contexto = "",
  page = 1,
  tags = [],
  tipo = [],
  data_atualizacao = "",
} = {}) {
  const params = {
    nome,
    etiquetas: nome,
    page,
  };

  if (contexto !== "") {
    params.contexto = contexto;
  }

  if (tags.length > 0) {
    params.tags = tags;
  }

  if (tipo.length > 0) {
    params.tipo = tipo;
  }

  if (data_atualizacao !== "") {
    params.data_atualizacao = data_atualizacao;
  }

  const response = await api.get("/api/documentos/", {
    params,
  });

  return response.data;
}

export async function fetchTags(search = "") {
  const trimmedSearch = search.trim();

  if (trimmedSearch.length < 2) {
    return [];
  }

  const response = await api.get("/api/etiquetas/", {
    params: {
      busca: trimmedSearch,
    },
  });

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return response.data?.results || [];
}

export async function fetchDocumentById(idDocumento) {
  const response = await api.get(`/api/documentos/${idDocumento}/`);

  return response.data;
}

// posteriormente, basta alterar o mock abaixo pela função POST de /api/documentos/
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
    etiquetas: [
      {
        id_etiqueta: 1,
        nome: (setor || "").trim(),
      },
    ],
  };
}