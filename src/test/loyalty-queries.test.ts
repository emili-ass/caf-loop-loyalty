import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), from: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getUser: mocks.getUser }, from: mocks.from },
}));
import { fetchMyCards, updateMyProfile, updateCafeDetails } from "@/lib/loyalty.queries";

describe("loyalty query boundaries", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "customer-1", email: "test@test.invalid" } },
      error: null,
    });
  });
  it("limits personal cards and profiles to the authenticated customer even for staff", async () => {
    const cardsEq = vi.fn().mockResolvedValue({ data: [], error: null });
    const profileEq = vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({ data: { display_name: "Customer" }, error: null }),
    });
    mocks.from.mockImplementation((table) => ({
      select: () =>
        table === "cafes"
          ? { order: vi.fn().mockResolvedValue({ data: [], error: null }) }
          : { eq: table === "profiles" ? profileEq : cardsEq },
    }));
    await expect(fetchMyCards()).resolves.toEqual({ cafes: [], cards: [], name: "Customer" });
    expect(cardsEq).toHaveBeenCalledWith("customer_id", "customer-1");
    expect(profileEq).toHaveBeenCalledWith("id", "customer-1");
  });
  it("does not query customer data without an authenticated user", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(fetchMyCards()).rejects.toThrow();
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("updates only the current user's display_name and propagates RLS errors", async () => {
    const error = new Error("RLS denied");
    const eq = vi.fn().mockReturnValue({
      select: () => ({ single: vi.fn().mockResolvedValue({ data: null, error }) }),
    });
    const update = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValue({ update });
    await expect(updateMyProfile("  Customer  ")).rejects.toBe(error);
    expect(update).toHaveBeenCalledWith({ display_name: "Customer" });
    expect(eq).toHaveBeenCalledWith("id", "customer-1");
  });
  it("rejects attempts to add unauthorized columns to a café update", async () => {
    const input = { name: "Café", reward_description: "Coffee", role: "owner" };
    await expect(
      updateCafeDetails("11111111-1111-4111-8111-111111111111", input),
    ).rejects.toThrow();
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
