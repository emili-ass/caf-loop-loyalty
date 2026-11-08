import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { fetchMyCards } from "@/lib/loyalty.queries";
import { CafeCardDetail } from "@/components/CafeCardDetail";

export const Route = createFileRoute("/_authenticated/tarjeta")({
  validateSearch: z.object({ cafe: z.string().max(120).optional(), demo: z.boolean().optional() }),
  head: () => ({
    meta: [
      { title: "Mi tarjeta — Loop" },
      { name: "description", content: "Tu tarjeta, tus recompensas y todo sobre tu cafetería." },
    ],
  }),
  component: Tarjeta,
});

function Tarjeta() {
  const { cafe: cafeId } = Route.useSearch();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["my-cards"],
    queryFn: fetchMyCards,
  });
  if (isError)
    return (
      <div role="alert" className="wallet-empty">
        <p>No se pudieron cargar tus tarjetas.</p>
        <button className="btn-primary mt-4" onClick={() => refetch()}>
          Reintentar
        </button>
      </div>
    );
  if (isLoading || !data)
    return (
      <p role="status" className="wallet-empty">
        Cargando tu tarjeta…
      </p>
    );
  const cards = data.cards;
  const cafes = data.cafes;
  const card = cafeId ? cards.find((card) => card.cafe_id === cafeId) : cards[0];
  const name = data.name.trim().split(/\s+/)[0]?.replace(/^@/, "") || "visitante";
  if (!card)
    return (
      <div className="wallet-empty space-y-4">
        <h1 className="text-3xl">Hola, @{name}</h1>
        <p>
          {cafeId ? "Esta tarjeta no está en tu cartera." : "Tu próxima visita es el comienzo."}
        </p>
        <p className="text-muted-foreground">
          Acerca tu teléfono al NFC o escanea el QR de una cafetería para obtener su tarjeta.
        </p>
        <Link to="/" className="btn-ghost">
          Volver a mi cartera
        </Link>
      </div>
    );
  const cafe = cafes.find((cafe) => cafe.id === card.cafe_id);
  return <CafeCardDetail card={card} cafe={cafe} name={name} />;
}
