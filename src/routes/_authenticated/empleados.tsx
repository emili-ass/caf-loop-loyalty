import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { registerPurchase, redeemReward } from "@/lib/loyalty.functions";
import { fetchMyMemberships, newIdempotencyKey } from "@/lib/staff";

export const Route = createFileRoute("/_authenticated/empleados")({
  head: () => ({
    meta: [
      { title: "Panel de empleados — CaféLoop" },
      { name: "description", content: "Confirma compras y canjea recompensas de clientes." },
      { property: "og:title", content: "Panel de empleados — CaféLoop" },
      { property: "og:description", content: "Registro de compras para el personal." },
    ],
  }),
  component: Empleados,
});

function Empleados() {
  const { data: memberships, isLoading } = useQuery({ queryKey: ["memberships"], queryFn: fetchMyMemberships });
  const [cafeId, setCafeId] = useState("");
  useEffect(() => {
    if (!cafeId && memberships?.[0]) setCafeId(memberships[0].cafeId);
  }, [memberships, cafeId]);

  if (isLoading) return <p className="pt-10 text-center text-muted-foreground">Cargando…</p>;
  if (!memberships?.length)
    return (
      <div className="card-soft mx-auto mt-6 max-w-md p-6 text-center">
        <h1 className="text-2xl">Sin acceso de personal</h1>
        <p className="mt-2 text-muted-foreground">Tu cuenta no está registrada como empleado de ninguna cafetería. Pide al propietario que te dé acceso.</p>
      </div>
    );

  return (
    <div className="mx-auto max-w-2xl space-y-6 pt-4">
      <div>
        <p className="text-sm text-muted-foreground">Área privada · Personal</p>
        <h1 className="text-4xl">Caja</h1>
      </div>
      {memberships.length > 1 && (
        <label className="block text-sm">Cafetería
          <select className="field mt-1" value={cafeId} onChange={(e) => setCafeId(e.target.value)}>
            {memberships.map((m) => <option key={m.cafeId} value={m.cafeId}>{m.name}</option>)}
          </select>
        </label>
      )}
      {cafeId && <PurchaseForm cafeId={cafeId} />}
      {cafeId && <RedeemForm cafeId={cafeId} />}
    </div>
  );
}

function PurchaseForm({ cafeId }: { cafeId: string }) {
  const submit = useServerFn(registerPurchase);
  const [code, setCode] = useState("");
  const [amount, setAmount] = useState("");
  const [key, setKey] = useState(newIdempotencyKey);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!code.trim() || !(value > 0)) { toast.error("Escribe el código de tarjeta y el monto."); return; }
    setBusy(true);
    try {
      const r = await submit({ data: { cafeId, cardCode: code, amount: value, idempotencyKey: key } });
      if (!r.ok) { toast.error(r.error); return; }
      const res = r.result;
      toast.success(res.replayed ? "Esta compra ya estaba registrada." : res.reward_earned ? "¡Tarjeta completa! El cliente ganó una recompensa." : `Sello otorgado. Lleva ${res.stamps} de 8.`);
      setCode(""); setAmount(""); setKey(newIdempotencyKey());
    } catch {
      toast.error("No se pudo conectar. Puedes reintentar: no se duplicará.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card-soft grid gap-4 p-6 sm:grid-cols-2" onSubmit={onSubmit}>
      <h2 className="text-xl sm:col-span-2">Confirmar compra y otorgar sello</h2>
      <label className="block text-sm sm:col-span-2">Código de tarjeta
        <input className="field mt-1 font-mono uppercase" value={code} onChange={(e) => { setCode(e.target.value); setKey(newIdempotencyKey()); }} placeholder="CL-XXXX-XXXX-XXXX-XXXX" />
      </label>
      <label className="block text-sm sm:col-span-2">Monto (MXN)
        <input type="number" min={1} step="0.01" className="field mt-1" value={amount} onChange={(e) => { setAmount(e.target.value); setKey(newIdempotencyKey()); }} />
      </label>
      <p className="text-xs text-muted-foreground sm:col-span-2">
        Se guarda como <strong>confirmación del empleado</strong>, con tu nombre. No es una venta verificada por un sistema de caja.
      </p>
      <button type="submit" disabled={busy} className="btn-primary sm:col-span-2">{busy ? "Registrando…" : "Confirmar compra y sumar sello"}</button>
    </form>
  );
}

function RedeemForm({ cafeId }: { cafeId: string }) {
  const submit = useServerFn(redeemReward);
  const [code, setCode] = useState("");
  const [key, setKey] = useState(newIdempotencyKey);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) { toast.error("Escribe el código de tarjeta."); return; }
    setBusy(true);
    try {
      const r = await submit({ data: { cafeId, cardCode: code, idempotencyKey: key } });
      if (!r.ok) { toast.error(r.error); return; }
      toast.success(r.result.replayed ? "Este canje ya estaba registrado." : "Recompensa canjeada.");
      setCode(""); setKey(newIdempotencyKey());
    } catch {
      toast.error("No se pudo conectar. Puedes reintentar: no se duplicará.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card-soft space-y-4 p-6" onSubmit={onSubmit}>
      <h2 className="text-xl">Canjear recompensa</h2>
      <label className="block text-sm">Código de tarjeta
        <input className="field mt-1 font-mono uppercase" value={code} onChange={(e) => { setCode(e.target.value); setKey(newIdempotencyKey()); }} placeholder="CL-XXXX-XXXX-XXXX-XXXX" />
      </label>
      <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? "Canjeando…" : "Canjear una recompensa"}</button>
    </form>
  );
}
