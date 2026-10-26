import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, MapPin, Star } from "lucide-react";
import hero from "@/assets/cafe-hero.jpg";
import { cafe } from "@/lib/demo-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${cafe.name} — CaféLoop` },
      { name: "description", content: "Horarios, menú y promociones de nuestra cafetería de demostración." },
      { property: "og:title", content: `${cafe.name} — CaféLoop` },
      { property: "og:description", content: "Horarios, menú y promociones de la cafetería demo." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl">
        <img src={hero} alt="Café con arte latte sobre barra de madera" width={1600} height={912} className="h-[340px] w-full object-cover sm:h-[440px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
        <div className="absolute bottom-0 p-6 sm:p-10">
          <p className="text-sm uppercase tracking-widest text-primary-foreground/80">Cafetería de demostración</p>
          <h1 className="mt-1 text-4xl font-semibold text-primary-foreground sm:text-6xl">{cafe.name}</h1>
          <p className="mt-2 max-w-lg text-primary-foreground/90">{cafe.tagline}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/acceso" className="btn-primary">Únete al programa</Link>
            <a href={cafe.reviewsUrl} target="_blank" rel="noreferrer" className="btn-ghost bg-background">
              <Star className="h-4 w-4" /> Reseñas en Google
            </a>
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        <section className="card-soft p-6">
          <h2 className="flex items-center gap-2 text-xl"><Clock className="h-5 w-5 text-accent" /> Horarios</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {cafe.hours.map((h) => (
              <li key={h.day} className="flex justify-between border-b border-border pb-2 last:border-0">
                <span className="text-muted-foreground">{h.day}</span><span className="font-medium">{h.time}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4" />{cafe.address}</p>
        </section>

        <section className="card-soft p-6 md:col-span-2">
          <h2 className="text-xl">Menú</h2>
          <ul className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {cafe.menu.map((m) => (
              <li key={m.name} className="flex items-baseline gap-2">
                <span>{m.name}</span>
                <span className="flex-1 border-b border-dotted border-border" />
                <span className="font-medium">${m.price}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section>
        <h2 className="text-2xl">Promociones</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {cafe.promos.map((p) => (
            <div key={p.title} className="rounded-2xl bg-primary p-6 text-primary-foreground">
              <h3 className="text-xl">{p.title}</h3>
              <p className="mt-1 text-primary-foreground/80">{p.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
