import api from "./api";

function mapTerms(data) {
  if (!Array.isArray(data?.clausulas)) {
    throw new Error("A resposta do endpoint de consentimento é inválida.");
  }

  return data.clausulas.map((clause) => ({
    id: clause.id_clausula,
    description: clause.desc,
    required: clause.obrigatoria,
    accepted: clause.aceita,
  }));
}

function getAcceptedIds(terms) {
  return terms.filter((term) => term.accepted === true).map((term) => term.id);
}

async function fetchConsentTerms() {
  const response = await api.get("/api/consentimento/");
  return mapTerms(response.data);
}

export async function fetchTerms() {
  const terms = await fetchConsentTerms();
  return terms.map(({ id, description, required }) => ({
    id,
    description,
    required,
  }));
}

export async function fetchUserConsents() {
  return getAcceptedIds(await fetchConsentTerms());
}

export async function updateUserConsents(termIds, terms) {
  if (!Array.isArray(terms) || terms.length === 0) {
    throw new Error("Não há cláusulas carregadas para atualizar.");
  }

  const acceptedIds = new Set(termIds);
  const consentUpdates = Object.fromEntries(
    terms.map((term) => [String(term.id), acceptedIds.has(term.id)])
  );
  const response = await api.patch("/api/consentimento/", consentUpdates);

  return {
    success: true,
    accepted: getAcceptedIds(mapTerms(response.data)),
  };
}

export async function acceptTerms(acceptedIds, terms) {
  return updateUserConsents(acceptedIds, terms);
}
