import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Coffee, Gift } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { joinCafe } from "@/lib/loyalty.functions";

const STAMPS_TOTAL = 8;

export const Route = createFileRoute("/_authenticated/tarjeta")({
  head: () => ({
    meta: [
      { title: "Mi tarjeta de sellos — CaféLoop" },
      { name: "description", content: "Tu progreso hacia la próxima recompensa." },
      { property: "og:title", content: "Mi tarjeta de sellos — CaféLoop" },
      { property: "og:description", content: "Ocho sellos, una recompensa." },
    ],
  }),
  component: Tarjeta,
});

function Tarjeta() {
  const qc = useQueryClient();
  const join = useServerFn(joinCafe);
  const [joining, setJoining] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["my-cards"],
    queryFn: async () => {
      const [{ data: u }, cafes, cards, profile] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("cafes").select("id, name, reward_description").order("name"),
        supabase.from("loyalty_cards").select("id, cafe_id, code, stamps, rewards_available"),
        supabase.from("profiles").select("display_name").maybeSingle(),
      ]);
      return { cafes: cafes.data ?? [], cards: cards.data ?? [], name: profile.data?.display_name ?? u.user?.email ?? "" };
    },
  });

  if (isLoading || !data) return <p className="pt-10 text-center text-muted-foreground">Cargando…</p>;
  const joinable = data.cafes.filter((c) => !data.cards.some((k) => k.cafe_id === c.id));

  async function onJoin(cafeId: string) {
    setJoining(cafeId);
    const r = await join({ data: { cafeId } });
    setJoining(null);
    if (!r.ok) return toast.error(r.error);
    toast.success("Tarjeta creada");
    qc.invalidateQueries({ queryKey: ["my-cards"] });
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 pt-4">
      <h1 className="text-3xl">Hola, {data.name.split(" ")[0]}</h1>
      {data.cards.length === 0 && <p className="text-muted-foreground">Aún no tienes tarjetas. Únete a una cafetería para empezar.</p>}
      {data.cards.map((card) => {
        const cafe = data.cafes.find((c) => c.id === card.cafe_id);
        return (
          <div key={card.id} className="space-y-3">
            <div className="rounded-3xl bg-primary p-7 text-primary-foreground shadow-soft">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-primary-foreground/70">Tarjeta de sellos</p>
                  <h2 className="text-2xl">{cafe?.name}</h2>
                </div>
                <Coffee className="h-7 w-7 text-accent" />
              </div>
              <div className="mt-6 grid grid-cols-4 gap-3">
                {Array.from({ length: STAMPS_TOTAL }, (_, i) => (
                  <div key={i} className={`flex aspect-square items-center justify-center rounded-full border-2 ${i < card.stamps ? "border-accent bg-accent text-accent-foreground" : "border-dashed border-primary-foreground/30"}`}>
                    {i < card.stamps ? <Coffee className="h-6 w-6" /> : <span className="text-sm text-primary-foreground/40">{i + 1}</span>}
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-between text-sm">
                <span>{card.stamps} de {STAMPS_TOTAL} sellos</span>
                <span>Faltan {STAMPS_TOTAL - card.stamps}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-primary-foreground/20">
                <div className="h-full rounded-full bg-accent" style={{ width: `${(card.stamps / STAMPS_TOTAL) * 100}%` }} />
              </div>
              <p className="mt-5 text-xs text-primary-foreground/70">Muestra este código en caja</p>
              <p className="font-mono text-lg tracking-wider">{card.code}</p>
            </div>
            <div className="card-soft flex items-center gap-4 p-5">
              <div className="rounded-full bg-secondary p-3"><Gift className="h-6 w-6 text-primary" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Recompensas disponibles: {card.rewards_available}</p>
                <p className="font-medium">{cafe?.reward_description}</p>
              </div>
            </div>
          </div>
        );
      })}
      {joinable.length > 0 && (
        <div className="card-soft space-y-3 p-5">
          <h2 className="text-xl">Unirme a una cafetería</h2>
          {joinable.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3">
              <span>{c.name}</span>
              <button className="btn-primary" disabled={joining === c.id} onClick={() => onJoin(c.id)}>
                {joining === c.id ? "Creando…" : "Crear tarjeta"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
