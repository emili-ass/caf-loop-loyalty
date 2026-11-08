import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { type PurchasePoint, shiftDate } from "./purchase-analytics";

async function currentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Necesitas iniciar sesión.");
  return data.user;
}

export async function fetchMyCards() {
  const user = await currentUser();
  const [cafes, cards, profile] = await Promise.all([
    supabase.from("cafes").select("id, name, reward_description, stamps_required").order("name"),
    supabase
      .from("loyalty_cards")
      .select("id, cafe_id, code, stamps, rewards_available")
      .eq("customer_id", user.id),
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
  ]);
  for (const result of [cafes, cards, profile]) if (result.error) throw result.error;
  return {
    cafes: cafes.data ?? [],
    cards: cards.data ?? [],
    name: profile.data?.display_name ?? user.email ?? "",
  };
}

async function count(
  table: "loyalty_cards" | "stamp_events" | "redemptions" | "purchases",
  cafeId: string,
  since?: string,
) {
  let query = supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("cafe_id", cafeId);
  if (since) query = query.gte("created_at", since);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function fetchOwnerStats(cafeId: string) {
  z.string().uuid().parse(cafeId);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const [customers, stampsMonth, redeemed, purchases, recent] = await Promise.all([
    count("loyalty_cards", cafeId),
    count("stamp_events", cafeId, monthStart),
    count("redemptions", cafeId),
    count("purchases", cafeId),
    supabase
      .from("purchases")
      .select("id, amount, created_at, verification, employee_id")
      .eq("cafe_id", cafeId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);
  if (recent.error) throw recent.error;
  const ids = [...new Set((recent.data ?? []).map((p) => p.employee_id))];
  const profiles = ids.length
    ? await supabase.from("profiles").select("id, display_name").in("id", ids)
    : null;
  // RLS may restrict other employees' profiles; retain the recorded ID as fallback.
  const names = new Map(
    (profiles?.data ?? []).map((profile) => [profile.id, profile.display_name]),
  );
  return {
    customers,
    stampsMonth,
    redeemed,
    purchases,
    recent: (recent.data ?? []).map((p) => ({
      ...p,
      employeeName: names.get(p.employee_id) || `Empleado · ${p.employee_id.slice(0, 8)}`,
    })),
  };
}

export async function fetchPurchaseSeries(
  cafeId: string,
  start: string,
  end: string,
): Promise<PurchasePoint[]> {
  z.string().uuid().parse(cafeId);
  z.string().date().parse(start);
  z.string().date().parse(end);
  if (start >= end) throw new Error("Invalid date range");
  // Widen UTC bounds around local dates; buckets below apply the business timezone.
  const from = `${shiftDate(start, -1)}T00:00:00Z`;
  const to = `${shiftDate(end, 1)}T00:00:00Z`;
  const rows: PurchasePoint[] = [];
  for (let offset = 0; ; offset += 500) {
    const result = await supabase
      .from("purchases")
      .select("amount, created_at, id")
      .eq("cafe_id", cafeId)
      .gte("created_at", from)
      .lt("created_at", to)
      .order("created_at")
      .order("id")
      .range(offset, offset + 499);
    if (result.error) throw result.error;
    rows.push(...result.data);
    if (result.data.length < 500) return rows;
  }
}

export async function fetchCurrentEmployee() {
  const user = await currentUser();
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  return { id: user.id, name: data?.display_name?.trim() || user.email || "Empleado" };
}

/** Only the existing column grant and self-profile RLS policy authorize this update. */
export async function updateMyProfile(displayName: string) {
  const display_name = z.string().trim().min(1).max(80).parse(displayName);
  const user = await currentUser();
  const { data, error } = await supabase
    .from("profiles")
    .update({ display_name })
    .eq("id", user.id)
    .select("id, display_name")
    .single();
  if (error) throw error;
  return data;
}

/** Owner-only in SQL; the caller cannot supply role, membership, or stamp fields. */
export async function updateCafeDetails(
  cafeId: string,
  details: { name: string; reward_description: string },
) {
  z.string().uuid().parse(cafeId);
  const patch = z
    .object({
      name: z.string().trim().min(1).max(120),
      reward_description: z.string().trim().min(1).max(500),
    })
    .strict()
    .parse(details);
  await currentUser();
  const { data, error } = await supabase
    .from("cafes")
    .update(patch)
    .eq("id", cafeId)
    .select("id, name, reward_description")
    .single();
  if (error) throw error;
  return data;
}
