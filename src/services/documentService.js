import api from "./api";

function simularAcessoPermitido(doc, fallbackId) {
  if (typeof doc?.acesso_permitido === "boolean") {
    return doc.acesso_permitido;
  }

  const id = doc?.id_documento ?? doc?.id ?? fallbackId;

  if (id !== undefined && id !== null) {
    return Number(id) % 2 !== 0;
  }

  return true;
}

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

  const data = response.data;

  if (!data?.results) return data;

  return {
    ...data,
    results: data.results.map((doc, index) => {
      const id = doc.id_documento ?? doc.id ?? index + 1;

      return {
        ...doc,
        acesso_permitido: simularAcessoPermitido(doc, id),
      };
    }),
  };
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
  const doc = response.data;

  return {
    ...doc,
    acesso_permitido: simularAcessoPermitido(doc, idDocumento),
  };
}

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
    acesso_permitido: true,
  };
}