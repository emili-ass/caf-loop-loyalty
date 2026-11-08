import { useEffect, useState, type ReactNode } from "react";

const sessionKey = "loop-welcome-seen";

export function LoopWelcome({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(true);

  function finish() {
    try {
      sessionStorage.setItem(sessionKey, "1");
    } catch {
      /* Continue without storage. */
    }
    setVisible(false);
  }

  useEffect(() => {
    let seen = false;
    let paused = false;
    try {
      seen = sessionStorage.getItem(sessionKey) === "1";
    } catch {
      /* Optional storage. */
    }
    try {
      paused = JSON.parse(localStorage.getItem("loop-accessibility") || "{}").motion === true;
    } catch {
      /* Optional settings. */
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (seen || paused || reduced.matches) {
      finish();
      return;
    }
    const timer = window.setTimeout(finish, 3200);
    const onMotionChange = () => {
      if (reduced.matches) finish();
    };
    reduced.addEventListener("change", onMotionChange);
    return () => {
      window.clearTimeout(timer);
      reduced.removeEventListener("change", onMotionChange);
    };
  }, []);

  return (
    <>
      <div inert={visible} aria-hidden={visible ? true : undefined}>
        {children}
      </div>
      {visible && (
        <div className="loop-welcome" aria-label="Bienvenido a Loop">
          <div className="loop-welcome-brand" role="img" aria-label="Loop. Cada visita cuenta.">
            <div className="loop-welcome-lockup" aria-hidden="true">
              <svg className="loop-welcome-symbol" viewBox="0 0 32 32" fill="none">
                <circle
                  className="loop-welcome-point"
                  cx="9"
                  cy="8.5"
                  r="1.6"
                  fill="currentColor"
                />
                <path
                  className="loop-welcome-circle"
                  pathLength="1"
                  d="M9 8.5a11 11 0 1 1-1 15"
                  stroke="currentColor"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
                <path
                  className="loop-welcome-arrow"
                  pathLength="1"
                  d="M7 17v7h7"
                  stroke="currentColor"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="loop-welcome-word">loop.</span>
            </div>
            <p className="loop-welcome-tagline" aria-hidden="true">
              cada visita cuenta
            </p>
          </div>
          <button type="button" className="loop-welcome-skip" onClick={finish}>
            Saltar intro <span aria-hidden="true">↗</span>
          </button>
        </div>
      )}
    </>
  );
}
