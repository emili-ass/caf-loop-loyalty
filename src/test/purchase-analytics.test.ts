import { describe, expect, it } from "vitest";
import { businessDate, dailySales, monthlySales, weekStart } from "@/lib/purchase-analytics";

describe("sales analytics in the café timezone", () => {
  it("uses Monday through Sunday and includes zero-purchase days", () => {
    expect(weekStart("2026-11-01")).toBe("2026-10-26");
    const result = dailySales(
      [{ amount: 42.5, created_at: "2026-10-27T18:00:00Z" }],
      "2026-10-26",
      7,
    );
    expect(result).toHaveLength(7);
    expect(result[0]?.purchases).toBe(0);
    expect(result[1]).toMatchObject({ purchases: 1, income: 42.5 });
    expect(result[6]?.key).toBe("2026-11-01");
  });
  it("groups midnight UTC into the correct local day and sums currency in cents", () => {
    expect(businessDate(new Date("2026-11-01T02:00:00Z"))).toBe("2026-10-31");
    const result = dailySales(
      [
        { amount: 0.1, created_at: "2026-11-01T02:00:00Z" },
        { amount: 0.2, created_at: "2026-11-01T03:00:00Z" },
        { amount: 900, created_at: "2026-11-01T12:00:00Z" },
      ],
      "2026-10-31",
      1,
    );
    expect(result[0]).toMatchObject({ purchases: 2, income: 0.3 });
  });
  it("includes every month and excludes other years", () => {
    const result = monthlySales(
      [
        { amount: 75, created_at: "2027-01-01T02:00:00Z" },
        { amount: 50, created_at: "2027-01-01T12:00:00Z" },
      ],
      2026,
    );
    expect(result).toHaveLength(12);
    expect(result[0]).toMatchObject({ purchases: 0, income: 0 });
    expect(result[11]).toMatchObject({ purchases: 1, income: 75 });
  });
});
