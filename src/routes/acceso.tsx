import { createFileRoute, useLocation, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { safeAuthPath as safePath } from "@/lib/auth-redirect";
import { notifyEmailAccess } from "@/lib/email-access-notice";

export const Route = createFileRoute("/acceso")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Acceso — Loop" },
      {
        name: "description",
        content: "Crea tu cuenta o inicia sesión para ver tu tarjeta de sellos.",
      },
      { property: "og:title", content: "Acceso — Loop" },
      { property: "og:description", content: "Regístrate o inicia sesión en Loop." },
    ],
  }),
  component: Acceso,
});

export function Acceso() {
  const { redirect } = Route.useSearch();
  const location = useLocation();
  return (
    <AccessForm
      key={`${location.href}:${location.state.__TSR_key}`}
      redirect={safePath(redirect)}
    />
  );
}

export function AccessForm({ redirect }: { redirect?: string | undefined }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "registro" | "olvido">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const destination = safePath(redirect);
  const path = new URL(destination, "https://loop.invalid").pathname;
  const role =
    path === "/empleados" ? "empleados" : path === "/propietario" ? "propietarios" : "clientes";
  const description =
    mode === "olvido"
      ? "Escribe tu correo y te enviaremos un enlace para elegir una nueva contraseña."
      : mode === "registro"
        ? "Crea tu cuenta de Loop para guardar tus tarjetas. El acceso del equipo requiere autorización de la cafetería."
        : role === "empleados"
          ? "Inicia sesión con la cuenta que la cafetería autorizó para registrar compras."
          : role === "propietarios"
            ? "Inicia sesión con la cuenta propietaria para consultar tu cafetería."
            : "Inicia sesión para consultar tus tarjetas reales y recompensas.";
  function showError(message: string) {
    setFormError(message);
    toast.error(message);
  }
  function changeMode(next: typeof mode) {
    setMode(next);
    setShowPassword(false);
    setFormError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setFormError(null);
    if (
      !email.trim() ||
      (mode !== "olvido" && !password) ||
      (mode === "registro" && !name.trim())
    ) {
      showError("Completa los campos obligatorios.");
      return;
    }
    setBusy(true);
    try {
      try {
        sessionStorage.removeItem("post_auth_redirect");
      } catch {
        /* Optional storage. */
      }
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          showError(
            error.code === "email_not_confirmed"
              ? "Confirma tu correo desde el mensaje que recibiste antes de iniciar sesión."
              : error.message === "Invalid login credentials"
                ? "Correo o contraseña incorrectos."
                : "No se pudo iniciar sesión. Revisa tus datos o inténtalo de nuevo más tarde.",
          );
          return;
        }
        if (data.user) notifyEmailAccess(data.user);
        navigate({ to: safePath(redirect) });
      } else if (mode === "registro") {
        if (password.length < 8) {
          showError("La contraseña debe tener al menos 8 caracteres.");
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + destination,
            data: { display_name: name.trim().slice(0, 80) },
          },
        });
        if (error) {
          showError("No se pudo crear la cuenta. Revisa tus datos o inténtalo de nuevo.");
          return;
        }
        if (data.session) {
          notifyEmailAccess(data.session.user, true);
          await navigate({ to: safePath(redirect) });
          return;
        }
        setSent("Te enviamos un correo para confirmar tu cuenta. Ábrelo y luego inicia sesión.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) {
          showError("No se pudo enviar el enlace. Revisa tu correo e inténtalo de nuevo.");
          return;
        }
        setSent(
          "Si existe una cuenta con ese correo, recibirás un enlace para cambiar tu contraseña.",
        );
      }
    } catch {
      showError("No se pudo conectar. Inténtalo de nuevo.");
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
        <p className="wallet-eyebrow mt-3">Acceso de {role} · Loop</p>
        <p className="mt-2 text-muted-foreground">{description}</p>
      </div>
      <div className="card-soft p-6">
        {sent ? (
          <div role="status" className="space-y-4 text-center">
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
                    disabled={busy}
                    aria-pressed={mode === m}
                    onClick={() => changeMode(m)}
                    className={`rounded-full py-2 font-medium ${mode === m ? "bg-card shadow-soft" : "text-muted-foreground"}`}
                  >
                    {m === "login" ? "Iniciar sesión" : "Registrarme"}
                  </button>
                ))}
              </div>
            )}
            <form
              className="space-y-4"
              onSubmit={onSubmit}
              onInvalid={event => {
                const input = event.target as HTMLInputElement;
                setFormError(input.name === "password" && mode === "registro" && password.length < 8
                  ? "La contraseña debe tener al menos 8 caracteres."
                  : "Revisa los campos obligatorios y el formato del correo.");
              }}
            >
              {formError && (
                <p role="alert" className="auth-form-error">
                  {formError}
                </p>
              )}
              {mode === "registro" && (
                <label className="block text-sm">
                  Nombre
                  <input
                    className="field mt-1"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={80}
                    name="name"
                    autoComplete="name"
                  />
                </label>
              )}
              <label className="block text-sm">
                Correo electrónico
                <input
                  type="email"
                  name="email"
                  autoComplete={mode === "login" ? "username" : "email"}
                  autoCapitalize="none"
                  spellCheck={false}
                  className="field mt-1"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              {mode !== "olvido" && (
                <div className="text-sm">
                  <label htmlFor="auth-password">Contraseña</label>
                  <div className="auth-password-field">
                    <input
                      id="auth-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={mode === "registro" ? "new-password" : "current-password"}
                      aria-describedby={mode === "registro" ? "auth-password-help" : undefined}
                      className="field mt-1"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={mode === "registro" ? 8 : 1}
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      aria-pressed={showPassword}
                      aria-controls="auth-password"
                      onClick={() => setShowPassword((value) => !value)}
                    >
                      {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                    </button>
                  </div>
                  {mode === "registro" && (
                    <p id="auth-password-help" className="mt-2 text-xs text-muted-foreground">
                      Usa al menos 8 caracteres.
                    </p>
                  )}
                </div>
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
                onClick={() => changeMode("olvido")}
              >
                ¿Olvidaste tu contraseña?
              </button>
            )}
            {mode === "olvido" && (
              <button
                type="button"
                className="mt-3 w-full text-sm text-muted-foreground underline"
                onClick={() => changeMode("login")}
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
