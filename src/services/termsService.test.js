import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import {
  fetchTerms,
  fetchUserConsents,
  updateUserConsents,
  acceptTerms,
  anonymizeAccount,
} from "./termsService";

let consoleSpy;

beforeEach(async () => {
  consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  await updateUserConsents([]);
  consoleSpy.mockClear();
});

afterEach(() => {
  consoleSpy.mockRestore();
});

describe("termsService", () => {
  it("fetchTerms deve retornar a lista de termos mockados", async () => {
    const terms = await fetchTerms();
    expect(terms).toHaveLength(2);
    expect(terms[0]).toHaveProperty("id", 1);
    expect(terms[0]).toHaveProperty("required", true);
  });

  it("fetchTerms deve retornar uma cópia da lista de termos", async () => {
    const terms = await fetchTerms();
    terms[0].description = "Alterado";

    const freshTerms = await fetchTerms();

    expect(freshTerms[0].description).toBe(
      "Utilização e coleta de seu nome"
    );
  });

  it("fetchUserConsents deve iniciar sem consentimentos", async () => {
    expect(await fetchUserConsents()).toEqual([]);
  });

  it("updateUserConsents deve retornar sucesso e os IDs aceitos", async () => {
    const result = await updateUserConsents([1, 2]);

    expect(result.success).toBe(true);
    expect(result.accepted).toEqual([1, 2]);
    expect(await fetchUserConsents()).toEqual([1, 2]);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("updateUserConsents deve remover consentimentos desmarcados", async () => {
    await updateUserConsents([1, 2]);

    const result = await updateUserConsents([1]);

    expect(result.accepted).toEqual([1]);
    expect(await fetchUserConsents()).toEqual([1]);
  });

  it("updateUserConsents deve ignorar IDs de termos inexistentes e duplicados", async () => {
    const result = await updateUserConsents([1, 1, 99]);

    expect(result.accepted).toEqual([1]);
    expect(await fetchUserConsents()).toEqual([1]);
  });

  it("acceptTerms deve persistir os consentimentos aceitos", async () => {
    const result = await acceptTerms([1, 2]);

    expect(result.success).toBe(true);
    expect(result.accepted).toEqual([1, 2]);
    expect(await fetchUserConsents()).toEqual([1, 2]);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("anonymizeAccount deve retornar sucesso e limpar os consentimentos", async () => {
    await updateUserConsents([1, 2]);

    const result = await anonymizeAccount();

    expect(result.success).toBe(true);
    expect(consoleSpy).toHaveBeenCalled();
    expect(await fetchUserConsents()).toEqual([]);
  });
});
