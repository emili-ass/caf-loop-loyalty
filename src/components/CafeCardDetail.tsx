import { Link } from "@tanstack/react-router";
import { ArrowLeft, Clock, Gift, MapPin, QrCode, Smartphone } from "lucide-react";
import { cafePresentation, stampTarget, type WalletCard, type WalletCafe } from "@/lib/wallet-data";
import { LoyaltyPass } from "./WalletStack";

export function CafeCardDetail({
  card,
  cafe,
  name,
  demo = false,
}: {
  card: WalletCard;
  cafe?: WalletCafe | undefined;
  name: string;
  demo?: boolean;
}) {
  const info = cafePresentation(card.cafe_id, cafe?.name);
  const target = stampTarget(cafe);
  return (
    <div className="cafe-detail">
      <Link to="/" className="cafe-back">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Mi cartera
      </Link>
      <header className="cafe-greeting">
        <p className="wallet-eyebrow">{demo ? "DEMOSTRACIÓN DE LOOP" : "MI TARJETA"}</p>
        <h1>Hola, {demo ? name : `@${name}`}</h1>
        <p className="text-muted-foreground">Hoy también es un buen día para volver.</p>
      </header>
      {demo && (
        <div className="cafe-sample-notice space-y-3">
          <p>Tarjeta de demostración · Los sellos y recompensas son ficticios.</p>
          <p>
            No se guarda en tu cartera. Para incorporar una tarjeta real, visita la cafetería y usa
            su NFC o QR.
          </p>
          <Link to="/acceso" search={{ redirect: "/" }} className="btn-ghost">
            Iniciar sesión para mi cartera real
          </Link>
        </div>
      )}
      <div className="cafe-detail-grid">
        <aside className="cafe-card-column" aria-label="Tu tarjeta seleccionada">
          <LoyaltyPass card={card} cafe={cafe} demo={demo} />
          <div className="cafe-reward">
            <Gift className="h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold">Tu próxima recompensa</p>
              <p>{cafe?.reward_description ?? `Una bebida al completar ${target} sellos.`}</p>
              <p className="mt-2">
                {Math.max(0, target - card.stamps)} sellos para completar tu tarjeta.
              </p>
            </div>
          </div>
          {!demo && (
            <div className="cafe-card-code">
              <p>Muestra este código en caja</p>
              <strong>{card.code}</strong>
            </div>
          )}
          <div className="cafe-nfc-note">
            <Smartphone className="h-5 w-5 shrink-0" aria-hidden="true" />
            <p>Las tarjetas reales se incorporan desde el NFC o QR de la cafetería.</p>
          </div>
        </aside>
        <div className="cafe-content">
          <section>
            <p className="wallet-eyebrow">TU CAFETERÍA</p>
            <h2 className="cafe-title">{cafe?.name ?? "Tu cafetería"}</h2>
            <p className="cafe-description">{info.description}</p>
            <p className="cafe-sample-label">Menú, fotografías, horarios y ubicación de muestra.</p>
            <div className={`cafe-photos ${info.photos.length === 2 ? "cafe-photos-pair" : ""}`}>
              {info.photos.map((photo) => (
                <figure key={photo.src}>
                  <img
                    src={photo.src}
                    alt={`${photo.alt} (fotografía de muestra)`}
                    width={1536}
                    height={1024}
                    loading="lazy"
                  />
                  <figcaption>{photo.caption}</figcaption>
                </figure>
              ))}
            </div>
          </section>
          <section className="cafe-menu" aria-labelledby="cafe-menu-title">
            <div className="cafe-section-heading">
              <h2 id="cafe-menu-title">Algo para disfrutar</h2>
              <span>Menú de muestra · MXN</span>
            </div>
            <ul>
              {info.menu.map((item) => (
                <li key={item.name}>
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                  </div>
                  <span>${item.price}</span>
                </li>
              ))}
            </ul>
          </section>
          <div className="cafe-info-grid">
            <section className="cafe-info-box">
              <h2>
                <Clock className="h-5 w-5" aria-hidden="true" /> Horarios
              </h2>
              <dl>
                {info.hours.map((hour) => (
                  <div key={hour.day}>
                    <dt>{hour.day}</dt>
                    <dd>{hour.time}</dd>
                  </div>
                ))}
              </dl>
              <p className="cafe-sample-label">Horarios de muestra</p>
            </section>
            <section className="cafe-info-box">
              <h2>
                <MapPin className="h-5 w-5" aria-hidden="true" /> Encuéntranos
              </h2>
              <div
                className="cafe-map-placeholder"
                role="img"
                aria-label="Ilustración de ubicación de muestra; no es un mapa real"
              >
                <MapPin aria-hidden="true" />
                <span>Ubicación de muestra</span>
              </div>
              <p>{info.address}</p>
              <p className="cafe-sample-label">Dirección ficticia para la demostración.</p>
            </section>
          </div>
          <p className="cafe-bottom-note">
            <QrCode className="h-4 w-4 shrink-0" aria-hidden="true" /> Cada visita se suma a tu
            historia con este lugar.
          </p>
        </div>
      </div>
    </div>
  );
}
