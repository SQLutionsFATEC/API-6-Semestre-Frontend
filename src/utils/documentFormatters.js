const SETOR_MAP = {
  tecnico: "Técnico",
  técnico: "Técnico",
  normativo: "Normativo",
  juridico: "Jurídico",
  jurídico: "Jurídico",
  qualitativo: "Qualitativo",
};

export function formatarSetor(document) {
  if (!document) return "-";

  const setorRaw =
    typeof document.setor === "string" ? document.setor.trim() : document.setor;
  if (setorRaw) {
    const normalized = String(setorRaw).toLowerCase();
    return SETOR_MAP[normalized] || setorRaw;
  }

  for (const tag of document.etiquetas || []) {
    const tagName = typeof tag === "string" ? tag : tag?.nome ?? tag?.name ?? "";
    const normalizedTag = tagName.trim().toLowerCase();
    if (SETOR_MAP[normalizedTag]) return SETOR_MAP[normalizedTag];
  }

  return "-";
}
