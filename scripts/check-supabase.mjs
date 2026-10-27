// Read-only health/schema smoke check. Never signs in, writes rows, or logs credentials.
import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) throw new Error("Set the Supabase URL and public publishable key first.");
let role;
try {
  role = JSON.parse(Buffer.from(key.split(".")[1] || "", "base64url").toString()).role;
} catch {
  /* Modern key */
}
if (!key.startsWith("sb_publishable_") && role !== "anon")
  throw new Error("Health checks require a public key; privileged keys are forbidden.");
const settings = await fetch(`${url.replace(/\/+$/, "")}/auth/v1/settings`, {
  headers: { apikey: key },
  signal: AbortSignal.timeout(15000),
});
console.log(`Authentication settings: HTTP ${settings.status}`);
if (!settings.ok) process.exitCode = 1;
const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: {
    fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(15000) }),
  },
});
const cafes = await db.from("cafes").select("id, name, reward_description").limit(0);
console.log(`Public café schema: ${cafes.error ? `FAIL (${cafes.error.code})` : "OK"}`);
if (cafes.error) process.exitCode = 1;
for (const table of [
  "profiles",
  "cafe_members",
  "loyalty_cards",
  "purchases",
  "stamp_events",
  "redemptions",
]) {
  // Count only: do not retrieve private customer data, even if policies are misconfigured.
  const { count, error } = await db.from(table).select("id", { count: "exact", head: true });
  const safe = error?.code === "42501" || (!error && count === 0);
  console.log(
    `Anonymous ${table}: ${safe ? "no rows accessible" : "FAIL (unexpected access or API error)"}`,
  );
  if (!safe) process.exitCode = 1;
}
console.log(
  "Read-only smoke checks do not certify signed-in RLS or tenant isolation. Run the security suite against an isolated test project.",
);
