// Datos ficticios para la demostración visual. No provienen de ningún servidor.
export const cafe = {
  name: "Café La Molienda",
  tagline: "Tostado local, servido con calma en el centro de Monterrey.",
  address: "Calle Morelos 214, Centro, Monterrey",
  reviewsUrl: "https://www.google.com/maps/search/?api=1&query=cafeteria+monterrey",
  hours: [
    { day: "Lunes a viernes", time: "7:00 – 20:00" },
    { day: "Sábado", time: "8:00 – 21:00" },
    { day: "Domingo", time: "9:00 – 15:00" },
  ],
  menu: [
    { name: "Espresso", price: 38 },
    { name: "Americano", price: 42 },
    { name: "Cappuccino", price: 55 },
    { name: "Latte de vainilla", price: 62 },
    { name: "Cold brew", price: 58 },
    { name: "Croissant de mantequilla", price: 45 },
  ],
  promos: [
    { title: "Martes de dos", text: "Segundo cappuccino a mitad de precio." },
    { title: "Mañanas tempraneras", text: "Antes de las 9:00, pan dulce gratis con tu café." },
  ],
};

export const STAMPS_TOTAL = 8;
export const reward = "Una bebida de tu elección gratis";
export const demoCustomer = { name: "Ana López", stamps: 5 };

export const ownerStats = {
  customers: 248,
  stampsThisMonth: 612,
  rewardsRedeemed: 37,
  returnRate: 64,
  weekly: [42, 58, 51, 67, 73, 88, 61],
};
