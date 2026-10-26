import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nueva contraseña — CaféLoop" },
      { name: "description", content: "Elige una nueva contraseña para tu cuenta de CaféLoop." },
      { property: "og:title", content: "Nueva contraseña — CaféLoop" },
      { property: "og:description", content: "Restablece tu contraseña de CaféLoop." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return toast.error("Usa al menos 8 caracteres.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error("El enlace no es válido o expiró. Pide uno nuevo.");
    toast.success("Contraseña actualizada.");
    navigate({ to: "/tarjeta" });
  }

  return (
    <div className="mx-auto max-w-md space-y-5 pt-6">
      <h1 className="text-center text-4xl">Nueva contraseña</h1>
      <form className="card-soft space-y-4 p-6" onSubmit={onSubmit}>
        <label className="block text-sm">Contraseña nueva
          <input type="password" className="field mt-1" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
        </label>
        <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? "Guardando…" : "Guardar contraseña"}</button>
      </form>
    </div>
  );
}
