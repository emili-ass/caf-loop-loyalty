import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Thin wrappers: the SQL functions themselves re-check the caller's identity and
// active café membership, so these never trust the browser or this layer alone.

const ERRORS: Record<string, string> = {
  not_authenticated: "Necesitas iniciar sesión.",
  not_cafe_staff: "No eres personal activo de esta cafetería.",
  card_not_found: "No existe una tarjeta con ese código en esta cafetería.",
  invalid_amount: "El monto no es válido.",
  idempotency_key_conflict:
    "Esta operación ya se registró con datos distintos. Recarga la página e inténtalo de nuevo.",
  no_reward_available: "El cliente no tiene recompensas disponibles.",
  cafe_not_found: "Cafetería no encontrada.",
};

function friendly(message: string) {
  return ERRORS[message] ?? "No se pudo completar la operación.";
}

const keySchema = z.string().min(16).max(100);
const codeSchema = z.string().trim().min(6).max(40);

export const registerPurchase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        cafeId: z.string().uuid(),
        cardCode: codeSchema,
        amount: z.number().positive().lt(100000),
        idempotencyKey: keySchema,
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc("register_purchase", {
      _cafe_id: data.cafeId,
      _card_code: data.cardCode,
      _amount: data.amount,
      _idempotency_key: data.idempotencyKey,
    });
    if (error) return { ok: false as const, error: friendly(error.message) };
    return {
      ok: true as const,
      result: result as {
        replayed: boolean;
        stamps: number;
        rewards_available: number;
        reward_earned?: boolean;
      },
    };
  });

export const redeemReward = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ cafeId: z.string().uuid(), cardCode: codeSchema, idempotencyKey: keySchema })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc("redeem_reward", {
      _cafe_id: data.cafeId,
      _card_code: data.cardCode,
      _idempotency_key: data.idempotencyKey,
    });
    if (error) return { ok: false as const, error: friendly(error.message) };
    return {
      ok: true as const,
      result: result as { replayed: boolean; rewards_available: number },
    };
  });

export const joinCafe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ cafeId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("join_cafe", { _cafe_id: data.cafeId });
    if (error) return { ok: false as const, error: friendly(error.message) };
    return { ok: true as const };
  });
