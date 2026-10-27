// Pruebas de seguridad de extremo a extremo contra Lovable Cloud.
// Crea usuarios ficticios (@test.invalid), ejecuta las pruebas a través de la API real
// con la sesión de cada usuario, y borra todo al terminar.
// Ejecutar: bun supabase/tests/security.e2e.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type CardRpc = { id: string; code: string };
type PurchaseRpc = {
  stamps: number;
  rewards_available: number;
  reward_earned?: boolean;
  replayed?: boolean;
};
type RedeemRpc = { rewards_available: number; replayed?: boolean };

const URL = process.env.SUPABASE_URL!;
const ANON = process.env.SUPABASE_PUBLISHABLE_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!URL || !ANON || !SERVICE) throw new Error("Faltan variables de entorno de Cloud");

const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(URL, SERVICE, opts);
const run = Math.random().toString(36).slice(2, 8);
const PASSWORD = `Prueba-${run}-Segura!9`;
const createdUsers: string[] = [];
const createdCards: string[] = [];
let passed = 0;
const failed: string[] = [];

function ok(cond: unknown, name: string) {
  if (cond) {
    passed++;
    console.log("OK:", name);
  } else {
    failed.push(name);
    console.log("FALLÓ:", name);
  }
}
const key = (label: string) => `${label}-${run}-${crypto.randomUUID()}`;

async function user(label: string): Promise<{ id: string; db: SupabaseClient }> {
  const email = `${label}-${run}@test.invalid`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: `Ficticio ${label}` },
  });
  if (error) throw error;
  createdUsers.push(data.user.id);
  const db = createClient(URL, ANON, opts);
  const s = await db.auth.signInWithPassword({ email, password: PASSWORD });
  if (s.error) throw s.error;
  return { id: data.user.id, db };
}

async function main() {
  const { data: cafes } = await admin.from("cafes").select("id, slug");
  const A = cafes!.find((c) => c.slug === "la-molienda")!.id;
  const B = cafes!.find((c) => c.slug === "tueste-norte")!.id;

  const owner = await user("owner-a");
  const empA = await user("emp-a");
  const empB = await user("emp-b");
  const inactive = await user("ex-emp");
  const c1 = await user("cliente1");
  const c2 = await user("cliente2");
  const anon = createClient(URL, ANON, opts);

  const mem = await admin.from("cafe_members").insert([
    { cafe_id: A, user_id: owner.id, role: "owner", active: true },
    { cafe_id: A, user_id: empA.id, role: "employee", active: true },
    { cafe_id: B, user_id: empB.id, role: "employee", active: true },
    { cafe_id: A, user_id: inactive.id, role: "employee", active: false },
  ]);
  if (mem.error) throw mem.error;

  // Perfil automático
  const prof = await c1.db.from("profiles").select("display_name").eq("id", c1.id).single();
  ok(prof.data?.display_name === "Ficticio cliente1", "al registrarse se crea el perfil");

  // Tarjetas y códigos
  const c1A = (await c1.db.rpc("join_cafe", { _cafe_id: A })).data as CardRpc;
  const c1B = (await c1.db.rpc("join_cafe", { _cafe_id: B })).data as CardRpc;
  const c2A = (await c2.db.rpc("join_cafe", { _cafe_id: A })).data as CardRpc;
  createdCards.push(c1A.id, c1B.id, c2A.id);
  const again = (await c1.db.rpc("join_cafe", { _cafe_id: A })).data as CardRpc;
  ok(again.id === c1A.id, "unirse dos veces no crea una segunda tarjeta");
  const re = /^CL-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/;
  ok(
    re.test(c1A.code) && re.test(c1B.code) && new Set([c1A.code, c1B.code, c2A.code]).size === 3,
    "códigos de tarjeta únicos con 16 caracteres aleatorios",
  );

  // Cliente: solo lo suyo, sin manipulación
  const mine = await c1.db.from("loyalty_cards").select("id");
  ok(mine.data?.length === 2, "cliente ve solo sus propias tarjetas");
  const other = await c1.db.from("loyalty_cards").select("id").eq("id", c2A.id);
  ok(other.data?.length === 0, "cliente no ve la tarjeta de otro cliente");
  const profs = await c1.db.from("profiles").select("id");
  ok(profs.data?.length === 1, "cliente solo ve su propio perfil");
  const upd = await c1.db.from("loyalty_cards").update({ stamps: 7 }).eq("id", c1A.id).select();
  ok(
    !!upd.error || upd.data?.length === 0,
    "cliente no puede cambiar sus sellos desde el navegador",
  );
  const ins = await c1.db.from("stamp_events").insert({
    cafe_id: A,
    card_id: c1A.id,
    customer_id: c1.id,
    purchase_id: crypto.randomUUID(),
    employee_id: c1.id,
    stamps_after: 1,
  });
  ok(!!ins.error, "cliente no puede insertar sellos");
  const insP = await c1.db.from("purchases").insert({
    cafe_id: A,
    card_id: c1A.id,
    customer_id: c1.id,
    employee_id: c1.id,
    amount: 1,
    idempotency_key: key("x"),
  });
  ok(!!insP.error, "cliente no puede insertar compras");
  const role = await c1.db
    .from("cafe_members")
    .insert({ cafe_id: A, user_id: c1.id, role: "owner" });
  ok(!!role.error, "cliente no puede asignarse rol de propietario");
  const selfStamp = await c1.db.rpc("register_purchase", {
    _cafe_id: A,
    _card_code: c1A.code,
    _amount: 50,
    _idempotency_key: key("self"),
  });
  ok(selfStamp.error?.message === "not_cafe_staff", "cliente no puede otorgarse sellos");
  const selfRedeem = await c1.db.rpc("redeem_reward", {
    _cafe_id: A,
    _card_code: c1A.code,
    _idempotency_key: key("self"),
  });
  ok(selfRedeem.error?.message === "not_cafe_staff", "cliente no puede canjear por sí mismo");

  // Anónimo
  const anonRpc = await anon.rpc("register_purchase", {
    _cafe_id: A,
    _card_code: c1A.code,
    _amount: 50,
    _idempotency_key: key("anon"),
  });
  ok(!!anonRpc.error, "sin sesión no se puede registrar compras");
  const anonCards = await anon.from("loyalty_cards").select("id");
  ok(!!anonCards.error || anonCards.data?.length === 0, "sin sesión no se leen tarjetas");
  const anonCafes = await anon.from("cafes").select("name");
  ok((anonCafes.data?.length ?? 0) >= 2, "datos públicos de cafeterías visibles sin sesión");

  // 8 sellos = 1 recompensa
  let last: PurchaseRpc | null = null;
  for (let i = 0; i < 8; i++) {
    {
      const rr = await empA.db.rpc("register_purchase", {
        _cafe_id: A,
        _card_code: c1A.code.toLowerCase(),
        _amount: 55,
        _idempotency_key: key(`p${i}`),
      });
      last = rr.data as PurchaseRpc | null;
    }
  }
  ok(
    last?.stamps === 0 && last?.rewards_available === 1 && last?.reward_earned === true,
    "8 sellos generan 1 recompensa y reinician la tarjeta",
  );
  const verif = await empA.db.from("purchases").select("verification").eq("card_id", c1A.id);
  ok(
    verif.data?.length === 8 && verif.data.every((p) => p.verification === "employee_confirmed"),
    "compras registradas como confirmación del empleado",
  );

  // Idempotencia
  const k = key("idem");
  const first = await empA.db.rpc("register_purchase", {
    _cafe_id: A,
    _card_code: c2A.code,
    _amount: 40,
    _idempotency_key: k,
  });
  const replay = await empA.db.rpc("register_purchase", {
    _cafe_id: A,
    _card_code: c2A.code,
    _amount: 40,
    _idempotency_key: k,
  });
  ok(
    !first.error && (replay.data as PurchaseRpc | null)?.replayed === true,
    "misma clave y mismos datos devuelve el resultado anterior",
  );
  const diffAmount = await empA.db.rpc("register_purchase", {
    _cafe_id: A,
    _card_code: c2A.code,
    _amount: 41,
    _idempotency_key: k,
  });
  ok(
    diffAmount.error?.message === "idempotency_key_conflict",
    "clave reutilizada con otro monto: error",
  );
  const diffCard = await empA.db.rpc("register_purchase", {
    _cafe_id: A,
    _card_code: c1A.code,
    _amount: 40,
    _idempotency_key: k,
  });
  ok(
    diffCard.error?.message === "idempotency_key_conflict",
    "clave reutilizada con otra tarjeta: error",
  );
  const c2stamps = await admin.from("loyalty_cards").select("stamps").eq("id", c2A.id).single();
  ok(c2stamps.data?.stamps === 1, "la repetición no sumó sellos extra");

  // Canjes
  const rk = key("canje");
  const r1 = await empA.db.rpc("redeem_reward", {
    _cafe_id: A,
    _card_code: c1A.code,
    _idempotency_key: rk,
  });
  const r1b = await empA.db.rpc("redeem_reward", {
    _cafe_id: A,
    _card_code: c1A.code,
    _idempotency_key: rk,
  });
  ok(
    (r1.data as RedeemRpc | null)?.rewards_available === 0 &&
      (r1b.data as RedeemRpc | null)?.replayed === true,
    "reintento del mismo canje no descuenta dos veces",
  );
  const r2 = await empA.db.rpc("redeem_reward", {
    _cafe_id: A,
    _card_code: c1A.code,
    _idempotency_key: key("canje"),
  });
  ok(r2.error?.message === "no_reward_available", "segundo canje sin recompensa: rechazado");
  const rCard = await empA.db.rpc("redeem_reward", {
    _cafe_id: A,
    _card_code: c2A.code,
    _idempotency_key: rk,
  });
  ok(
    rCard.error?.message === "idempotency_key_conflict",
    "clave de canje reutilizada con otra tarjeta: error",
  );

  // Aislamiento entre cafeterías
  const aSeesB = await empA.db.from("loyalty_cards").select("id").eq("cafe_id", B);
  ok(aSeesB.data?.length === 0, "empleado de A no ve tarjetas de B");
  const aInB = await empA.db.rpc("register_purchase", {
    _cafe_id: B,
    _card_code: c1B.code,
    _amount: 40,
    _idempotency_key: key("ab"),
  });
  ok(aInB.error?.message === "not_cafe_staff", "empleado de A no puede sellar en B");
  const bCardInA = await empA.db.rpc("register_purchase", {
    _cafe_id: A,
    _card_code: c1B.code,
    _amount: 40,
    _idempotency_key: key("ba"),
  });
  ok(bCardInA.error?.message === "card_not_found", "tarjeta de B no se acepta en A");
  const bPurch = await empB.db.from("purchases").select("id");
  const bCards = await empB.db.from("loyalty_cards").select("id");
  ok(bPurch.data?.length === 0 && bCards.data?.length === 1, "empleado de B solo ve datos de B");
  const bProf = await empB.db.from("profiles").select("id").eq("id", c2.id);
  ok(bProf.data?.length === 0, "empleado de B no ve clientes que solo están en A");
  const ownerSees = await owner.db.from("purchases").select("id").eq("cafe_id", A);
  ok((ownerSees.data?.length ?? 0) === 9, "propietario de A ve las compras de A");
  const ownerB = await owner.db.from("purchases").select("id").eq("cafe_id", B);
  ok(ownerB.data?.length === 0, "propietario de A no ve compras de B");
  const ownerUpdB = await owner.db.from("cafes").update({ name: "Hackeado" }).eq("id", B).select();
  ok(
    !!ownerUpdB.error || ownerUpdB.data?.length === 0,
    "propietario de A no puede editar la cafetería B",
  );
  const empUpdA = await empA.db.from("cafes").update({ name: "Hackeado" }).eq("id", A).select();
  ok(
    !!empUpdA.error || empUpdA.data?.length === 0,
    "empleado no puede editar los datos de la cafetería",
  );

  // Empleado inactivo
  const inact = await inactive.db.rpc("register_purchase", {
    _cafe_id: A,
    _card_code: c2A.code,
    _amount: 40,
    _idempotency_key: key("inact"),
  });
  ok(inact.error?.message === "not_cafe_staff", "empleado inactivo no puede sellar");

  // Concurrencia: 10 compras distintas + 6 envíos con la misma clave, todos a la vez
  const same = key("same");
  await Promise.all([
    ...Array.from({ length: 10 }, (_, i) =>
      empA.db.rpc("register_purchase", {
        _cafe_id: A,
        _card_code: c2A.code,
        _amount: 30,
        _idempotency_key: key(`conc${i}`),
      }),
    ),
    ...Array.from({ length: 6 }, () =>
      empA.db.rpc("register_purchase", {
        _cafe_id: A,
        _card_code: c2A.code,
        _amount: 30,
        _idempotency_key: same,
      }),
    ),
  ]);
  const cnt = await admin
    .from("purchases")
    .select("id", { count: "exact", head: true })
    .eq("card_id", c2A.id);
  const card2 = await admin
    .from("loyalty_cards")
    .select("stamps, rewards_available")
    .eq("id", c2A.id)
    .single();
  // 1 previa + 10 + 1 = 12 sellos → 1 recompensa y 4 sellos
  ok(
    cnt.count === 12,
    `16 envíos simultáneos crean exactamente 11 compras nuevas (total ${cnt.count})`,
  );
  ok(
    card2.data?.stamps === 4 && card2.data?.rewards_available === 1,
    "sellos correctos tras envíos simultáneos (sin pérdidas)",
  );

  // Concurrencia: 6 canjes simultáneos con 1 recompensa
  const redeems = await Promise.all(
    Array.from({ length: 6 }, (_, i) =>
      empA.db.rpc("redeem_reward", {
        _cafe_id: A,
        _card_code: c2A.code,
        _idempotency_key: key(`cr${i}`),
      }),
    ),
  );
  const okCount = redeems.filter((r) => !r.error).length;
  const after = await admin
    .from("loyalty_cards")
    .select("rewards_available")
    .eq("id", c2A.id)
    .single();
  ok(
    okCount === 1 && after.data?.rewards_available === 0,
    `6 canjes simultáneos con 1 recompensa: solo 1 aceptado (${okCount})`,
  );
}

try {
  await main();
} catch (e) {
  failed.push(`error inesperado: ${(e as Error).message}`);
  console.error(e);
} finally {
  if (createdCards.length) await admin.from("loyalty_cards").delete().in("id", createdCards);
  if (createdUsers.length) await admin.from("cafe_members").delete().in("user_id", createdUsers);
  for (const id of createdUsers) await admin.auth.admin.deleteUser(id);
  console.log(`\n${passed} pasaron, ${failed.length} fallaron`);
  if (failed.length) {
    console.log(failed.map((f) => " - " + f).join("\n"));
    process.exit(1);
  }
}
