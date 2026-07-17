export const websiteSettingsDefaults = {
  siteName: "Villaku Private Resorts",
  tagline: "Private stays, thoughtfully curated",
  supportEmail: "stay@villaku.id",
  phone: "+62 811 3888 2026",
  address: "Jl. Pantai Berawa No. 18, Canggu, Bali",
  heroEyebrow: "Luxury villa booking experience",
  heroTitle: "Temukan villa premium untuk momen yang terasa privat.",
  heroDescription:
    "Vila terkurasi dengan layanan personal, pengalaman autentik, dan kenyamanan tanpa kompromi.",
  heroImage:
    "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=85",
  announcementEnabled: true,
  announcement: "Summer escape · Hemat hingga 15% untuk stay 4 malam",
  metaTitle: "Villaku | Luxury Private Villas in Bali",
  metaDescription:
    "Temukan villa privat premium di Bali dengan layanan personal, fasilitas lengkap, dan proses booking yang aman bersama Villaku.",
  metaKeywords: "villa bali, villa private, luxury resort, booking villa bali",
  canonicalUrl: "https://villaku.id",
  openGraphImage:
    "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85",
  searchIndexEnabled: true,
  mapsApiKey: "",
  mapLatitude: "-8.6478",
  mapLongitude: "115.1385",
  mapZoom: "13",
  mapStyle: "roadmap",
  mapEnabled: true,
};

export type WebsiteSettings = typeof websiteSettingsDefaults;

const globalForSettings = globalThis as typeof globalThis & {
  villakuWebsiteSettings?: WebsiteSettings;
};

export function getMemoryWebsiteSettings() {
  return globalForSettings.villakuWebsiteSettings ?? websiteSettingsDefaults;
}

export function saveMemoryWebsiteSettings(patch: Partial<WebsiteSettings>) {
  const settings = { ...getMemoryWebsiteSettings(), ...patch };
  globalForSettings.villakuWebsiteSettings = settings;
  return settings;
}

export function resetMemoryWebsiteSettings() {
  globalForSettings.villakuWebsiteSettings = { ...websiteSettingsDefaults };
  return globalForSettings.villakuWebsiteSettings;
}
