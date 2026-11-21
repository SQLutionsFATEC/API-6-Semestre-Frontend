const MOCK_TERMS = [
  {
    id: 1,
    description: "Utilização e coleta de seu nome",
    required: true,
  },
  {
    id: 2,
    description: "Utilização e coleta de seu e-mail (Opcional)",
    required: false,
  },
];

// Termos aceitos pelo usuário autenticado (simulação local enquanto não há endpoint).
let acceptedTermIds = [];

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function fetchTerms() {
  await delay(300);
  return MOCK_TERMS.map((term) => ({ ...term }));
}

export async function fetchUserConsents() {
  await delay(200);
  return [...acceptedTermIds];
}

export async function updateUserConsents(termIds) {
  const knownTermIds = new Set(MOCK_TERMS.map((term) => term.id));

  acceptedTermIds = [
    ...new Set(termIds.filter((termId) => knownTermIds.has(termId))),
  ];

  console.log("✅ [MOCK] Consentimentos atualizados com sucesso:", acceptedTermIds);

  return { success: true, accepted: [...acceptedTermIds] };
}

export async function acceptTerms(acceptedIds) {
  return updateUserConsents(acceptedIds);
}

export async function anonymizeAccount() {
  acceptedTermIds = [];
  console.log("⚠️ [MOCK] Conta anonimizada (simulação)");
  return { success: true };
}
