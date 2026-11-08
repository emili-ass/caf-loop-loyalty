import hero from "@/assets/cafe-hero.jpg";

export type WalletCard = {
  id: string;
  cafe_id: string;
  code: string;
  stamps: number;
  rewards_available: number;
};
export type WalletCafe = {
  id: string;
  name: string;
  reward_description: string;
  stamps_required?: number;
};

export function stampTarget(cafe?: WalletCafe) {
  return cafe?.stamps_required ?? 8;
}

// These examples are presentation-only; they never create memberships or stamps.
export const sampleCafes: WalletCafe[] = [
  {
    id: "sample-molienda",
    name: "La Molienda",
    reward_description: "Una bebida de tu elección al completar 10 sellos.",
    stamps_required: 10,
  },
  {
    id: "sample-tueste",
    name: "Café Tueste del Norte",
    reward_description: "Un cappuccino de cortesía al completar 10 sellos.",
    stamps_required: 10,
  },
  {
    id: "sample-patio",
    name: "Patio 24",
    reward_description: "Un café y una pieza de pan al completar 8 sellos.",
  },
];
export const sampleCards: WalletCard[] = sampleCafes.map((cafe, index) => ({
  id: `preview-${index}`,
  cafe_id: cafe.id,
  code: "VISTA DE MUESTRA",
  stamps: index < 2 ? 2 : 7,
  rewards_available: 0,
}));

export function cafePresentation(id: string, name = "") {
  const index = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 3;
  const normalizedName = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const imageSet =
    normalizedName.includes("tueste") || normalizedName.includes("norte") || id === "sample-tueste"
      ? "tueste"
      : normalizedName.includes("molienda") || id === "sample-molienda"
        ? "molienda"
        : null;
  return {
    cardArtwork: imageSet ? `/images/${imageSet}-card.png` : undefined,
    tone: ["ink", "forest", "clay"][index],
    description: [
      "Café de especialidad, pan recién horneado y una barra donde siempre hay tiempo para una buena conversación.",
      "Un rincón tranquilo para disfrutar un espresso, leer un poco y descubrir granos de pequeños productores.",
      "Desayunos sin prisa, mesas al aire libre y café preparado a tu manera. Tu pausa favorita del día.",
    ][index],
    address: [
      "Calle del Café 120, Colonia Centro, Monterrey, Nuevo León",
      "Avenida del Parque 45, Colonia Jardín, Monterrey, Nuevo León",
      "Calle del Sol 24, Colonia Centro, Monterrey, Nuevo León",
    ][index],
    hours: [
      { day: "Lunes a viernes", time: "07:30 – 20:00" },
      { day: "Sábado", time: "08:00 – 21:00" },
      { day: "Domingo", time: "09:00 – 16:00" },
    ],
    menu: [
      { name: "Espresso", description: "Doble extracción · notas de chocolate", price: 42 },
      { name: "Cappuccino", description: "Espresso y leche con microespuma", price: 62 },
      { name: "Latte de vainilla", description: "Vainilla y leche a tu elección", price: 68 },
      { name: "Cold brew", description: "Extracción en frío de 18 horas", price: 65 },
      { name: "Croissant", description: "Mantequilla · horneado del día", price: 48 },
      { name: "Tostada de aguacate", description: "Pan de masa madre y semillas", price: 95 },
    ],
    photos: [
      ...(!imageSet
        ? [
            {
              src: hero,
              alt: "Café latte sobre una barra de madera",
              caption: "El café de cada día",
            },
          ]
        : []),
      {
        src: imageSet ? `/images/${imageSet}-interior.png` : "/images/cafe-interior.jpg",
        alt: "Interior de una cafetería con mesas y luz natural",
        caption: imageSet ? "Nuestro espacio · Muestra generada con IA" : "Quédate un rato",
      },
      {
        src: imageSet ? `/images/${imageSet}-rincon.png` : "/images/cafe-coffee.jpg",
        alt: imageSet
          ? "Rincón de mesas y asientos de la cafetería, generado con IA"
          : "Café de especialidad servido en una taza",
        caption: imageSet ? "Tu próxima pausa · Muestra generada con IA" : "Preparado con calma",
      },
    ],
  };
}
