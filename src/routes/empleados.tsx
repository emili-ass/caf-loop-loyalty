import { createFileRoute } from "@tanstack/react-router";
import { DemoNotice } from "@/components/SiteNav";
import { cafe } from "@/lib/demo-data";

export const Route = createFileRoute("/empleados")({
  head: () => ({
    meta: [
      { title: "Panel de empleados — CaféLoop" },
      { name: "description", content: "Registra compras y otorga sellos a los clientes." },
      { property: "og:title", content: "Panel de empleados — CaféLoop" },
      { property: "og:description", content: "Registro de compras para el personal." },
    ],
  }),
  component: Empleados,
});

function Empleados() {
  return (
    <div className="mx-auto max-w-2xl space-y-5 pt-4">
      <div>
        <p className="text-sm text-muted-foreground">Área privada · Personal</p>
        <h1 className="text-4xl">Registrar compra</h1>
      </div>
      <form className="card-soft grid gap-4 p-6 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
        <label className="block text-sm sm:col-span-2">Cliente (correo o teléfono)
          <input className="field mt-1" placeholder="ana@correo.com" />
        </label>
        <label className="block text-sm">Producto
          <select className="field mt-1">{cafe.menu.map((m) => <option key={m.name}>{m.name}</option>)}</select>
        </label>
        <label className="block text-sm">Cantidad
          <input type="number" min={1} defaultValue={1} className="field mt-1" />
        </label>
        <label className="block text-sm sm:col-span-2">Nota (opcional)
          <input className="field mt-1" placeholder="Ej. leche de avena" />
        </label>
        <div className="sm:col-span-2">
          <button type="submit" disabled className="btn-primary w-full opacity-60">Registrar compra y sumar sello</button>
        </div>
      </form>
      <DemoNotice>este formulario no guarda compras ni otorga sellos todavía. Falta conectar el servidor y el acceso de empleados.</DemoNotice>
    </div>
  );
}
