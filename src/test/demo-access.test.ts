import { beforeEach, describe, expect, it, vi } from "vitest";
const auth = vi.hoisted(() => ({ getUser: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth } }));
import { knownDemo, legacyDemoId } from "@/lib/demo-access";
import { Route as AuthRoute } from "@/routes/_authenticated/route";
import { Route as DemoRoute } from "@/routes/demo.$cafeId";

const protect = AuthRoute.options.beforeLoad as (context: {
  location: { href: string };
}) => Promise<unknown>;
const openDemo = DemoRoute.options.beforeLoad as (context: {
  params: { cafeId: string };
}) => unknown;

beforeEach(() => {
  auth.getUser.mockReset();
  auth.getUser.mockResolvedValue({ data: { user: null } });
});

describe("public sample cards and private real cards", () => {
  it.each(["sample-molienda", "sample-tueste", "sample-patio"])(
    "opens %s without querying authentication",
    (id) => {
      expect(knownDemo(id)).not.toBeNull();
      expect(() => openDemo({ params: { cafeId: id } })).not.toThrow();
      expect(auth.getUser).not.toHaveBeenCalled();
    },
  );
  it("rejects arbitrary demo IDs", () => {
    expect(knownDemo("real-cafe-id")).toBeNull();
    expect(() => openDemo({ params: { cafeId: "real-cafe-id" } })).toThrow();
    expect(legacyDemoId("/tarjeta?demo=true&cafe=real-cafe-id")).toBeNull();
  });
  it("redirects a known legacy demo link to the dedicated public sample route", async () => {
    await expect(
      protect({ location: { href: "/tarjeta?demo=true&cafe=sample-tueste" } }),
    ).rejects.toMatchObject({
      options: { to: "/demo/$cafeId", params: { cafeId: "sample-tueste" } },
    });
    expect(auth.getUser).not.toHaveBeenCalled();
  });
  it.each([
    "/tarjeta?cafe=real-cafe-id",
    "/tarjeta?demo=true&cafe=real-cafe-id",
    "/tarjeta?demo=true",
    "/empleados?demo=true&cafe=sample-molienda",
    "/propietario",
  ])("keeps %s private and preserves its destination", async (href) => {
    await expect(protect({ location: { href } })).rejects.toMatchObject({
      options: { to: "/acceso", search: { redirect: href } },
    });
    expect(auth.getUser).toHaveBeenCalledOnce();
  });
});
