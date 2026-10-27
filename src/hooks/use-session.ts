import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    let receivedEvent = false;
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      receivedEvent = true;
      if (active) {
        setSession(s);
        setReady(true);
      }
    });
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active && !receivedEvent) {
          setSession(data.session);
          setReady(true);
        }
      })
      .catch(() => {
        if (active && !receivedEvent) {
          setSession(null);
          setReady(true);
        }
      });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);
  return { session, user: session?.user ?? null, ready };
}
