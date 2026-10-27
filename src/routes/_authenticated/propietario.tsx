import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyMemberships } from "@/lib/staff";
import { requireCount, requireData } from "@/lib/query-results";

export const Route = createFileRoute("/_authenticated/propietario")({
  head: () => ({
    meta: [
      { title: "Panel del propietario — CaféLoop" },
      { name: "description", content: "Estadísticas básicas del programa de fidelización." },
      { property: "og:title", content: "Panel del propietario — CaféLoop" },
      { property: "og:description", content: "Clientes, sellos y recompensas de tu cafetería." },
    ],
  }),
  component: Propietario,
});

async function count(
  table: "loyalty_cards" | "stamp_events" | "redemptions" | "purchases",
  cafeId: string,
  since?: string,
) {
  let q = supabase.from(table).select("id", { count: "exact", head: true }).eq("cafe_id", cafeId);
  if (since) q = q.gte("created_at", since);
  const result = await q;
  return requireCount(result, "No se pudieron obtener las estadísticas");
}

function Propietario() {
  const { data: memberships, isLoading } = useQuery({
    queryKey: ["memberships"],
    queryFn: fetchMyMemberships,
  });
  const owned = (memberships ?? []).filter((m) => m.role === "owner");
  const [cafeId, setCafeId] = useState("");
  useEffect(() => {
    if (!cafeId && owned[0]) setCafeId(owned[0].cafeId);
  }, [owned, cafeId]);

  const stats = useQuery({
    queryKey: ["owner-stats", cafeId],
    enabled: !!cafeId,
    queryFn: async () => {
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const [customers, stampsMonth, redeemed, purchases, recent] = await Promise.all([
        count("loyalty_cards", cafeId),
        count("stamp_events", cafeId, monthStart),
        count("redemptions", cafeId),
        count("purchases", cafeId),
        supabase
          .from("purchases")
          .select("id, amount, created_at, verification")
          .eq("cafe_id", cafeId)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);
      return {
        customers,
        stampsMonth,
        redeemed,
        purchases,
        recent: requireData(recent, "No se pudieron obtener las últimas compras") ?? [],
      };
    },
  });

  if (isLoading) return <p className="pt-10 text-center text-muted-foreground">Cargando…</p>;
  if (!owned.length)
    return (
      <div className="card-soft mx-auto mt-6 max-w-md p-6 text-center">
        <h1 className="text-2xl">Sin acceso de propietario</h1>
        <p className="mt-2 text-muted-foreground">
          Tu cuenta no es propietaria de ninguna cafetería.
        </p>
      </div>
    );

  const s = stats.data;
  const cards = [
    { label: "Clientes con tarjeta", value: s?.customers },
    { label: "Sellos este mes", value: s?.stampsMonth },
    { label: "Recompensas canjeadas", value: s?.redeemed },
    { label: "Compras confirmadas", value: s?.purchases },
  ];
  return (
    <div className="space-y-6 pt-4">
      <div>
        <p className="text-sm text-muted-foreground">Área privada · Propietario</p>
        <h1 className="text-4xl">{owned.find((o) => o.cafeId === cafeId)?.name ?? "Resumen"}</h1>
      </div>
      {owned.length > 1 && (
        <select
          className="field max-w-xs"
          value={cafeId}
          onChange={(e) => setCafeId(e.target.value)}
        >
          {owned.map((m) => (
            <option key={m.cafeId} value={m.cafeId}>
              {m.name}
            </option>
          ))}
        </select>
      )}
      {stats.isError && (
        <p role="alert" className="rounded-xl border border-destructive p-4 text-destructive">
          No se pudieron cargar las estadísticas. Revisa la conexión o los permisos e inténtalo de
          nuevo.
        </p>
      )}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card-soft p-5">
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <p className="mt-2 font-display text-3xl font-semibold">{c.value ?? "—"}</p>
          </div>
        ))}
      </div>
      <div className="card-soft p-6">
        <h2 className="text-xl">Últimas compras</h2>
        {s?.recent.length ? (
          <ul className="mt-4 divide-y divide-border text-sm">
            {s.recent.map((p) => (
              <li key={p.id} className="flex justify-between py-2">
                <span>{new Date(p.created_at).toLocaleString("es-MX")}</span>
                <span>${Number(p.amount).toFixed(2)} · confirmada por empleado</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-muted-foreground">Todavía no hay compras.</p>
        )}
      </div>
    </div>
  );
}
