export const BUSINESS_TIME_ZONE = "America/Mexico_City";
export type PurchasePoint = { amount: number; created_at: string };
export type SalesBucket = { key: string; label: string; purchases: number; income: number };

export function businessDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function shiftDate(key: string, days: number) {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function weekStart(today = businessDate()) {
  const day = new Date(`${today}T12:00:00Z`).getUTCDay();
  return shiftDate(today, -(day === 0 ? 6 : day - 1));
}

export function dailySales(rows: PurchasePoint[], start: string, days: number): SalesBucket[] {
  const buckets = Array.from({ length: days }, (_, index) => {
    const key = shiftDate(start, index);
    return {
      key,
      label: new Intl.DateTimeFormat("es-MX", {
        weekday: "short",
        day: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${key}T12:00:00Z`)),
      purchases: 0,
      income: 0,
    };
  });
  return aggregate(rows, buckets, 10);
}

export function monthlySales(rows: PurchasePoint[], year: number): SalesBucket[] {
  const buckets = Array.from({ length: 12 }, (_, index) => ({
    key: `${year}-${String(index + 1).padStart(2, "0")}`,
    label: new Intl.DateTimeFormat("es-MX", { month: "short", timeZone: "UTC" }).format(
      new Date(Date.UTC(year, index, 1)),
    ),
    purchases: 0,
    income: 0,
  }));
  return aggregate(rows, buckets, 7);
}

function aggregate(rows: PurchasePoint[], buckets: SalesBucket[], keyLength: number) {
  const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));
  for (const row of rows) {
    const bucket = byKey.get(businessDate(new Date(row.created_at)).slice(0, keyLength));
    if (!bucket) continue;
    bucket.purchases += 1;
    bucket.income += Math.round(Number(row.amount) * 100);
  }
  return buckets.map((bucket) => ({ ...bucket, income: bucket.income / 100 }));
}

export const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);
