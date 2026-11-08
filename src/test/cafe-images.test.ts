import { expect, it } from "vitest";
import { cafePresentation } from "@/lib/wallet-data";

it("assigns separate AI-generated galleries by café name, regardless of ID collisions", () => {
  const molienda = cafePresentation("same-id", "Café La Molienda");
  const tueste = cafePresentation("same-id", "Café Tueste del Norte");
  expect(molienda.photos.map((photo) => photo.src)).toEqual([
    "/images/molienda-interior.png",
    "/images/molienda-rincon.png",
  ]);
  expect(tueste.photos.map((photo) => photo.src)).toEqual([
    "/images/tueste-interior.png",
    "/images/tueste-rincon.png",
  ]);
  expect(molienda.photos[1]?.caption).toContain("IA");
});
