type SupabaseEnvironment = Record<string, string | undefined>;

/** Validate public credentials before any client is constructed. Never log key values. */
export function resolveSupabaseConfig(env: SupabaseEnvironment) {
  const url = env["SUPABASE_URL"] || env["VITE_SUPABASE_URL"];
  const key = env["SUPABASE_PUBLISHABLE_KEY"] || env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) {
    throw new Error(
      "Configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (and their server runtime equivalents). See docs/supabase-setup.md.",
    );
  }
  const parsed = new URL(url);
  if (
    parsed.protocol !== "https:" &&
    !(parsed.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname))
  ) {
    throw new Error("Supabase requires HTTPS except for local development.");
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error("Supabase URL must not contain credentials, a query, or a fragment.");
  }
  if (!key.startsWith("sb_publishable_")) {
    // Retain compatibility with existing anon JWT keys, but reject service_role JWTs.
    try {
      const payload = key.split(".")[1];
      if (key.split(".").length !== 3 || !payload) throw new Error();
      const claims: unknown = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
      if (!claims || typeof claims !== "object" || !("role" in claims) || claims.role !== "anon")
        throw new Error();
    } catch {
      throw new Error(
        "Use a Supabase publishable key or legacy anon key. Secret and service-role keys are forbidden in application configuration.",
      );
    }
  }
  return { url: url.replace(/\/+$/, ""), key };
}
