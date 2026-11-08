import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { LoyaltyPass } from "@/components/WalletStack";
import { cafePresentation, sampleCards, sampleCafes, stampTarget } from "@/lib/wallet-data";

afterEach(cleanup);

it("shows ten slots and two welcome stamps for each new sample café card", () => {
  for (const cafe of sampleCafes.slice(0, 2)) {
    const card = sampleCards.find((card) => card.cafe_id === cafe.id)!;
    const view = render(<LoyaltyPass card={card} cafe={cafe} demo />);
    expect(stampTarget(cafe)).toBe(10);
    expect(screen.getByLabelText("2 de 10 sellos")).toBeInTheDocument();
    expect(view.container.querySelectorAll(".wallet-stamps > span")).toHaveLength(10);
    expect(view.container.querySelectorAll(".is-stamped")).toHaveLength(2);
    view.unmount();
  }
});

it("uses separate AI artwork while preserving the database target for real cards", () => {
  expect(cafePresentation("one", "Café La Molienda").cardArtwork).toBe("/images/molienda-card.png");
  expect(cafePresentation("two", "Café Tueste del Norte").cardArtwork).toBe(
    "/images/tueste-card.png",
  );
  expect(
    stampTarget({
      id: "one",
      name: "Café La Molienda",
      reward_description: "Bebida",
      stamps_required: 8,
    }),
  ).toBe(8);
  expect(stampTarget(sampleCafes[2])).toBe(8);
});
