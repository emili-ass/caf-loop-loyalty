import { useEffect, useRef, useState } from "react";
import { Accessibility } from "lucide-react";
import { ThemeSwitch } from "./ThemeSwitch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const defaults = {
  size: 100,
  theme: "light",
  contrast: false,
  grayscale: false,
  links: false,
  spacing: false,
  readable: false,
  cursor: false,
  guide: false,
  motion: false,
  controls: false,
};
type Preferences = typeof defaults;
const storageKey = "loop-accessibility";

function loadPreferences(): Preferences {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
    const result = { ...defaults };
    for (const key of Object.keys(defaults) as (keyof Preferences)[]) {
      if (typeof defaults[key] === "boolean" && typeof saved[key] === "boolean") {
        Object.assign(result, { [key]: saved[key] });
      }
    }
    if ([80, 90, 100, 110, 120, 130, 140, 150].includes(saved.size)) result.size = saved.size;
    if (["light", "dark"].includes(saved.theme)) result.theme = saved.theme;
    return result;
  } catch {
    return { ...defaults };
  }
}

export function AccessibilityPanel() {
  const [preferences, setPreferences] = useState(defaults);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [guideY, setGuideY] = useState(200);
  const skipOnClose = useRef(false);

  useEffect(() => {
    setPreferences(loadPreferences());
    setSpeechAvailable("speechSynthesis" in window && "SpeechSynthesisUtterance" in window);
    setReady(true);
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    root.style.fontSize = `${preferences.size}%`;
    root.classList.toggle("dark", preferences.theme === "dark");
    for (const key of [
      "contrast",
      "grayscale",
      "links",
      "spacing",
      "readable",
      "cursor",
      "motion",
      "controls",
    ] as const) {
      root.classList.toggle(`a11y-${key}`, preferences[key]);
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(preferences));
    } catch {
      /* Settings still work without storage. */
    }
  }, [preferences, ready]);

  useEffect(() => {
    if (!preferences.guide) return;
    const move = (event: PointerEvent) => setGuideY(event.clientY);
    const key = (event: KeyboardEvent) => {
      if (
        open ||
        (event.target instanceof HTMLElement &&
          event.target.closest("input, textarea, select, [contenteditable=true]"))
      )
        return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setGuideY((y) =>
          Math.max(0, Math.min(window.innerHeight - 4, y + (event.key === "ArrowDown" ? 24 : -24))),
        );
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("keydown", key);
    };
  }, [preferences.guide, open]);

  function toggle(key: keyof Preferences, label: string) {
    return (
      <label className="flex cursor-pointer items-center justify-between gap-4 border-b border-border py-3">
        <span>{label}</span>
        <input
          type="checkbox"
          className="h-5 w-5 shrink-0 accent-current"
          checked={Boolean(preferences[key])}
          onChange={(e) => setPreferences((p) => ({ ...p, [key]: e.target.checked }))}
        />
      </label>
    );
  }

  function stopReading() {
    if (speechAvailable) window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  function read() {
    const text = document.getElementById("main-content")?.innerText;
    if (!text || !speechAvailable) return;
    stopReading();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-MX";
    utterance.onend = utterance.onerror = () => setSpeaking(false);
    setOpen(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Accesibilidad"
            className="accessibility-trigger flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-border px-3 py-2 text-sm font-medium"
          >
            <Accessibility className="h-4 w-4" aria-hidden="true" />
            <span className="accessibility-trigger-text">Accesibilidad</span>
          </button>
        </SheetTrigger>
        <SheetContent
          className="accessibility-panel w-full overflow-y-auto sm:max-w-md"
          onCloseAutoFocus={(event) => {
            if (skipOnClose.current) {
              event.preventDefault();
              skipOnClose.current = false;
              document.getElementById("main-content")?.focus();
            }
          }}
        >
          <SheetTitle>Accesibilidad</SheetTitle>
          <SheetDescription className="mt-2">
            Personaliza tu experiencia. Tus preferencias se guardan en este navegador.
          </SheetDescription>
          <div className="mt-6 space-y-6 text-sm">
            <fieldset>
              <legend className="text-lg font-semibold">Ajustes visuales</legend>
              <label className="mt-3 block" htmlFor="a11y-size">
                Tamaño del texto: {preferences.size}%
              </label>
              <input
                id="a11y-size"
                className="my-3 w-full accent-current"
                type="range"
                min="80"
                max="150"
                step="10"
                value={preferences.size}
                onChange={(e) => setPreferences((p) => ({ ...p, size: Number(e.target.value) }))}
              />
              <ThemeSwitch
                checked={preferences.theme === "dark"}
                onCheckedChange={(dark) =>
                  setPreferences((p) => ({ ...p, theme: dark ? "dark" : "light" }))
                }
              />
              {toggle("contrast", "Alto contraste")}
              {toggle("grayscale", "Escala de grises")}
              {toggle("links", "Resaltar enlaces")}
              {toggle("spacing", "Ampliar espaciado de letras y líneas")}
            </fieldset>
            <fieldset>
              <legend className="text-lg font-semibold">Lectura y comprensión</legend>
              {toggle("readable", "Tipografía más legible")}
              {toggle("cursor", "Cursor ampliado")}
              {toggle("guide", "Guía de lectura")}
              <p className="mt-2 text-muted-foreground">
                La guía sigue el puntero. Fuera del panel, muévela con las flechas arriba y abajo.
              </p>
              {toggle("motion", "Pausar animaciones y movimientos")}
              <button
                type="button"
                className="btn-ghost mt-3 w-full disabled:opacity-50"
                disabled={!speechAvailable}
                onClick={speaking ? stopReading : read}
              >
                {speaking ? "Detener lectura" : "Leer contenido en voz alta"}
              </button>
              {!speechAvailable && (
                <p className="mt-2 text-muted-foreground">
                  La lectura en voz alta no está disponible en este navegador.
                </p>
              )}
            </fieldset>
            <fieldset>
              <legend className="text-lg font-semibold">Navegación</legend>
              <p className="mt-3 text-muted-foreground">
                Usa Tab y Mayús + Tab para recorrer los controles, Enter o Espacio para activarlos y
                Escape para cerrar este panel. El foco siempre es visible al usar el teclado.
              </p>
              {toggle("controls", "Destacar botones y enlaces")}
              <button
                type="button"
                className="btn-ghost mt-3 w-full"
                onClick={() => {
                  skipOnClose.current = true;
                  setOpen(false);
                }}
              >
                Saltar al contenido principal
              </button>
            </fieldset>
            <button
              type="button"
              className="btn-primary w-full"
              onClick={() => {
                stopReading();
                setPreferences({ ...defaults });
              }}
            >
              Restablecer todas las preferencias
            </button>
          </div>
        </SheetContent>
      </Sheet>
      {preferences.guide && !open && (
        <div aria-hidden="true" className="reading-guide" style={{ top: guideY }} />
      )}
      {speaking && !open && (
        <button
          type="button"
          className="btn-primary fixed bottom-4 right-4 z-40 shadow-lg"
          onClick={stopReading}
        >
          Detener lectura
        </button>
      )}
    </>
  );
}
