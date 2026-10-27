import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { safeAuthPath as safePath } from "@/lib/auth-redirect";

export const Route = createFileRoute("/acceso")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Acceso — CaféLoop" },
      {
        name: "description",
        content: "Crea tu cuenta o inicia sesión para ver tu tarjeta de sellos.",
      },
      { property: "og:title", content: "Acceso — CaféLoop" },
      { property: "og:description", content: "Regístrate o inicia sesión en CaféLoop." },
    ],
  }),
  component: Acceso,
});

function Acceso() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "registro" | "olvido">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast.error(
            error.message === "Invalid login credentials"
              ? "Correo o contraseña incorrectos."
              : error.message,
          );
          return;
        }
        navigate({ to: safePath(redirect) });
      } else if (mode === "registro") {
        if (password.length < 8) {
          toast.error("La contraseña debe tener al menos 8 caracteres.");
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/tarjeta",
            data: { display_name: name.trim().slice(0, 80) },
          },
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        if (data.session) {
          await navigate({ to: safePath(redirect) });
          return;
        }
        setSent("Te enviamos un correo para confirmar tu cuenta. Ábrelo y luego inicia sesión.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        setSent(
          "Si existe una cuenta con ese correo, recibirás un enlace para cambiar tu contraseña.",
        );
      }
    } catch {
      toast.error("No se pudo conectar. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    try {
      sessionStorage.setItem("post_auth_redirect", safePath(redirect));
      const r = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/acceso",
      });
      if (r.error) {
        toast.error("No se pudo iniciar sesión con Google.");
        return;
      }
      if (r.redirected) return;
      navigate({ to: safePath(redirect) });
    } catch {
      toast.error("No se pudo iniciar sesión con Google.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-5 pt-6">
      <div className="text-center">
        <h1 className="text-4xl">
          {mode === "registro"
            ? "Crea tu cuenta"
            : mode === "olvido"
              ? "Recuperar contraseña"
              : "Bienvenido de vuelta"}
        </h1>
        <p className="mt-2 text-muted-foreground">Acumula sellos en cada visita.</p>
      </div>
      <div className="card-soft p-6">
        {sent ? (
          <div className="space-y-4 text-center">
            <p>{sent}</p>
            <button
              className="btn-ghost"
              onClick={() => {
                setSent(null);
                setMode("login");
              }}
            >
              Volver a iniciar sesión
            </button>
          </div>
        ) : (
          <>
            {mode !== "olvido" && (
              <div className="mb-5 grid grid-cols-2 rounded-full bg-muted p-1 text-sm">
                {(["login", "registro"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`rounded-full py-2 font-medium ${mode === m ? "bg-card shadow-soft" : "text-muted-foreground"}`}
                  >
                    {m === "login" ? "Iniciar sesión" : "Registrarme"}
                  </button>
                ))}
              </div>
            )}
            <form className="space-y-4" onSubmit={onSubmit}>
              {mode === "registro" && (
                <label className="block text-sm">
                  Nombre
                  <input
                    className="field mt-1"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={80}
                  />
                </label>
              )}
              <label className="block text-sm">
                Correo electrónico
                <input
                  type="email"
                  className="field mt-1"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              {mode !== "olvido" && (
                <label className="block text-sm">
                  Contraseña
                  <input
                    type="password"
                    className="field mt-1"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={mode === "registro" ? 8 : 1}
                  />
                </label>
              )}
              <button type="submit" disabled={busy} className="btn-primary w-full">
                {busy
                  ? "Un momento…"
                  : mode === "login"
                    ? "Entrar"
                    : mode === "registro"
                      ? "Crear cuenta"
                      : "Enviar enlace"}
              </button>
            </form>
            {mode === "login" && (
              <button
                type="button"
                className="mt-3 w-full text-sm text-muted-foreground underline"
                onClick={() => setMode("olvido")}
              >
                ¿Olvidaste tu contraseña?
              </button>
            )}
            {mode === "olvido" && (
              <button
                type="button"
                className="mt-3 w-full text-sm text-muted-foreground underline"
                onClick={() => setMode("login")}
              >
                Volver
              </button>
            )}
            {mode !== "olvido" && (
              <>
                <div className="my-4 text-center text-xs text-muted-foreground">o</div>
                <button type="button" disabled={busy} onClick={google} className="btn-ghost w-full">
                  Continuar con Google
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
