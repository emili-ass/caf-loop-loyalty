import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useState } from "react";
import { toast } from "sonner";
import { AccessibilityPanel } from "./AccessibilityPanel";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "./ui/dropdown-menu";

const links = [
  { to: "/", label: "Inicio" },
  { to: "/tarjeta", label: "Mi tarjeta" },
] as const;

export function SiteNav() {
  const { user, ready } = useSession();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  async function signOut() {
    setSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      await qc.cancelQueries();
      qc.clear();
      await navigate({ to: "/acceso", replace: true });
    } catch {
      toast.error("No se pudo cerrar sesión. Inténtalo de nuevo.");
    } finally {
      setSigningOut(false);
    }
  }
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="site-nav-inner">
        <Link
          to="/"
          aria-label="Loop — Inicio"
          className="site-brand flex items-center gap-2 font-display text-xl font-semibold text-primary"
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
        <div className="site-nav-tools">
          <AccessibilityPanel />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="site-team-trigger"
                aria-label="Acceso del equipo: empleados y propietario"
              >
                Equipo <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acceso del equipo</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to="/empleados">Empleados</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/propietario">Propietario</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <nav aria-label="Navegación principal" className="site-client-nav text-sm">
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
              <button
                disabled={signingOut}
                onClick={signOut}
                className="rounded-full px-3 py-1.5 text-muted-foreground"
              >
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
