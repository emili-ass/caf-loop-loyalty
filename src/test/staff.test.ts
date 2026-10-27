import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser, from, select, eq } = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getUser }, from },
}));

import { fetchMyMemberships } from "@/lib/staff";

describe("staff membership loading", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    from.mockReturnValue({ select });
    select.mockReturnValue({ eq });
    eq.mockReturnValue({ eq });
  });

  it("does not query memberships without a signed-in user", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(fetchMyMemberships()).resolves.toEqual([]);
    expect(from).not.toHaveBeenCalled();
  });

  it("reports authentication failures instead of showing no staff access", async () => {
    const error = new Error("Authentication unavailable");
    getUser.mockResolvedValue({ data: { user: null }, error });
    await expect(fetchMyMemberships()).rejects.toBe(error);
    expect(from).not.toHaveBeenCalled();
  });

  it("reports database failures instead of returning an empty membership list", async () => {
    const error = new Error("Database unavailable");
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    eq.mockReturnValueOnce({ eq }).mockResolvedValueOnce({ data: null, error });
    await expect(fetchMyMemberships()).rejects.toBe(error);
  });

  it("loads active memberships for the current user", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    eq.mockReturnValueOnce({ eq }).mockResolvedValueOnce({
      data: [{ cafe_id: "cafe-1", role: "employee", cafes: { name: "Café" } }],
      error: null,
    });
    await expect(fetchMyMemberships()).resolves.toEqual([
      { cafeId: "cafe-1", role: "employee", name: "Café" },
    ]);
    expect(eq).toHaveBeenNthCalledWith(1, "user_id", "user-1");
    expect(eq).toHaveBeenNthCalledWith(2, "active", true);
  });
});
