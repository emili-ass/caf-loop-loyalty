import { createFileRoute } from "@tanstack/react-router";
import { WalletHome } from "@/components/WalletHome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Loop — Tu cartera. Cada visita cuenta." },
      {
        name: "description",
        content: "Tus tarjetas de fidelidad y recompensas, en un solo lugar.",
      },
    ],
  }),
  component: WalletHome,
});
