import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { legacyDemoId } from "@/lib/demo-access";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const sampleId = legacyDemoId(location.href);
    if (sampleId)
      throw redirect({ to: "/demo/$cafeId", params: { cafeId: sampleId }, replace: true });
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/acceso", search: { redirect: location.href } });
  },
  component: () => <Outlet />,
});
