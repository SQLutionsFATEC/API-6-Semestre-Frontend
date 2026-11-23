import { beforeEach, describe, expect, it, vi } from "vitest";

import api from "./api";
import {
  acknowledgeLeakIncident,
  fetchLatestLeakIncident,
  getAcknowledgedLeakIncidentIds,
  isLeakIncidentAcknowledged,
} from "./leakWarningService";

vi.mock("./api", () => ({
  default: {
    get: vi.fn(),
  },
}));

const incident = {
  id: "0f8fad5b-d9cb-469f-a165-70867728950e",
  timestamp: "2026-11-01T12:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
});

describe("leakWarningService", () => {
  it("busca o incidente mais recente em /api/vazamentos/", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: incident });

    await expect(fetchLatestLeakIncident()).resolves.toEqual(incident);
    expect(api.get).toHaveBeenCalledWith("/api/vazamentos/");
  });

  it("retorna null quando não existe incidente registrado", async () => {
    vi.mocked(api.get).mockRejectedValue({ response: { status: 404 } });

    await expect(fetchLatestLeakIncident()).resolves.toBeNull();
  });

  it("propaga outros erros da API", async () => {
    const error = { response: { status: 500 } };
    vi.mocked(api.get).mockRejectedValue(error);

    await expect(fetchLatestLeakIncident()).rejects.toBe(error);
  });

  it("considera desconhecido um incidente que ainda não foi fechado", () => {
    expect(isLeakIncidentAcknowledged(incident.id, "usuario-1")).toBe(false);
    expect(getAcknowledgedLeakIncidentIds("usuario-1")).toEqual([]);
  });

  it("registra o incidente fechado pelo usuário", () => {
    acknowledgeLeakIncident(incident.id, "usuario-1");

    expect(isLeakIncidentAcknowledged(incident.id, "usuario-1")).toBe(true);
    expect(getAcknowledgedLeakIncidentIds("usuario-1")).toEqual([incident.id]);
  });

  it("mantém o histórico de incidentes conhecidos sem duplicatas", () => {
    acknowledgeLeakIncident(incident.id, "usuario-1");
    acknowledgeLeakIncident(incident.id, "usuario-1");
    acknowledgeLeakIncident("outro-incidente", "usuario-1");

    expect(getAcknowledgedLeakIncidentIds("usuario-1")).toEqual([
      incident.id,
      "outro-incidente",
    ]);
  });

  it("isola os incidentes conhecidos por usuário", () => {
    acknowledgeLeakIncident(incident.id, "usuario-1");

    expect(isLeakIncidentAcknowledged(incident.id, "usuario-1")).toBe(true);
    expect(isLeakIncidentAcknowledged(incident.id, "usuario-2")).toBe(false);
  });

  it("ignora incidentes sem identificador", () => {
    acknowledgeLeakIncident(undefined, "usuario-1");

    expect(getAcknowledgedLeakIncidentIds("usuario-1")).toEqual([]);
    expect(isLeakIncidentAcknowledged(undefined, "usuario-1")).toBe(false);
  });

  it("trata armazenamento corrompido como nenhum incidente conhecido", () => {
    acknowledgeLeakIncident(incident.id, "usuario-1");
    window.localStorage.setItem(window.localStorage.key(0), "{invalido");

    expect(isLeakIncidentAcknowledged(incident.id, "usuario-1")).toBe(false);
  });
});
