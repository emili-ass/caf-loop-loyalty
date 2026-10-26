import { createFileRoute } from "@tanstack/react-router";
import { Coffee, Gift } from "lucide-react";
import { DemoNotice } from "@/components/SiteNav";
import { cafe, demoCustomer, reward, STAMPS_TOTAL } from "@/lib/demo-data";

export const Route = createFileRoute("/tarjeta")({
  head: () => ({
    meta: [
      { title: "Mi tarjeta de sellos — CaféLoop" },
      { name: "description", content: "Tu progreso hacia la próxima recompensa." },
      { property: "og:title", content: "Mi tarjeta de sellos — CaféLoop" },
      { property: "og:description", content: "Ocho sellos, una bebida gratis." },
    ],
  }),
  component: Tarjeta,
});

function Tarjeta() {
  const { stamps, name } = demoCustomer;
  const left = STAMPS_TOTAL - stamps;
  return (
    <div className="mx-auto max-w-lg space-y-5 pt-4">
      <div className="rounded-3xl bg-primary p-7 text-primary-foreground shadow-soft">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-primary-foreground/70">{cafe.name}</p>
            <h1 className="text-3xl">Hola, {name.split(" ")[0]}</h1>
          </div>
          <Coffee className="h-7 w-7 text-accent" />
        </div>
        <div className="mt-7 grid grid-cols-4 gap-3">
          {Array.from({ length: STAMPS_TOTAL }, (_, i) => (
            <div key={i} className={`flex aspect-square items-center justify-center rounded-full border-2 ${i < stamps ? "border-accent bg-accent text-accent-foreground" : "border-dashed border-primary-foreground/30"}`}>
              {i < stamps ? <Coffee className="h-6 w-6" /> : <span className="text-sm text-primary-foreground/40">{i + 1}</span>}
            </div>
          ))}
        </div>
        <div className="mt-7">
          <div className="flex justify-between text-sm"><span>{stamps} de {STAMPS_TOTAL} sellos</span><span>Faltan {left}</span></div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-primary-foreground/20">
            <div className="h-full rounded-full bg-accent" style={{ width: `${(stamps / STAMPS_TOTAL) * 100}%` }} />
          </div>
        </div>
      </div>
      <div className="card-soft flex items-center gap-4 p-5">
        <div className="rounded-full bg-secondary p-3"><Gift className="h-6 w-6 text-primary" /></div>
        <div><p className="text-sm text-muted-foreground">Recompensa al completar</p><p className="font-medium">{reward}</p></div>
      </div>
      <DemoNotice>esta tarjeta muestra datos ficticios. Los sellos todavía no están protegidos ni guardados.</DemoNotice>
    </div>
  );
}
