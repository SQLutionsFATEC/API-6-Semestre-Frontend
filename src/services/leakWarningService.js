import api from "./api";

const STORAGE_PREFIX = "leak-warning-ack:";

export async function fetchLatestLeakIncident() {
  try {
    const response = await api.get("/api/vazamentos/");
    return response.data ?? null;
  } catch (error) {
    if (error?.response?.status === 404) {
      return null;
    }

    throw error;
  }
}

function getStorageKey(userId) {
  return `${STORAGE_PREFIX}${userId || "anonymous"}`;
}

export function getAcknowledgedLeakIncidentIds(userId) {
  try {
    const stored = window.localStorage.getItem(getStorageKey(userId));

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((incidentId) => typeof incidentId === "string");
  } catch {
    // Armazenamento indisponível ou corrompido: trata como nenhum incidente conhecido.
    return [];
  }
}

export function isLeakIncidentAcknowledged(incidentId, userId) {
  if (!incidentId) {
    return false;
  }

  return getAcknowledgedLeakIncidentIds(userId).includes(incidentId);
}

export function acknowledgeLeakIncident(incidentId, userId) {
  if (!incidentId) {
    return;
  }

  try {
    const acknowledgedIds = getAcknowledgedLeakIncidentIds(userId);

    if (acknowledgedIds.includes(incidentId)) {
      return;
    }

    window.localStorage.setItem(
      getStorageKey(userId),
      JSON.stringify([...acknowledgedIds, incidentId])
    );
  } catch (error) {
    console.error("Não foi possível armazenar o aviso de vazamento:", error);
  }
}
