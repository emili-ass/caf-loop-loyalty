import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Coffee } from "lucide-react";

const links = [
  { to: "/", label: "Cafetería" },
  { to: "/tarjeta", label: "Mi tarjeta" },
  { to: "/empleados", label: "Empleados" },
  { to: "/propietario", label: "Propietario" },
] as const;

export function SiteNav() {
  const { user, ready } = useSession();
  const qc = useQueryClient();
  const navigate = useNavigate();
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/acceso", replace: true });
  }
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2 font-display text-xl font-semibold text-primary"
        >
          <Coffee className="h-5 w-5" /> CaféLoop
        </Link>
        <nav className="-mx-1 flex gap-1 overflow-x-auto text-sm">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: true }}
              className="whitespace-nowrap rounded-full px-3 py-1.5 text-muted-foreground hover:text-foreground"
              activeProps={{ className: "bg-secondary text-secondary-foreground font-medium" }}
            >
              {l.label}
            </Link>
          ))}
          {ready &&
            (user ? (
              <button onClick={signOut} className="rounded-full px-3 py-1.5 text-muted-foreground">
                Salir
              </button>
            ) : (
              <Link
                to="/acceso"
                className="rounded-full px-3 py-1.5"
                activeProps={{ className: "bg-secondary text-secondary-foreground font-medium" }}
              >
                Acceso
              </Link>
            ))}
        </nav>
      </div>
    </header>
  );
}

export function DemoNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-accent bg-secondary/60 px-4 py-3 text-sm text-secondary-foreground">
      <strong className="font-semibold">Modo demostración:</strong> {children}
    </div>
  );
}
