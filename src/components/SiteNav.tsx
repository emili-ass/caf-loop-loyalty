import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";

const links = [
  { to: "/", label: "Inicio" },
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
          <svg aria-hidden="true" viewBox="0 0 32 32" className="h-6 w-6 shrink-0" fill="none">
            <path
              d="M9 8.5a11 11 0 1 1-1 15"
              stroke="currentColor"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <path
              d="M7 17v7h7"
              stroke="currentColor"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="tracking-[-0.05em]">loop.</span>
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
