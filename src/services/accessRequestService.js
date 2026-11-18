import api from "./api";
import { fetchDocumentById } from "./documentService";
import { fetchUserById } from "./userService";

const ACCESS_REQUESTS_URL = "/api/solicitacoes-acesso/";

function hasIdentifier(value) {
  return (
    value !== null &&
    value !== undefined &&
    String(value).trim() !== ""
  );
}

export async function requestDocumentAccess(documentoId) {
  if (!hasIdentifier(documentoId)) {
    throw new Error("O identificador do documento é obrigatório.");
  }

  const response = await api.post(ACCESS_REQUESTS_URL, {
    documento_id: documentoId,
  });

  return {
    solicitacao: response.data,
    created: response.status === 201,
  };
}

export async function fetchAccessRequests({ page = 1 } = {}) {
  const response = await api.get(ACCESS_REQUESTS_URL, {
    params: { page },
  });

  const data = response.data;

  if (Array.isArray(data)) {
    return { count: data.length, results: data };
  }

  return {
    count: data?.count ?? 0,
    results: data?.results ?? [],
  };
}

export async function updateAccessRequest(idSolicitacao, approved) {
  if (!hasIdentifier(idSolicitacao)) {
    throw new Error("O identificador da solicitação é obrigatório.");
  }

  const response = await api.patch(
    `${ACCESS_REQUESTS_URL}${idSolicitacao}/`,
    { approved: Boolean(approved) }
  );

  return response.data;
}

function getRequesterName(usuario, idUsuario) {
  if (usuario && typeof usuario === "object") {
    const fullName = [usuario.nome, usuario.sobrenome]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (fullName) return fullName;

    if (typeof usuario.username === "string" && usuario.username.trim()) {
      return usuario.username.trim();
    }
  }

  return String(idUsuario ?? "");
}

export async function resolveAccessRequestDetails(solicitacoes = []) {
  if (!Array.isArray(solicitacoes)) {
    return [];
  }

  return Promise.all(
    solicitacoes.map(async (solicitacao) => {
      const [documento, usuario] = await Promise.all([
        fetchDocumentById(solicitacao.documento_id).catch(() => null),
        fetchUserById(solicitacao.usuario_id).catch(() => null),
      ]);

      return {
        ...solicitacao,
        documentoNome:
          documento?.nome ?? `Documento #${solicitacao.documento_id}`,
        solicitanteNome: getRequesterName(
          usuario,
          solicitacao.usuario_id
        ),
      };
    })
  );
}
