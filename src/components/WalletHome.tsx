import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { QrCode, Smartphone } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { fetchMyCards } from "@/lib/loyalty.queries";
import { sampleCards, sampleCafes } from "@/lib/wallet-data";
import { WalletStack } from "./WalletStack";

export function WalletHome() {
  const [showDemo, setShowDemo] = useState(false);
  const { user, ready } = useSession();
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["my-cards"],
    queryFn: fetchMyCards,
    enabled: ready && Boolean(user),
  });
  const demo = showDemo;
  return (
    <div className="wallet-home">
      <div className="wallet-heading">
        <div>
          <p className="wallet-eyebrow">LOOP / TU DÍA A DÍA</p>
          <h1>Tu cartera.</h1>
          <p className="mt-2 text-muted-foreground">Tus lugares favoritos. Siempre contigo.</p>
        </div>
        <span className="wallet-nfc-badge">
          <Smartphone className="h-4 w-4" aria-hidden="true" /> NFC + QR
        </span>
      </div>
      <section className="wallet-first-visit" aria-label="Cómo funciona Loop">
        <p>Escanea en la cafetería → guarda tu tarjeta → acumula sellos → recibe tu recompensa</p>
        <p>
          Las tarjetas reales se incorporan desde el NFC o QR del establecimiento y requieren
          iniciar sesión. En esta versión, el alta NFC/QR está pendiente de conexión.
        </p>
      </section>
      <button
        type="button"
        className="btn-ghost my-4"
        aria-expanded={showDemo}
        aria-controls="wallet-cards"
        onClick={() => setShowDemo((value) => !value)}
      >
        {showDemo ? "Ocultar demostración" : "Explorar demostración sin cuenta"}
      </button>
      {(!ready || (user && isPending)) && !demo ? (
        <p role="status" className="wallet-empty">
          Abriendo tu cartera…
        </p>
      ) : isError && user && !demo ? (
        <div role="alert" className="wallet-empty">
          <p>No se pudieron cargar tus tarjetas.</p>
          <button className="btn-primary mt-4" onClick={() => refetch()}>
            Reintentar
          </button>
        </div>
      ) : (
        <div className="wallet-layout">
          <section id="wallet-cards" aria-label={demo ? "Cartera de muestra" : "Tus tarjetas"}>
            {demo || (user && data?.cards.length) ? (
              <>
                <div className="wallet-summary">
                  <p>
                    <strong>{demo ? sampleCards.length : data?.cards.length}</strong>{" "}
                    {demo ? "tarjetas de muestra" : "tarjetas"}
                  </p>
                  {!demo && (
                    <p>
                      <strong>
                        {data?.cards.reduce((sum, card) => sum + card.rewards_available, 0)}
                      </strong>{" "}
                      recompensas
                    </p>
                  )}
                </div>
                <WalletStack
                  cards={demo ? sampleCards : (data?.cards ?? [])}
                  cafes={demo ? sampleCafes : (data?.cafes ?? [])}
                  demo={demo}
                />
                <p className="wallet-stack-hint">
                  <span className="wallet-hint-desktop">
                    Pasa el cursor o usa Tab y Enter en la flecha para desplegar. Después elige «Ver
                    cafetería».
                  </span>
                  <span className="wallet-hint-touch">
                    Toca la flecha para desplegar la tarjeta y después «Ver cafetería» para abrirla.
                  </span>
                </p>
              </>
            ) : (
              <div className="wallet-empty">
                <h2 className="text-xl">
                  {user
                    ? "Tu cartera aún no tiene tarjetas"
                    : "Tu cartera empieza en tu próxima visita"}
                </h2>
                <p className="mt-3 text-muted-foreground">
                  {user
                    ? "Aquí aparecerán tus tarjetas reales. Puedes explorar la demostración mientras tanto."
                    : "Inicia sesión para ver tu cartera real, o explora la demostración sin crear una cuenta."}
                </p>
              </div>
            )}
          </section>
          <aside className="wallet-side-note">
            <span className="wallet-note-icon">
              <QrCode aria-hidden="true" />
            </span>
            <p className="wallet-eyebrow">DEL MOSTRADOR A TU CARTERA</p>
            <h2>
              Un toque.
              <br />
              Un nuevo lugar.
            </h2>
            <p>
              Para obtener tu tarjeta, acerca tu teléfono al NFC o escanea el QR de la cafetería
              durante tu visita.
            </p>
            <p>Las tarjetas se incorporan únicamente desde el NFC o QR del establecimiento.</p>
            {demo && (
              <div className="wallet-demo-note">
                <strong>Estás viendo una muestra</strong>
                <p>
                  Estas tarjetas y sus sellos son ficticios. Explóralas para conocer la experiencia.
                </p>
              </div>
            )}
            {!user && (
              <Link to="/acceso" search={{ redirect: "/" }} className="btn-primary">
                Iniciar sesión
              </Link>
            )}
          </aside>
        </div>
      )}
      <p className="wallet-footer">
        loop. <span>cada visita cuenta</span>
      </p>
    </div>
  );
}
