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

export async function fetchTerms() {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_TERMS;
}

export async function acceptTerms(acceptedTermIds) {
  console.log("✅ [MOCK] Termos aceitos com sucesso:", acceptedTermIds);
  return { success: true, accepted: acceptedTermIds };
}

export async function anonymizeAccount() {
  console.log("⚠️ [MOCK] Conta anonimizada (simulação)");
  return { success: true };
}