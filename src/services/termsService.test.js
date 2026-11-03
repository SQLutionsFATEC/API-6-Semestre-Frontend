import { describe, it, expect, vi } from "vitest";
import { fetchTerms, acceptTerms, anonymizeAccount } from "./termsService";

describe("termsService", () => {
  it("fetchTerms deve retornar a lista de termos mockados", async () => {
    const terms = await fetchTerms();
    expect(terms).toHaveLength(2);
    expect(terms[0]).toHaveProperty("id", 1);
    expect(terms[0]).toHaveProperty("required", true);
  });

  it("acceptTerms deve retornar sucesso e os IDs aceitos", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const result = await acceptTerms([1, 2]);
    
    expect(result.success).toBe(true);
    expect(result.accepted).toEqual([1, 2]);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("anonymizeAccount deve retornar sucesso", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const result = await anonymizeAccount();
    
    expect(result.success).toBe(true);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});