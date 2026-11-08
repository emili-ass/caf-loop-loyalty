import { describe, expect, it } from "vitest";
import { safeAuthPath } from "@/lib/auth-redirect";

describe("post-authentication redirects", () => {
  it.each([
    "https://evil.invalid",
    "//evil.invalid",
    "/\\evil.invalid",
    "/\nevil.invalid",
    undefined,
  ])("rejects external or ambiguous paths", (path) => {
    expect(safeAuthPath(path)).toBe("/tarjeta");
  });
  it("preserves local paths and their search parameters", () => {
    expect(safeAuthPath("/empleados?cafe=example#purchase")).toBe(
      "/empleados?cafe=example#purchase",
    );
  });
});
