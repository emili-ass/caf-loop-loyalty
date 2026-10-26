import { createFileRoute } from "@tanstack/react-router";
import { DemoNotice } from "@/components/SiteNav";
import { ownerStats } from "@/lib/demo-data";

export const Route = createFileRoute("/propietario")({
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

const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function Propietario() {
  const s = ownerStats;
  const max = Math.max(...s.weekly);
  const cards = [
    { label: "Clientes inscritos", value: s.customers },
    { label: "Sellos este mes", value: s.stampsThisMonth },
    { label: "Recompensas canjeadas", value: s.rewardsRedeemed },
    { label: "Tasa de regreso", value: `${s.returnRate}%` },
  ];
  return (
    <div className="space-y-6 pt-4">
      <div>
        <p className="text-sm text-muted-foreground">Área privada · Propietario</p>
        <h1 className="text-4xl">Resumen del programa</h1>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card-soft p-5">
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <p className="mt-2 font-display text-3xl font-semibold">{c.value}</p>
          </div>
        ))}
      </div>
      <div className="card-soft p-6">
        <h2 className="text-xl">Sellos por día (última semana)</h2>
        <div className="mt-6 flex h-48 items-end gap-3">
          {s.weekly.map((v, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-xs text-muted-foreground">{v}</span>
              <div className="w-full rounded-t-lg bg-accent" style={{ height: `${(v / max) * 100}%` }} />
              <span className="text-xs">{days[i]}</span>
            </div>
          ))}
        </div>
      </div>
      <DemoNotice>todas las cifras son ficticias.</DemoNotice>
    </div>
  );
}
