"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bath,
  BedDouble,
  CalendarDays,
  ChevronDown,
  Filter,
  Heart,
  Home,
  MapPin,
  Moon,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Sun,
  Users,
  Waves,
  Wifi,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Villa = {
  id: string;
  name: string;
  location: "Uluwatu" | "Ubud" | "Canggu" | "Nusa Dua" | "Seminyak";
  category: "Beachfront" | "Jungle" | "Cliffside" | "Family" | "Honeymoon";
  image: string;
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
};

const villas: Villa[] = [
  {
    id: "aruna-cliffside",
    name: "Villa Aruna Cliffside",
    location: "Uluwatu",
    category: "Cliffside",
    image:
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=85",
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
  },
  {
    id: "nara-jungle",
    name: "Nara Jungle Residence",
    location: "Ubud",
    category: "Jungle",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85",
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
  },
  {
    id: "sagara-beach",
    name: "Sagara Beach House",
    location: "Canggu",
    category: "Beachfront",
    image:
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=85",
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
  },
  {
    id: "maira-family-estate",
    name: "Maira Family Estate",
    location: "Nusa Dua",
    category: "Family",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85",
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
  },
  {
    id: "luna-honeymoon",
    name: "Luna Honeymoon Villa",
    location: "Seminyak",
    category: "Honeymoon",
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=85",
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
  },
  {
    id: "tirta-palm",
    name: "Tirta Palm Villa",
    location: "Ubud",
    category: "Family",
    image:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1400&q=85",
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
  },
  {
    id: "samaya-ocean",
    name: "Samaya Ocean Pavilion",
    location: "Nusa Dua",
    category: "Beachfront",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=85",
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
  },
  {
    id: "akasa-sky",
    name: "Akasa Sky Villa",
    location: "Uluwatu",
    category: "Honeymoon",
    image:
      "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1400&q=85",
    price: 3350000,
    rating: 4.89,
    reviews: 69,
    guests: 4,
    bedrooms: 2,
    bathrooms: 2,
    size: "300m²",
    badges: ["Sky lounge", "Plunge pool", "Romantic setup"],
    amenities: ["Pool", "WiFi", "Lounge", "Breakfast"],
    available: true,
    highlight: "Villa compact elegan dengan lounge terbuka di atas tebing.",
  },
  {
    id: "kayumanis-garden",
    name: "Kayumanis Garden Villa",
    location: "Seminyak",
    category: "Family",
    image:
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1400&q=85",
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
  },
  {
    id: "rimba-valley",
    name: "Rimba Valley Retreat",
    location: "Ubud",
    category: "Jungle",
    image:
      "https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&w=1400&q=85",
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
  },
];

const locations = ["Semua Lokasi", "Uluwatu", "Ubud", "Canggu", "Nusa Dua", "Seminyak"];
const categories = ["Semua Tipe", "Beachfront", "Jungle", "Cliffside", "Family", "Honeymoon"];
const PAGE_SIZE = 4;

const fadeUp = {
  hidden: { opacity: 0, y: 28, filter: "blur(12px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export default function VillaListPage() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("Semua Lokasi");
  const [category, setCategory] = useState("Semua Tipe");
  const [sort, setSort] = useState("recommended");
  const [guestCount, setGuestCount] = useState(2);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [travelDates, setTravelDates] = useState<{ checkIn: string; checkOut: string } | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("villaku-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme = savedTheme === "dark" || (!savedTheme && prefersDark) ? "dark" : "light";

    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const locationParam = params.get("location");
    const guestsParam = Number(params.get("guests"));
    const checkInParam = params.get("checkIn");
    const checkOutParam = params.get("checkOut");

    if (locationParam && locations.includes(locationParam)) {
      setLocation(locationParam);
    }

    if (Number.isFinite(guestsParam) && guestsParam >= 2 && guestsParam <= 12) {
      setGuestCount(guestsParam);
    }

    if (params.get("available") === "true") {
      setShowAvailableOnly(true);
    }

    if (checkInParam && checkOutParam) {
      setTravelDates({ checkIn: checkInParam, checkOut: checkOutParam });
    }
  }, []);

  const filteredVillas = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return villas
      .filter((villa) => {
        const matchesQuery =
          !normalizedQuery ||
          villa.name.toLowerCase().includes(normalizedQuery) ||
          villa.location.toLowerCase().includes(normalizedQuery) ||
          villa.badges.join(" ").toLowerCase().includes(normalizedQuery);
        const matchesLocation = location === "Semua Lokasi" || villa.location === location;
        const matchesCategory = category === "Semua Tipe" || villa.category === category;
        const matchesGuests = villa.guests >= guestCount;
        const matchesAvailability = !showAvailableOnly || villa.available;

        return (
          matchesQuery &&
          matchesLocation &&
          matchesCategory &&
          matchesGuests &&
          matchesAvailability
        );
      })
      .sort((a, b) => {
        if (sort === "price-low") return a.price - b.price;
        if (sort === "price-high") return b.price - a.price;
        if (sort === "rating") return b.rating - a.rating;
        return b.rating * 100 + b.reviews - (a.rating * 100 + a.reviews);
      });
  }, [category, guestCount, location, query, showAvailableOnly, sort]);

  const pageCount = Math.max(1, Math.ceil(filteredVillas.length / PAGE_SIZE));
  const visibleVillas = filteredVillas.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [category, guestCount, location, query, showAvailableOnly, sort]);

  useEffect(() => {
    if (currentPage > pageCount) setCurrentPage(pageCount);
  }, [currentPage, pageCount]);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      window.localStorage.setItem("villaku-theme", next);
      return next;
    });
  };

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <section className="relative overflow-hidden px-4 pb-10 pt-5 sm:px-6 lg:px-8">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(247,217,140,0.34),transparent_26rem),radial-gradient(circle_at_86%_12%,rgba(4,120,87,0.16),transparent_30rem)]"
        />
        <div className="container relative z-10 mx-auto max-w-7xl">
          <header className="flex items-center justify-between rounded-full border border-emerald-900/10 bg-white/62 px-4 py-3 shadow-[0_18px_70px_rgba(4,34,28,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/6">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-emerald-700 text-sm font-bold text-white shadow-lg">
                V
              </span>
              <span>
                <span className="block font-serif text-xl font-semibold text-emerald-950 dark:text-white">
                  Villaku
                </span>
                <span className="block text-[0.62rem] uppercase tracking-[0.24em] text-emerald-950/48 dark:text-white/45">
                  Villa catalog
                </span>
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link href="/">
                  <Home />
                  Landing
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                aria-label="Toggle dark and light mode"
              >
                {theme === "dark" ? <Sun /> : <Moon />}
              </Button>
            </div>
          </header>

          <div className="grid gap-10 pb-10 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <motion.div
              initial={shouldReduceMotion ? false : "hidden"}
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.11 } },
              }}
            >
              <motion.div
                variants={fadeUp}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-white/62 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-950/60 backdrop-blur-xl dark:border-white/10 dark:bg-white/8 dark:text-white/62"
              >
                <Sparkles className="size-4 text-amber-500" />
                Pencarian & Penjelajahan Villa
              </motion.div>
              <motion.h1
                variants={fadeUp}
                className="mt-6 max-w-4xl font-serif text-5xl font-semibold leading-[0.96] tracking-[-0.055em] text-emerald-950 dark:text-white sm:text-6xl lg:text-7xl"
              >
                Pilih villa premium dengan filter yang jelas dan cepat.
              </motion.h1>
              <motion.p
                variants={fadeUp}
                className="mt-6 max-w-2xl text-base leading-8 text-emerald-950/64 dark:text-white/62 sm:text-lg"
              >
                Halaman katalog ini memakai data tiruan untuk memvalidasi layout, kartu villa,
                filter, sorting, status ketersediaan, dan pola pagination sebelum backend aktif.
              </motion.p>
            </motion.div>

            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.22, duration: 0.7, ease: "easeOut" }}
              className="rounded-[2rem] border border-emerald-900/10 bg-emerald-950 p-5 text-white shadow-[0_28px_90px_rgba(4,34,28,0.18)] dark:border-white/10"
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <Metric label="Villa tersedia" value={`${villas.filter((villa) => villa.available).length}`} />
                <Metric label="Lokasi" value="5" />
                <Metric label="Rating avg" value="4.93" />
              </div>
              <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-white/8 p-4 text-sm leading-7 text-white/68">
                Mock data siap diganti API katalog: lokasi, kategori, kapasitas, harga,
                fasilitas, dan availability.
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="container mx-auto grid max-w-7xl gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-6 rounded-[2rem] border border-emerald-900/10 bg-white/72 p-5 shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
              <FilterPanel
                category={category}
                guestCount={guestCount}
                location={location}
                query={query}
                setCategory={setCategory}
                setGuestCount={setGuestCount}
                setLocation={setLocation}
                setQuery={setQuery}
                setShowAvailableOnly={setShowAvailableOnly}
                showAvailableOnly={showAvailableOnly}
              />
            </div>
          </aside>

          <div>
            <div className="mb-5 flex flex-col gap-3 rounded-[1.6rem] border border-emerald-900/10 bg-white/72 p-3 shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                className="justify-center lg:hidden"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <SlidersHorizontal />
                Filter villa
              </Button>

              <div className="px-2 text-sm text-emerald-950/60 dark:text-white/58">
                <p>
                  Menampilkan{" "}
                  <strong className="text-emerald-950 dark:text-white">{visibleVillas.length}</strong>{" "}
                  dari {filteredVillas.length} hasil cocok
                </p>
                {travelDates ? (
                  <p className="mt-1 text-xs text-emerald-950/46 dark:text-white/42">
                    Quick search: {formatDate(travelDates.checkIn)} — {formatDate(travelDates.checkOut)}
                  </p>
                ) : null}
              </div>

              <label className="flex items-center gap-3 rounded-full border border-emerald-900/10 bg-white/70 px-4 py-2 text-sm text-emerald-950/60 dark:border-white/10 dark:bg-white/5 dark:text-white/58">
                Urutkan
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  className="bg-transparent font-semibold text-emerald-950 outline-none dark:text-white"
                  aria-label="Urutkan daftar villa"
                >
                  <option value="recommended">Rekomendasi</option>
                  <option value="rating">Rating tertinggi</option>
                  <option value="price-low">Harga terendah</option>
                  <option value="price-high">Harga tertinggi</option>
                </select>
              </label>
            </div>

            <AnimatePresence mode="popLayout">
              {filteredVillas.length > 0 ? (
                <motion.div
                  key={`villa-grid-${currentPage}-${sort}-${location}-${category}-${guestCount}-${showAvailableOnly}-${query}`}
                  className="grid gap-5 xl:grid-cols-2"
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0 }}
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.08 } },
                  }}
                >
                  {visibleVillas.map((villa) => (
                    <VillaCatalogCard key={villa.id} villa={villa} />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="rounded-[2rem] border border-emerald-900/10 bg-white/72 p-10 text-center shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-white/5"
                >
                  <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-900/5 text-emerald-700 dark:bg-white/10 dark:text-amber-200">
                    <Search className="size-7" />
                  </div>
                  <h2 className="mt-5 font-serif text-3xl font-semibold text-emerald-950 dark:text-white">
                    Belum ada villa yang cocok
                  </h2>
                  <p className="mx-auto mt-3 max-w-md leading-7 text-emerald-950/60 dark:text-white/58">
                    Coba ubah lokasi, tipe villa, kapasitas tamu, atau matikan filter
                    availability.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <Pagination
              currentPage={currentPage}
              pageCount={pageCount}
              totalItems={filteredVillas.length}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </section>

      <MobileFilterDrawer
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        category={category}
        guestCount={guestCount}
        location={location}
        query={query}
        setCategory={setCategory}
        setGuestCount={setGuestCount}
        setLocation={setLocation}
        setQuery={setQuery}
        setShowAvailableOnly={setShowAvailableOnly}
        showAvailableOnly={showAvailableOnly}
      />
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-white/8 p-4">
      <p className="font-serif text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-[0.65rem] uppercase tracking-[0.22em] text-white/50">{label}</p>
    </div>
  );
}

function FilterPanel({
  category,
  guestCount,
  location,
  query,
  setCategory,
  setGuestCount,
  setLocation,
  setQuery,
  setShowAvailableOnly,
  showAvailableOnly,
}: {
  category: string;
  guestCount: number;
  location: string;
  query: string;
  setCategory: (value: string) => void;
  setGuestCount: (value: number) => void;
  setLocation: (value: string) => void;
  setQuery: (value: string) => void;
  setShowAvailableOnly: (value: boolean) => void;
  showAvailableOnly: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-950/48 dark:text-white/42">
            Refine search
          </p>
          <h2 className="mt-1 font-serif text-3xl font-semibold text-emerald-950 dark:text-white">
            Filter Villa
          </h2>
        </div>
        <div className="grid size-11 place-items-center rounded-full bg-emerald-700 text-white">
          <Filter className="size-5" />
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <label className="catalog-field">
          <span>Kata kunci</span>
          <div className="flex items-center gap-2">
            <Search className="size-4 text-emerald-950/42 dark:text-white/42" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nama villa, lokasi, fasilitas"
              aria-label="Cari villa"
            />
          </div>
        </label>

        <label className="catalog-field">
          <span>Lokasi</span>
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-emerald-950/42 dark:text-white/42" />
            <select value={location} onChange={(event) => setLocation(event.target.value)}>
              {locations.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none size-4 text-emerald-950/42 dark:text-white/42" />
          </div>
        </label>

        <label className="catalog-field">
          <span>Tipe villa</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="catalog-field">
          <span>Jumlah tamu minimum</span>
          <div className="flex items-center gap-3">
            <Users className="size-4 text-emerald-950/42 dark:text-white/42" />
            <input
              type="range"
              min={2}
              max={12}
              step={1}
              value={guestCount}
              onChange={(event) => setGuestCount(Number(event.target.value))}
              aria-label="Jumlah tamu minimum"
            />
            <strong className="min-w-10 text-right text-emerald-950 dark:text-white">
              {guestCount}
            </strong>
          </div>
        </label>

        <label className="flex cursor-pointer items-center justify-between rounded-[1.25rem] border border-emerald-900/10 bg-emerald-900/5 p-4 text-sm font-semibold text-emerald-950 dark:border-white/10 dark:bg-white/6 dark:text-white">
          Hanya yang tersedia
          <input
            type="checkbox"
            checked={showAvailableOnly}
            onChange={(event) => setShowAvailableOnly(event.target.checked)}
            className="size-5 accent-emerald-700"
          />
        </label>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            setQuery("");
            setLocation("Semua Lokasi");
            setCategory("Semua Tipe");
            setGuestCount(2);
            setShowAvailableOnly(false);
          }}
        >
          Reset filter
        </Button>
      </div>
    </div>
  );
}

function VillaCatalogCard({ villa }: { villa: Villa }) {
  return (
    <motion.article
      layout
      variants={fadeUp}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="card-lift grid overflow-hidden rounded-[2rem] border border-emerald-900/10 bg-white/78 shadow-[0_24px_70px_rgba(4,34,28,0.1)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 md:grid-cols-[0.9fr_1.1fr]"
    >
      <div className="image-hover relative min-h-[260px] overflow-hidden bg-emerald-950 md:min-h-full">
        <img src={villa.image} alt={villa.name} className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/62 via-transparent to-transparent" />
        <span
          className={cn(
            "absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] backdrop-blur-xl",
            villa.available
              ? "bg-emerald-500/90 text-white"
              : "bg-amber-200/90 text-emerald-950",
          )}
        >
          {villa.available ? "Available" : "Booked"}
        </span>
        <button
          type="button"
          aria-label={`Simpan ${villa.name} ke wishlist`}
          className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-white/82 text-emerald-950 shadow-lg backdrop-blur-xl transition-transform hover:scale-110"
        >
          <Heart className="size-5" />
        </button>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-sm text-emerald-950/56 dark:text-white/54">
              <MapPin className="size-4" />
              {villa.location}, Bali
            </p>
            <h3 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.03em] text-emerald-950 dark:text-white">
              {villa.name}
            </h3>
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-amber-200/70 px-3 py-2 text-sm font-bold text-emerald-950">
            <Star className="size-4 fill-current" />
            {villa.rating}
          </div>
        </div>

        <p className="mt-3 leading-7 text-emerald-950/62 dark:text-white/58">{villa.highlight}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {villa.badges.map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-emerald-900/10 bg-emerald-900/5 px-3 py-1 text-xs font-medium text-emerald-950/62 dark:border-white/10 dark:bg-white/8 dark:text-white/62"
            >
              {badge}
            </span>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-emerald-950/58 dark:text-white/58 sm:grid-cols-4">
          <Spec icon={Users} label={`${villa.guests} tamu`} />
          <Spec icon={BedDouble} label={`${villa.bedrooms} kamar`} />
          <Spec icon={Bath} label={`${villa.bathrooms} bath`} />
          <Spec icon={Waves} label={villa.size} />
        </div>

        <div className="mt-5 flex flex-wrap gap-2 text-xs text-emerald-950/52 dark:text-white/50">
          {villa.amenities.includes("WiFi") ? <Amenity icon={Wifi} label="WiFi" /> : null}
          {villa.amenities.includes("Pool") ? <Amenity icon={Waves} label="Pool" /> : null}
          <Amenity icon={CalendarDays} label={`${villa.reviews} reviews`} />
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-emerald-900/10 pt-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-950/42 dark:text-white/38">
              mulai dari
            </p>
            <p className="font-serif text-3xl font-semibold text-emerald-950 dark:text-white">
              {formatRupiah(villa.price)}
            </p>
            <p className="text-sm text-emerald-950/48 dark:text-white/42">per malam</p>
          </div>
          {villa.available ? (
            <Button asChild variant="default">
              <Link href={`/villas/${villa.id}`}>
                Lihat detail
                <ArrowRight />
              </Link>
            </Button>
          ) : (
            <Button type="button" variant="outline" disabled>
              Tidak tersedia
            </Button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function Spec({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <Icon className="size-4 text-amber-600 dark:text-amber-300" />
      {label}
    </span>
  );
}

function Amenity({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/64 px-3 py-1.5 dark:bg-white/8">
      <Icon className="size-3.5" />
      {label}
    </span>
  );
}

function Pagination({
  currentPage,
  pageCount,
  totalItems,
  onPageChange,
}: {
  currentPage: number;
  pageCount: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);
  const goToPage = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), pageCount);
    onPageChange(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <nav
      className="mt-8 flex items-center justify-between rounded-[1.5rem] border border-emerald-900/10 bg-white/72 p-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5"
      aria-label="Pagination daftar villa"
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={currentPage === 1 || totalItems === 0}
        onClick={() => goToPage(currentPage - 1)}
      >
        <ArrowLeft />
        Prev
      </Button>
      <div className="flex items-center gap-2">
        {pages.map((page) => (
          <button
            type="button"
            key={page}
            onClick={() => goToPage(page)}
            className={cn(
              "grid size-10 place-items-center rounded-full text-sm font-semibold transition-all",
              page === currentPage
                ? "bg-emerald-700 text-white shadow-lg"
                : "text-emerald-950/58 hover:bg-emerald-900/5 dark:text-white/58 dark:hover:bg-white/10",
            )}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </button>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={currentPage === pageCount || totalItems === 0}
        onClick={() => goToPage(currentPage + 1)}
      >
        Next
        <ArrowRight />
      </Button>
    </nav>
  );
}

function MobileFilterDrawer({
  open,
  onClose,
  ...props
}: {
  open: boolean;
  onClose: () => void;
} & Parameters<typeof FilterPanel>[0]) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button
            type="button"
            aria-label="Tutup filter"
            className="absolute inset-0 bg-emerald-950/55 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            className="absolute bottom-0 left-0 right-0 max-h-[88vh] overflow-auto rounded-t-[2rem] border border-emerald-900/10 bg-[#fbf7ef] p-5 shadow-2xl dark:border-white/10 dark:bg-[#071211]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 260 }}
          >
            <div className="mb-4 flex justify-end">
              <Button type="button" size="icon" variant="outline" onClick={onClose} aria-label="Tutup filter">
                <X />
              </Button>
            </div>
            <FilterPanel {...props} />
            <Button type="button" className="mt-5 w-full" variant="gold" onClick={onClose}>
              Terapkan filter
            </Button>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
