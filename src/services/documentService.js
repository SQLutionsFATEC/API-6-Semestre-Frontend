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

  const data = response.data;
  if (!data?.results) return data;

  // após implementação do back, o retorno será apenas o 'data'
  return {
    ...data,
    results: data.results.map((doc, index) => {
      const id = doc.id_documento ?? doc.id ?? (index + 1);
      return {
        ...doc,
        // Validação simples: usa apenas true ou false de acesso_permitido
        acesso_permitido: simularAcessoPermitido(doc, id),
      };
    }),
  };
}

export async function fetchDocumentById(idDocumento) {
  const response = await api.get(`/api/documentos/${idDocumento}/`);
  const doc = response.data;

  // após implementação do back, o retorno será apenas o 'data'
  return {
    ...doc,
    // Validação simples: usa apenas true ou false de acesso_permitido
    acesso_permitido: simularAcessoPermitido(doc, idDocumento),
  };
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
    acesso_permitido: true,
  };
}
