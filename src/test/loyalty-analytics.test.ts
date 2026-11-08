import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ from: vi.fn(), getUser: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: mocks.from, auth: { getUser: mocks.getUser } },
}));
import { fetchCurrentEmployee, fetchPurchaseSeries } from "@/lib/loyalty.queries";

beforeEach(() => vi.resetAllMocks());

it("loads every page of purchases and scopes the request to the selected café", async () => {
  const firstPage = Array.from({ length: 500 }, (_, index) => ({
    id: String(index),
    amount: 50,
    created_at: "2026-10-30T18:00:00Z",
  }));
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi
      .fn()
      .mockResolvedValueOnce({ data: firstPage, error: null })
      .mockResolvedValueOnce({
        data: [{ id: "last", amount: 70, created_at: "2026-10-30T19:00:00Z" }],
        error: null,
      }),
  };
  mocks.from.mockReturnValue(query);
  const cafeId = "ae63b9af-7d03-437c-bd3f-f05ef026d863";
  const rows = await fetchPurchaseSeries(cafeId, "2026-10-01", "2026-11-01");
  expect(rows).toHaveLength(501);
  expect(query.eq).toHaveBeenCalledWith("cafe_id", cafeId);
  expect(query.range).toHaveBeenNthCalledWith(2, 500, 999);
});

it("uses the authenticated employee's profile rather than a supplied identity", async () => {
  mocks.getUser.mockResolvedValue({
    data: { user: { id: "signed-in-employee", email: "employee@test.invalid" } },
    error: null,
  });
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: { display_name: "María López" }, error: null }),
  };
  mocks.from.mockReturnValue(query);
  expect(await fetchCurrentEmployee()).toEqual({ id: "signed-in-employee", name: "María López" });
  expect(query.eq).toHaveBeenCalledWith("id", "signed-in-employee");
});

it("does not identify an employee without an authenticated session", async () => {
  mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
  await expect(fetchCurrentEmployee()).rejects.toThrow("Necesitas iniciar sesión.");
  expect(mocks.from).not.toHaveBeenCalled();
});
