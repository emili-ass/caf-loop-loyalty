export function ThemeSwitch({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="theme-setting">
      <div>
        <span className="font-medium">Apariencia</span>
        <p className="text-xs text-muted-foreground">
          {checked ? "Modo oscuro · Buenas noches" : "Modo claro · Buenos días"}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label="Modo oscuro"
        className="theme-switch"
        data-night={checked}
        onClick={() => onCheckedChange(!checked)}
      >
        <span className="theme-switch-scene" aria-hidden="true">
          <span className="theme-switch-stars">
            <span>✦</span>
            <span>✧</span>
            <span>✦</span>
          </span>
          <svg
            className="theme-switch-cloud theme-switch-cloud-back"
            viewBox="0 0 48 24"
            fill="currentColor"
          >
            <path d="M8 23a7 7 0 0 1-1-14 10 10 0 0 1 19-3 8 8 0 0 1 12 4 7 7 0 1 1 1 13Z" />
          </svg>
          <svg
            className="theme-switch-cloud theme-switch-cloud-front"
            viewBox="0 0 48 24"
            fill="currentColor"
          >
            <path d="M8 23a7 7 0 0 1-1-14 10 10 0 0 1 19-3 8 8 0 0 1 12 4 7 7 0 1 1 1 13Z" />
          </svg>
          <span className="theme-switch-orb">
            <span className="theme-switch-crater" />
            <span className="theme-switch-crater" />
            <span className="theme-switch-crater" />
          </span>
        </span>
      </button>
    </div>
  );
}
