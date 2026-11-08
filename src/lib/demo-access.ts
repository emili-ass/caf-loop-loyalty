import { sampleCards, sampleCafes } from "./wallet-data";
export function knownDemo(id: string) {
  const cafe = sampleCafes.find((cafe) => cafe.id === id);
  const card = sampleCards.find((card) => card.cafe_id === id);
  return cafe && card ? { cafe, card } : null;
}
export function legacyDemoId(href: string) {
  const url = new URL(href, "https://loop.invalid");
  const id = url.searchParams.get("cafe");
  return url.pathname === "/tarjeta" &&
    url.searchParams.get("demo") === "true" &&
    id &&
    knownDemo(id)
    ? id
    : null;
}
