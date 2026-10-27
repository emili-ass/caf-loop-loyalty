import { describe, expect, it } from "vitest";
import { requireCount, requireData } from "./query-results";

describe("Supabase result safety", () => {
  it("preserves a legitimate zero count", () => {
    expect(requireCount({ count: 0, error: null }, "stats")).toBe(0);
  });
  it("rejects failed count queries rather than displaying zero", () => {
    expect(() => requireCount({ count: null, error: { message: "permission denied" } }, "stats")).toThrow(/permission denied/);
  });
  it("rejects missing counts", () => {
    expect(() => requireCount({ count: null, error: null }, "stats")).toThrow(/conteo no disponible/);
  });
  it("returns empty lists when genuinely empty", () => {
    expect(requireData({ data: [], error: null }, "cards")).toEqual([]);
  });
  it("rejects failed card queries", () => {
    expect(() => requireData({ data: null, error: { message: "network error" } }, "cards")).toThrow(/network error/);
  });
});
