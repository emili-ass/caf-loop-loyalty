import { describe, expect, it } from "vitest";
import { resolveSupabaseConfig } from "@/integrations/supabase/config";

const publicEnv = {
  VITE_SUPABASE_URL: "https://example.supabase.co/",
  VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
};
const jwt = (role: string) => `header.${btoa(JSON.stringify({ role }))}.signature`;

describe("Supabase public configuration", () => {
  it("accepts the browser variables and normalizes the URL", () => {
    expect(resolveSupabaseConfig(publicEnv)).toEqual({
      url: "https://example.supabase.co",
      key: "sb_publishable_example",
    });
  });
  it("supports existing anon keys and server runtime URLs", () => {
    expect(
      resolveSupabaseConfig({
        ...publicEnv,
        SUPABASE_URL: "http://127.0.0.1:54321",
        SUPABASE_PUBLISHABLE_KEY: jwt("anon"),
      }).url,
    ).toBe("http://127.0.0.1:54321");
  });
  it.each(["sb_secret_example", jwt("service_role"), "invalid"])(
    "rejects privileged or invalid keys without logging them",
    (key) => {
      expect(() =>
        resolveSupabaseConfig({ ...publicEnv, VITE_SUPABASE_PUBLISHABLE_KEY: key }),
      ).toThrow("Secret and service-role keys are forbidden");
    },
  );
  it.each([
    "http://example.supabase.co",
    "https://user:password@example.supabase.co",
    "https://example.supabase.co?key=secret",
  ])("rejects unsafe URLs", (url) => {
    expect(() => resolveSupabaseConfig({ ...publicEnv, VITE_SUPABASE_URL: url })).toThrow();
  });
  it("reports missing browser settings without a process global", () => {
    expect(() => resolveSupabaseConfig({})).toThrow("VITE_SUPABASE_URL");
  });
});
