import { createFileRoute, notFound } from "@tanstack/react-router";
import { knownDemo } from "@/lib/demo-access";
import { CafeCardDetail } from "@/components/CafeCardDetail";
export const Route = createFileRoute("/demo/$cafeId")({
  beforeLoad: ({ params }) => {
    if (!knownDemo(params.cafeId)) throw notFound();
  },
  head: () => ({
    meta: [{ title: "Demostración — Loop" }, { name: "robots", content: "noindex" }],
  }),
  component: DemoCafe,
});
function DemoCafe() {
  const { cafeId } = Route.useParams();
  const demo = knownDemo(cafeId);
  if (!demo) throw notFound();
  return <CafeCardDetail card={demo.card} cafe={demo.cafe} name="visitante" demo />;
}
