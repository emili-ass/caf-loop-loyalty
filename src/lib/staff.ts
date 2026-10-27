import { supabase } from "@/integrations/supabase/client";

export async function fetchMyMemberships() {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return [];
  const { data } = await supabase
    .from("cafe_members")
    .select("cafe_id, role, active, cafes(name)")
    .eq("user_id", u.user.id)
    .eq("active", true);
  return (data ?? []).map((m) => ({
    cafeId: m.cafe_id,
    role: m.role,
    name: (m.cafes as { name: string } | null)?.name ?? "",
  }));
}

export function newIdempotencyKey() {
  return crypto.randomUUID();
}
