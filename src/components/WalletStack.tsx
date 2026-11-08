import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ChevronDown, Coffee } from "lucide-react";
import { cafePresentation, stampTarget, type WalletCard, type WalletCafe } from "@/lib/wallet-data";

export function LoyaltyPass({
  card,
  cafe,
  demo = false,
  headerAction,
  footerAction,
  detailsId,
  detailsHidden = false,
}: {
  card: WalletCard;
  cafe?: WalletCafe | undefined;
  demo?: boolean;
  headerAction?: ReactNode;
  footerAction?: ReactNode;
  detailsId?: string;
  detailsHidden?: boolean;
}) {
  const target = stampTarget(cafe);
  const presentation = cafePresentation(card.cafe_id, cafe?.name);
  return (
    <div
      className={`wallet-pass pass-${presentation.tone} ${presentation.cardArtwork ? "wallet-pass-art" : ""} ${target === 10 ? "wallet-pass-ten" : ""}`}
      style={
        presentation.cardArtwork
          ? {
              backgroundImage: `linear-gradient(90deg, rgb(0 0 0 / 28%), rgb(0 0 0 / 5%)), url("${presentation.cardArtwork}")`,
            }
          : undefined
      }
    >
      <div className="wallet-pass-header">
        <div>
          <p className="wallet-pass-label">{demo ? "TARJETA DE MUESTRA" : "LOOP / FIDELIDAD"}</p>
          <h2>{cafe?.name ?? "Tu cafetería"}</h2>
        </div>
        {headerAction ?? <Coffee className="mt-1 shrink-0" aria-hidden="true" />}
      </div>
      <div id={detailsId} inert={detailsHidden} aria-hidden={detailsHidden || undefined}>
        <div className="wallet-stamps" aria-label={`${card.stamps} de ${target} sellos`}>
          {Array.from({ length: target }, (_, index) => (
            <span key={index} className={index < card.stamps ? "is-stamped" : ""}>
              {index < card.stamps ? <Coffee aria-hidden="true" /> : index + 1}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span>
            {card.stamps} de {target} sellos
          </span>
          <span>{card.rewards_available} recompensas</span>
        </div>
        <div className="wallet-pass-bottom">
          <span>cada visita cuenta</span>
          <span className="wallet-preview-logo">loop.</span>
        </div>
        {footerAction}
      </div>
    </div>
  );
}

export function WalletStack({
  cards,
  cafes,
  demo = false,
}: {
  cards: WalletCard[];
  cafes: WalletCafe[];
  demo?: boolean;
}) {
  const [active, setActive] = useState<string | null>(() => cards.at(-1)?.id ?? null);
  const stackRef = useRef<HTMLDivElement>(null);
  const groupId = useId();
  useEffect(() => {
    const passes = stackRef.current?.querySelectorAll<HTMLElement>(".wallet-pass");
    if (!passes) return;
    const measure = (pass: HTMLElement) => {
      const item = pass.closest<HTMLElement>(".wallet-stack-item");
      const header = pass.querySelector<HTMLElement>(".wallet-pass-header");
      const bounds = pass.getBoundingClientRect();
      if (!item || !header || bounds.height === 0) return;
      const padding = parseFloat(getComputedStyle(pass).paddingTop);
      item.style.setProperty("--wallet-expanded-height", bounds.height + "px");
      item.style.setProperty(
        "--wallet-collapsed-height",
        header.getBoundingClientRect().height + padding * 2 + "px",
      );
    };
    passes.forEach(measure);
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) =>
      entries.forEach((entry) => measure(entry.target as HTMLElement)),
    );
    passes.forEach((pass) => observer.observe(pass));
    return () => observer.disconnect();
  }, [cards]);
  return (
    <div
      ref={stackRef}
      className="wallet-stack"
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse" && !event.currentTarget.contains(document.activeElement))
          setActive(cards.at(-1)?.id ?? null);
      }}
    >
      {cards.map((card, index) => {
        const cafe = cafes.find((cafe) => cafe.id === card.cafe_id);
        const expanded = active === card.id;
        const detailsId = groupId + "-card-" + index;
        const name = cafe?.name ?? "Tu cafetería";
        const openLink = demo ? (
          <Link
            to="/demo/$cafeId"
            params={{ cafeId: card.cafe_id }}
            className="wallet-stack-open"
            aria-label={"Ver cafetería " + name + ", demostración"}
          >
            Ver cafetería <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : (
          <Link
            to="/tarjeta"
            search={{ cafe: card.cafe_id }}
            className="wallet-stack-open"
            aria-label={"Ver cafetería " + name}
          >
            Ver cafetería <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        );
        return (
          <article
            key={card.id}
            className={"wallet-stack-item " + (expanded ? "is-expanded" : "")}
            style={{ zIndex: index + 1 }}
            onPointerEnter={(event) => {
              if (event.pointerType === "mouse") setActive(card.id);
            }}
          >
            <LoyaltyPass
              card={card}
              cafe={cafe}
              demo={demo}
              detailsId={detailsId}
              detailsHidden={!expanded}
              headerAction={
                <button
                  type="button"
                  className="wallet-card-toggle"
                  aria-label={(expanded ? "Contraer tarjeta de " : "Desplegar tarjeta de ") + name}
                  aria-expanded={expanded}
                  aria-controls={detailsId}
                  onClick={() => setActive(expanded ? null : card.id)}
                >
                  <ChevronDown className="h-5 w-5" aria-hidden="true" />
                </button>
              }
              footerAction={openLink}
            />
          </article>
        );
      })}
    </div>
  );
}
