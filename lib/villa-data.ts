export type Villa = {
  id: string;
  name: string;
  location: "Uluwatu" | "Ubud" | "Canggu" | "Nusa Dua" | "Seminyak";
  category: "Beachfront" | "Jungle" | "Cliffside" | "Family" | "Honeymoon";
  image: string;
  gallery: string[];
  price: number;
  rating: number;
  reviews: number;
  guests: number;
  bedrooms: number;
  bathrooms: number;
  size: string;
  badges: string[];
  amenities: string[];
  available: boolean;
  highlight: string;
  description: string;
  address: string;
};

export const villas: Villa[] = [
  {
    id: "aruna-cliffside",
    name: "Villa Aruna Cliffside",
    location: "Uluwatu",
    category: "Cliffside",
    image:
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=85",
    gallery: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=85",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=85",
    ],
    price: 4800000,
    rating: 4.96,
    reviews: 128,
    guests: 8,
    bedrooms: 4,
    bathrooms: 4,
    size: "520m²",
    badges: ["Sunset deck", "Infinity pool", "Private chef"],
    amenities: ["Pool", "WiFi", "Ocean view", "Airport pickup"],
    available: true,
    highlight: "Tebing privat dengan panorama sunset Samudra Hindia.",
    description:
      "Villa cliffside bergaya resort dengan infinity pool, ruang keluarga terbuka, sunset deck, dan layanan chef privat. Cocok untuk family escape, honeymoon group, atau staycation mewah yang membutuhkan privasi tinggi.",
    address: "Jl. Pantai Suluban, Uluwatu, Bali",
  },
  {
    id: "nara-jungle",
    name: "Nara Jungle Residence",
    location: "Ubud",
    category: "Jungle",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85",
    gallery: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=85",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=85",
    ],
    price: 3650000,
    rating: 4.92,
    reviews: 96,
    guests: 6,
    bedrooms: 3,
    bathrooms: 3,
    size: "410m²",
    badges: ["Forest view", "Spa room", "Breakfast"],
    amenities: ["Pool", "WiFi", "Spa", "Breakfast"],
    available: true,
    highlight: "Retreat tropis di tengah pepohonan dengan ruang spa privat.",
    description:
      "Residence tropis yang menyatu dengan vegetasi Ubud. Area lounge menghadap forest view, tersedia ruang spa privat, breakfast harian, dan atmosfer tenang untuk tamu yang ingin recharge.",
    address: "Jl. Raya Kedewatan, Ubud, Bali",
  },
  {
    id: "sagara-beach",
    name: "Sagara Beach House",
    location: "Canggu",
    category: "Beachfront",
    image:
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=85",
    gallery: [
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1600&q=85",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=85",
    ],
    price: 5250000,
    rating: 4.98,
    reviews: 152,
    guests: 10,
    bedrooms: 5,
    bathrooms: 5,
    size: "680m²",
    badges: ["Beach access", "Media room", "Concierge"],
    amenities: ["Pool", "WiFi", "Beach", "Chef"],
    available: true,
    highlight: "Rumah pantai luas untuk keluarga besar dan private event.",
    description:
      "Beach house besar dengan akses pantai, media room, dining area luas, dan concierge. Dirancang untuk keluarga besar, grup teman, serta intimate gathering dengan pelayanan penuh.",
    address: "Jl. Pantai Pererenan, Canggu, Bali",
  },
  {
    id: "maira-family-estate",
    name: "Maira Family Estate",
    location: "Nusa Dua",
    category: "Family",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85",
    gallery: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85",
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85",
    ],
    price: 6100000,
    rating: 4.94,
    reviews: 88,
    guests: 12,
    bedrooms: 6,
    bathrooms: 6,
    size: "760m²",
    badges: ["Kids room", "Garden lawn", "Butler"],
    amenities: ["Pool", "WiFi", "Garden", "Butler"],
    available: false,
    highlight: "Estate keluarga dengan lawn besar dan layanan butler harian.",
    description:
      "Estate ramah keluarga dengan taman luas, kids room, enam kamar tidur, dan butler harian. Cocok untuk long-stay keluarga atau acara privat berskala kecil.",
    address: "Kawasan ITDC Nusa Dua, Bali",
  },
  {
    id: "luna-honeymoon",
    name: "Luna Honeymoon Villa",
    location: "Seminyak",
    category: "Honeymoon",
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=85",
    gallery: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=85",
      "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85",
    ],
    price: 2950000,
    rating: 4.9,
    reviews: 74,
    guests: 2,
    bedrooms: 1,
    bathrooms: 1,
    size: "220m²",
    badges: ["Private pool", "Bathtub", "Floating breakfast"],
    amenities: ["Pool", "WiFi", "Bathtub", "Breakfast"],
    available: true,
    highlight: "Villa romantis tenang dekat restoran dan beach club Seminyak.",
    description:
      "Villa satu kamar untuk honeymoon dengan private pool, bathtub, floating breakfast, dan akses mudah ke restoran Seminyak. Nuansa tenang, hangat, dan sangat privat.",
    address: "Jl. Drupadi, Seminyak, Bali",
  },
  {
    id: "tirta-palm",
    name: "Tirta Palm Villa",
    location: "Ubud",
    category: "Family",
    image:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1400&q=85",
    gallery: [
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=85",
      "https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85",
    ],
    price: 4200000,
    rating: 4.88,
    reviews: 61,
    guests: 8,
    bedrooms: 4,
    bathrooms: 4,
    size: "500m²",
    badges: ["Ricefield", "Yoga deck", "Chef"],
    amenities: ["Pool", "WiFi", "Yoga", "Chef"],
    available: true,
    highlight: "Ruang terbuka menghadap sawah dengan yoga deck dan chef privat.",
    description:
      "Villa sawah yang menenangkan dengan yoga deck, ruang makan terbuka, dan chef privat. Ideal untuk wellness stay, keluarga kecil, atau kerja remote yang lebih bernafas.",
    address: "Jl. Raya Sayan, Ubud, Bali",
  },
  {
    id: "samaya-ocean",
    name: "Samaya Ocean Pavilion",
    location: "Nusa Dua",
    category: "Beachfront",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=85",
    gallery: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=85",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=85",
    ],
    price: 5750000,
    rating: 4.91,
    reviews: 103,
    guests: 8,
    bedrooms: 4,
    bathrooms: 4,
    size: "590m²",
    badges: ["Ocean pavilion", "Direct beach", "Sunrise breakfast"],
    amenities: ["Pool", "WiFi", "Beach", "Breakfast"],
    available: true,
    highlight: "Pavilion tepi laut dengan akses pantai tenang dan sunrise deck.",
    description:
      "Pavilion beachfront di Nusa Dua dengan suasana tenang, akses pantai langsung, dan area breakfast menghadap sunrise. Premium tapi tetap effortless.",
    address: "Jl. Pantai Mengiat, Nusa Dua, Bali",
  },
  {
    id: "akasa-sky",
    name: "Akasa Sky Villa",
    location: "Uluwatu",
    category: "Honeymoon",
    image:
      "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1400&q=85",
    gallery: [
      "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1600&q=85",
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=85",
    ],
    price: 3350000,
    rating: 0,
    reviews: 0,
    guests: 4,
    bedrooms: 2,
    bathrooms: 2,
    size: "300m²",
    badges: ["New listing", "Sky lounge", "Plunge pool"],
    amenities: ["Pool", "WiFi", "Lounge", "Breakfast"],
    available: true,
    highlight: "Villa compact elegan dengan lounge terbuka di atas tebing.",
    description:
      "Villa dua kamar yang compact dan romantis dengan sky lounge, plunge pool, dan setup dinner privat. Cocok untuk pasangan atau small group.",
    address: "Jl. Labuan Sait, Uluwatu, Bali",
  },
  {
    id: "kayumanis-garden",
    name: "Kayumanis Garden Villa",
    location: "Seminyak",
    category: "Family",
    image:
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1400&q=85",
    gallery: [
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1600&q=85",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=85",
    ],
    price: 3900000,
    rating: 4.86,
    reviews: 57,
    guests: 7,
    bedrooms: 3,
    bathrooms: 3,
    size: "460m²",
    badges: ["Garden pool", "Quiet lane", "Family dining"],
    amenities: ["Pool", "WiFi", "Garden", "Chef"],
    available: false,
    highlight: "Hunian tropis di jalur tenang Seminyak dengan garden pool.",
    description:
      "Villa keluarga dengan garden pool, dining area nyaman, dan posisi tenang di Seminyak. Cocok untuk tamu yang ingin dekat keramaian tanpa kehilangan privasi.",
    address: "Jl. Bidadari, Seminyak, Bali",
  },
  {
    id: "rimba-valley",
    name: "Rimba Valley Retreat",
    location: "Ubud",
    category: "Jungle",
    image:
      "https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&w=1400&q=85",
    gallery: [
      "https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&w=1600&q=85",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85",
    ],
    price: 4550000,
    rating: 4.95,
    reviews: 111,
    guests: 9,
    bedrooms: 4,
    bathrooms: 5,
    size: "620m²",
    badges: ["Valley view", "Meditation deck", "Heated pool"],
    amenities: ["Pool", "WiFi", "Yoga", "Spa"],
    available: true,
    highlight: "Retreat lembah hijau untuk grup kecil, wellness trip, dan family stay.",
    description:
      "Retreat lembah hijau dengan heated pool, meditation deck, dan ruang komunal terbuka. Dirancang untuk wellness trip, family stay, atau team retreat yang tenang.",
    address: "Jl. Bisma Valley, Ubud, Bali",
  },
];

export function getVillaById(id: string) {
  return villas.find((villa) => villa.id === id);
}

export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
