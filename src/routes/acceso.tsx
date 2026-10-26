import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DemoNotice } from "@/components/SiteNav";

export const Route = createFileRoute("/acceso")({
  head: () => ({
    meta: [
      { title: "Acceso de clientes — CaféLoop" },
      { name: "description", content: "Crea tu cuenta o inicia sesión para ver tu tarjeta de sellos." },
      { property: "og:title", content: "Acceso de clientes — CaféLoop" },
      { property: "og:description", content: "Regístrate o inicia sesión en CaféLoop." },
    ],
  }),
  component: Acceso,
});

function Acceso() {
  const [mode, setMode] = useState<"login" | "registro">("login");
  return (
    <div className="mx-auto max-w-md space-y-5 pt-6">
      <div className="text-center">
        <h1 className="text-4xl">{mode === "login" ? "Bienvenido de vuelta" : "Crea tu cuenta"}</h1>
        <p className="mt-2 text-muted-foreground">Acumula sellos en cada visita.</p>
      </div>
      <div className="card-soft p-6">
        <div className="mb-5 grid grid-cols-2 rounded-full bg-muted p-1 text-sm">
          {(["login", "registro"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`rounded-full py-2 font-medium ${mode === m ? "bg-card shadow-soft" : "text-muted-foreground"}`}>
              {m === "login" ? "Iniciar sesión" : "Registrarme"}
            </button>
          ))}
        </div>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          {mode === "registro" && (
            <label className="block text-sm">Nombre<input className="field mt-1" placeholder="Ana López" /></label>
          )}
          <label className="block text-sm">Correo electrónico<input type="email" className="field mt-1" placeholder="ana@correo.com" /></label>
          <label className="block text-sm">Contraseña<input type="password" className="field mt-1" placeholder="••••••••" /></label>
          <button type="submit" disabled className="btn-primary w-full opacity-60">
            {mode === "login" ? "Entrar" : "Crear cuenta"}
          </button>
        </form>
      </div>
      <DemoNotice>el acceso aún no funciona; se activará cuando conectemos el servidor.</DemoNotice>
    </div>
  );
}
