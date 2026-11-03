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
  etiquetas = "",
  setor = "",
  tags = [],
  tipo = [],
  data_atualizacao = "",
} = {}) {
  const params = {};

  const trimmedNome = typeof nome === "string" ? nome.trim() : "";

  if (trimmedNome !== "") {
    params.nome = trimmedNome;
  }

  const trimmedContexto =
    typeof contexto === "string" ? contexto.trim() : "";

  if (trimmedContexto !== "") {
    params.contexto = trimmedContexto;
  }

  const searchTags = (() => {
    if (typeof etiquetas === "string" && etiquetas.trim() !== "") {
      return [etiquetas.trim()];
    }

    if (Array.isArray(etiquetas) && etiquetas.length > 0) {
      return etiquetas
        .map((item) =>
          typeof item === "string" ? item : item?.nome ?? ""
        )
        .filter(Boolean);
    }

    return [];
  })();

  const filterTags = Array.isArray(tags)
    ? tags
        .map((item) =>
          typeof item === "string" ? item : item?.nome ?? ""
        )
        .filter(Boolean)
    : [];

  const resolvedEtiquetas = [
    ...new Set([...searchTags, ...filterTags]),
  ].join(" ");

  if (resolvedEtiquetas !== "") {
    params.etiquetas = resolvedEtiquetas;
  }

  const resolvedSetor = (() => {
    if (typeof setor === "string" && setor.trim() !== "") {
      return setor.trim();
    }

    if (Array.isArray(setor) && setor.length > 0) {
      return setor.filter(Boolean).join(", ");
    }

    if (typeof tipo === "string" && tipo.trim() !== "") {
      return tipo.trim();
    }

    if (Array.isArray(tipo) && tipo.length > 0) {
      return tipo.filter(Boolean).join(", ");
    }

    return "";
  })();

  if (resolvedSetor !== "") {
    params.setor = resolvedSetor;
  }

  const trimmedDataAtualizacao =
    typeof data_atualizacao === "string"
      ? data_atualizacao.trim()
      : "";

  if (trimmedDataAtualizacao !== "") {
    params.data_atualizacao = trimmedDataAtualizacao;
  }

  if (page !== undefined && page !== null) {
    params.page = page;
  }

  const response = await api.get("/api/documentos/", {
    params,
  });

  const data = response.data;

  if (!data?.results) {
    return data;
  }

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
  const trimmedSearch =
    typeof search === "string" ? search.trim() : "";

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

export async function fetchAllAvailableTags() {
  let response = await api.get("/api/etiquetas/");

  if (Array.isArray(response.data)) {
    return response.data;
  }

  const tags = [...(response.data?.results || [])];
  let nextPage = response.data?.next;

  while (nextPage) {
    response = await api.get(nextPage);
    tags.push(...(response.data?.results || []));
    nextPage = response.data?.next;
  }

  return tags;
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

  const response = await api.post("/api/documentos/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 0,
  });

  return response.data;
}

export async function updateDocument(idDocumento, payload) {
  if (!idDocumento) {
    throw new Error("O identificador do documento é obrigatório.");
  }

  const response = await api.patch(
    `/api/documentos/${idDocumento}/`,
    payload
  );

  return response.data;
}