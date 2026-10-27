import { supabase } from "@/integrations/supabase/client";

export async function fetchMyMemberships() {
  const { data: u, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!u.user) return [];
  const { data, error } = await supabase
    .from("cafe_members")
    .select("cafe_id, role, active, cafes(name)")
    .eq("user_id", u.user.id)
    .eq("active", true);
  if (error) throw error;
  return (data ?? []).map((m) => ({ cafeId: m.cafe_id, role: m.role, name: m.cafes?.name ?? "" }));
}

export function newIdempotencyKey() {
  return crypto.randomUUID();
}
