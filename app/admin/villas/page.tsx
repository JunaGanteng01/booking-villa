"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  BedDouble,
  Bell,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Eye,
  Grid2X2,
  LayoutDashboard,
  List,
  MapPin,
  Menu,
  MessageSquareText,
  Moon,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Star,
  Sun,
  Users,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { NotificationBell } from "@/components/notification-bell";
import { useAppNotifications } from "@/components/notification-root";
import { listAdminVillas, updateAdminVilla, type AdminVillaDto } from "@/lib/admin-api-client";
import { cn } from "@/lib/utils";

type VillaStatus = "PUBLISHED" | "DRAFT" | "MAINTENANCE" | "ARCHIVED";
type VillaView = "table" | "grid";

type AdminVilla = {
  id: string;
  name: string;
  location: string;
  category: string;
  image: string;
  price: number;
  capacity: number;
  bedrooms: number;
  rating: number;
  reviews: number;
  status: VillaStatus;
  occupancy: number;
  bookings: number;
  nextAvailable: string;
  featured: boolean;
};

const initialVillas: AdminVilla[] = [
  {
    id: "aruna-cliffside",
    name: "Villa Aruna Cliffside",
    location: "Uluwatu",
    category: "Cliffside",
    image:
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=900&q=82",
    price: 4800000,
    capacity: 8,
    bedrooms: 4,
    rating: 4.96,
    reviews: 128,
    status: "PUBLISHED",
    occupancy: 88,
    bookings: 21,
    nextAvailable: "29 Agu 2026",
    featured: true,
  },
  {
    id: "nara-jungle",
    name: "Nara Jungle Residence",
    location: "Ubud",
    category: "Jungle",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=82",
    price: 3650000,
    capacity: 6,
    bedrooms: 3,
    rating: 4.92,
    reviews: 96,
    status: "PUBLISHED",
    occupancy: 76,
    bookings: 17,
    nextAvailable: "18 Agu 2026",
    featured: true,
  },
  {
    id: "sagara-beach",
    name: "Sagara Beach House",
    location: "Canggu",
    category: "Beachfront",
    image:
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=82",
    price: 5250000,
    capacity: 10,
    bedrooms: 5,
    rating: 4.98,
    reviews: 152,
    status: "PUBLISHED",
    occupancy: 94,
    bookings: 24,
    nextAvailable: "5 Sep 2026",
    featured: true,
  },
  {
    id: "maira-family-estate",
    name: "Maira Family Estate",
    location: "Nusa Dua",
    category: "Family",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=82",
    price: 6100000,
    capacity: 12,
    bedrooms: 6,
    rating: 4.94,
    reviews: 88,
    status: "MAINTENANCE",
    occupancy: 62,
    bookings: 12,
    nextAvailable: "12 Sep 2026",
    featured: false,
  },
  {
    id: "luna-honeymoon",
    name: "Luna Honeymoon Villa",
    location: "Seminyak",
    category: "Honeymoon",
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=82",
    price: 2950000,
    capacity: 2,
    bedrooms: 1,
    rating: 4.9,
    reviews: 74,
    status: "PUBLISHED",
    occupancy: 81,
    bookings: 19,
    nextAvailable: "21 Agu 2026",
    featured: false,
  },
  {
    id: "tirta-palm",
    name: "Tirta Palm Villa",
    location: "Ubud",
    category: "Family",
    image:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=900&q=82",
    price: 4200000,
    capacity: 8,
    bedrooms: 4,
    rating: 4.88,
    reviews: 61,
    status: "DRAFT",
    occupancy: 0,
    bookings: 0,
    nextAvailable: "Belum dipublikasi",
    featured: false,
  },
  {
    id: "samaya-ocean",
    name: "Samaya Ocean Pavilion",
    location: "Nusa Dua",
    category: "Beachfront",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=82",
    price: 5750000,
    capacity: 8,
    bedrooms: 4,
    rating: 4.91,
    reviews: 103,
    status: "PUBLISHED",
    occupancy: 72,
    bookings: 15,
    nextAvailable: "25 Agu 2026",
    featured: false,
  },
  {
    id: "kayumanis-garden",
    name: "Kayumanis Garden Villa",
    location: "Seminyak",
    category: "Family",
    image:
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=900&q=82",
    price: 3900000,
    capacity: 7,
    bedrooms: 3,
    rating: 4.86,
    reviews: 57,
    status: "ARCHIVED",
    occupancy: 0,
    bookings: 0,
    nextAvailable: "Diarsipkan",
    featured: false,
  },
];

const statusMeta: Record<VillaStatus, { label: string; className: string }> = {
  PUBLISHED: {
    label: "Published",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-300/12 dark:text-emerald-200",
  },
  DRAFT: {
    label: "Draft",
    className:
      "bg-slate-200/70 text-slate-600 dark:bg-white/8 dark:text-white/52",
  },
  MAINTENANCE: {
    label: "Maintenance",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-300/12 dark:text-amber-200",
  },
  ARCHIVED: {
    label: "Archived",
    className:
      "bg-rose-100 text-rose-700 dark:bg-rose-300/12 dark:text-rose-200",
  },
};

const navItems = [
  { label: "Overview", icon: LayoutDashboard, href: "/admin" },
  { label: "Booking", icon: CalendarDays, href: "/admin/bookings" },
  { label: "Villa", icon: Building2, href: "/admin/villas", active: true },
  { label: "Pembayaran", icon: CircleDollarSign, href: "/admin/payments" },
  { label: "Customer", icon: Users, href: "/admin/customers" },
  { label: "Ulasan", icon: MessageSquareText, href: "/admin/reviews" },
  { label: "Notifikasi", icon: Bell, href: "/admin/notifications" },
  { label: "Laporan", icon: BarChart3, href: "/admin/reports" },
  { label: "Pengaturan", icon: Settings, href: "/admin/settings" },
];

const money = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function toAdminVilla(villa: AdminVillaDto): AdminVilla {
  const cover = villa.images.find((image) => image.isCover) ?? villa.images[0];
  return {
    id: villa.id,
    name: villa.name,
    location: villa.location,
    category: villa.category,
    image: cover?.url ?? "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=82",
    price: villa.pricePerNight,
    capacity: villa.capacity,
    bedrooms: villa.bedrooms,
    rating: 0,
    reviews: 0,
    status: villa.status,
    occupancy: 0,
    bookings: 0,
    nextAvailable: villa.status === "PUBLISHED" ? "Tersedia" : statusMeta[villa.status].label,
    featured: villa.isFeatured,
  };
}

export default function AdminVillaListPage() {
  const shouldReduceMotion = useReducedMotion();
  const { notify } = useAppNotifications();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [villas, setVillas] = useState<AdminVilla[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | VillaStatus>("ALL");
  const [location, setLocation] = useState("ALL");
  const [sort, setSort] = useState("updated");
  const [view, setView] = useState<VillaView>("table");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("villaku-theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const nextTheme =
      savedTheme === "dark" || (!savedTheme && prefersDark) ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }, []);

  useEffect(() => {
    let active = true;
    listAdminVillas({ limit: 100 })
      .then(({ villas: items }) => {
        if (active) setVillas(items.map(toAdminVilla));
      })
      .catch((error: unknown) => {
        if (!active) return;
        notify({
          title: "Daftar villa gagal dimuat",
          description: error instanceof Error ? error.message : "Coba muat ulang halaman.",
          variant: "error",
        });
      })
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  // `notify` is provided by the notification context and is intentionally omitted
  // so this data request runs once per page mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const locations = useMemo(
    () => Array.from(new Set(villas.map((villa) => villa.location))).sort(),
    [villas],
  );
  const visibleVillas = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("id-ID");
    const filtered = villas.filter((villa) => {
      const matchesQuery =
        !normalized ||
        `${villa.name} ${villa.location} ${villa.category}`
          .toLocaleLowerCase("id-ID")
          .includes(normalized);
      return (
        matchesQuery &&
        (status === "ALL" || villa.status === status) &&
        (location === "ALL" || villa.location === location)
      );
    });
    return [...filtered].sort((a, b) => {
      if (sort === "price-high") return b.price - a.price;
      if (sort === "price-low") return a.price - b.price;
      if (sort === "occupancy") return b.occupancy - a.occupancy;
      return Number(b.featured) - Number(a.featured);
    });
  }, [location, query, sort, status, villas]);

  const published = villas.filter(
    (villa) => villa.status === "PUBLISHED",
  ).length;
  const maintenance = villas.filter(
    (villa) => villa.status === "MAINTENANCE",
  ).length;
  const averageOccupancy = Math.round(
    villas
      .filter((villa) => villa.status === "PUBLISHED")
      .reduce((sum, villa) => sum + villa.occupancy, 0) /
      Math.max(published, 1),
  );

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      window.localStorage.setItem("villaku-theme", next);
      return next;
    });
  };

  const updateStatus = async (villa: AdminVilla, nextStatus: VillaStatus) => {
    const previousStatus = villa.status;
    setVillas((items) =>
      items.map((item) =>
        item.id === villa.id ? { ...item, status: nextStatus } : item,
      ),
    );
    setOpenMenu(null);
    try {
      await updateAdminVilla(villa.id, { status: nextStatus });
      notify({
        title: `${villa.name} diperbarui`,
        description: `Status diubah menjadi ${statusMeta[nextStatus].label}.`,
        variant: "success",
      });
    } catch (error) {
      setVillas((items) => items.map((item) => item.id === villa.id ? { ...item, status: previousStatus } : item));
      notify({
        title: "Status gagal diperbarui",
        description: error instanceof Error ? error.message : "Silakan coba lagi.",
        variant: "error",
      });
    }
  };

  const resetFilters = () => {
    setQuery("");
    setStatus("ALL");
    setLocation("ALL");
    setSort("updated");
  };

  return (
    <main className="min-h-screen bg-[#f2f4f0] text-foreground dark:bg-[#06100e]">
      <AdminSidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-emerald-950/8 bg-[#f2f4f0]/84 px-4 py-3 backdrop-blur-2xl dark:border-white/8 dark:bg-[#06100e]/86 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="grid size-10 place-items-center rounded-xl border border-emerald-950/10 bg-white/70 lg:hidden dark:border-white/10 dark:bg-white/6"
                aria-label="Buka navigasi admin"
              >
                <Menu className="size-4" />
              </button>
              <div>
                <p className="font-serif text-lg font-semibold leading-none sm:text-xl">
                  Manajemen villa
                </p>
                <p className="mt-1 hidden text-xs text-emerald-950/42 dark:text-white/40 sm:block">
                  Kelola listing dan ketersediaan properti
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="grid size-10 place-items-center rounded-full border border-emerald-950/10 bg-white/70 transition-all hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/6"
                aria-label="Ubah tema gelap atau terang"
              >
                {theme === "dark" ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
              </button>
              <NotificationBell
                unreadCount={5}
                label="Buka notifikasi admin"
                className="bg-white/70 dark:bg-white/6"
              />
              <span className="ml-1 grid size-10 place-items-center rounded-full bg-emerald-950 text-xs font-bold text-white ring-2 ring-amber-300/50 dark:bg-emerald-700">
                AP
              </span>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] px-4 pb-14 pt-7 sm:px-6 lg:px-8 lg:pt-10">
          <motion.div
            initial={
              shouldReduceMotion
                ? false
                : { opacity: 0, y: 18, filter: "blur(8px)" }
            }
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between"
          >
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
                <Sparkles className="size-3.5" /> Property portfolio
              </span>
              <h1 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
                Daftar villa
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-950/48 dark:text-white/46">
                Pantau performa, status publikasi, dan kesiapan operasional
                semua properti Villaku.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 self-start xl:self-auto">
              <Link
                href="/admin/villas/catalog"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-emerald-950/10 bg-white/70 px-5 text-sm font-bold text-emerald-900 transition-all hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/6 dark:text-white"
              >
                <Settings className="size-4" /> Master data
              </Link>
              <Link
                href="/admin/villas/new"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-emerald-700 px-5 text-sm font-bold text-white shadow-[0_14px_32px_rgba(4,120,87,0.22)] transition-all hover:-translate-y-0.5 hover:bg-emerald-600"
              >
                <Plus className="size-4" /> Tambah villa
              </Link>
            </div>
          </motion.div>

          <div className="mt-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <MetricCard
              label="Total villa"
              value={String(villas.length)}
              helper="Semua properti"
              icon={Building2}
              tone="emerald"
            />
            <MetricCard
              label="Dipublikasi"
              value={String(published)}
              helper="Siap dipesan"
              icon={Eye}
              tone="sky"
            />
            <MetricCard
              label="Okupansi rata-rata"
              value={`${averageOccupancy}%`}
              helper="Villa aktif"
              icon={BarChart3}
              tone="amber"
            />
            <MetricCard
              label="Maintenance"
              value={String(maintenance)}
              helper="Perlu perhatian"
              icon={Wrench}
              tone="rose"
            />
          </div>

          <section
            className="mt-6 overflow-visible rounded-[1.7rem] border border-emerald-950/8 bg-white/68 shadow-[0_20px_70px_rgba(4,34,28,0.055)] backdrop-blur-xl dark:border-white/8 dark:bg-white/[0.045]"
            aria-labelledby="villa-list-title"
          >
            <div className="p-4 sm:p-5">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="relative w-full xl:max-w-sm">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-emerald-950/35 dark:text-white/35" />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Cari nama, lokasi, kategori..."
                    className="h-11 w-full rounded-xl border border-emerald-950/10 bg-white/72 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-600/35 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/6"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <FilterSelect
                    label="Status"
                    value={status}
                    onChange={(value) =>
                      setStatus(value as "ALL" | VillaStatus)
                    }
                    options={[
                      { value: "ALL", label: "Semua status" },
                      ...Object.entries(statusMeta).map(([value, meta]) => ({
                        value,
                        label: meta.label,
                      })),
                    ]}
                  />
                  <FilterSelect
                    label="Lokasi"
                    value={location}
                    onChange={setLocation}
                    options={[
                      { value: "ALL", label: "Semua lokasi" },
                      ...locations.map((item) => ({
                        value: item,
                        label: item,
                      })),
                    ]}
                  />
                  <FilterSelect
                    label="Urutkan"
                    value={sort}
                    onChange={setSort}
                    options={[
                      { value: "updated", label: "Terbaru" },
                      { value: "occupancy", label: "Okupansi" },
                      { value: "price-high", label: "Harga tertinggi" },
                      { value: "price-low", label: "Harga terendah" },
                    ]}
                  />
                  <div className="flex rounded-xl border border-emerald-950/10 bg-white/70 p-1 dark:border-white/10 dark:bg-white/6">
                    <ViewButton
                      active={view === "table"}
                      onClick={() => setView("table")}
                      label="Tampilan tabel"
                    >
                      <List className="size-4" />
                    </ViewButton>
                    <ViewButton
                      active={view === "grid"}
                      onClick={() => setView("grid")}
                      label="Tampilan kartu"
                    >
                      <Grid2X2 className="size-4" />
                    </ViewButton>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-emerald-950/7 pt-4 text-xs text-emerald-950/40 dark:border-white/7 dark:text-white/38">
                <p>
                  <span className="font-bold text-emerald-800 dark:text-emerald-200">
                    {visibleVillas.length}
                  </span>{" "}
                  villa ditemukan
                </p>
                {query || status !== "ALL" || location !== "ALL" ? (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300"
                  >
                    <X className="size-3.5" /> Reset filter
                  </button>
                ) : null}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid min-h-80 place-items-center border-t border-emerald-950/8 dark:border-white/8">
                  <div className="text-center"><span className="mx-auto block size-9 animate-spin rounded-full border-2 border-emerald-700/20 border-t-emerald-700" /><p className="mt-3 text-sm text-emerald-950/46 dark:text-white/44">Memuat portofolio villa...</p></div>
                </motion.div>
              ) : visibleVillas.length ? (
                view === "table" ? (
                  <motion.div
                    key="table"
                    initial={shouldReduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="overflow-x-auto border-t border-emerald-950/8 dark:border-white/8"
                  >
                    <table className="w-full min-w-[980px] border-collapse">
                      <thead>
                        <tr className="bg-emerald-950/[0.025] text-left text-[0.62rem] font-bold uppercase tracking-[0.14em] text-emerald-950/38 dark:bg-white/[0.025] dark:text-white/36">
                          <th className="px-5 py-3.5">Villa</th>
                          <th className="px-4 py-3.5">Status</th>
                          <th className="px-4 py-3.5">Harga / malam</th>
                          <th className="px-4 py-3.5">Okupansi</th>
                          <th className="px-4 py-3.5">Tersedia lagi</th>
                          <th className="px-5 py-3.5 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleVillas.map((villa, index) => (
                          <VillaTableRow
                            key={villa.id}
                            villa={villa}
                            open={openMenu === villa.id}
                            onMenu={() =>
                              setOpenMenu((current) =>
                                current === villa.id ? null : villa.id,
                              )
                            }
                            onStatus={(next) => void updateStatus(villa, next)}
                            delay={shouldReduceMotion ? 0 : index * 0.035}
                          />
                        ))}
                      </tbody>
                    </table>
                  </motion.div>
                ) : (
                  <motion.div
                    key="grid"
                    initial={shouldReduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid gap-4 border-t border-emerald-950/8 p-4 dark:border-white/8 sm:grid-cols-2 sm:p-5 xl:grid-cols-3"
                  >
                    {visibleVillas.map((villa, index) => (
                      <VillaAdminCard
                        key={villa.id}
                        villa={villa}
                        onStatus={(next) => void updateStatus(villa, next)}
                        delay={shouldReduceMotion ? 0 : index * 0.05}
                      />
                    ))}
                  </motion.div>
                )
              ) : (
                <motion.div
                  key="empty"
                  initial={
                    shouldReduceMotion ? false : { opacity: 0, scale: 0.98 }
                  }
                  animate={{ opacity: 1, scale: 1 }}
                  className="grid min-h-80 place-items-center border-t border-emerald-950/8 px-5 text-center dark:border-white/8"
                >
                  <div>
                    <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
                      <SlidersHorizontal className="size-6" />
                    </span>
                    <h2
                      id="villa-list-title"
                      className="mt-4 font-serif text-2xl font-semibold"
                    >
                      Villa tidak ditemukan
                    </h2>
                    <p className="mt-2 text-sm text-emerald-950/46 dark:text-white/44">
                      Coba ubah kata kunci atau filter yang digunakan.
                    </p>
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-5 rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white"
                    >
                      Reset filter
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {visibleVillas.length ? (
              <div className="flex items-center justify-between border-t border-emerald-950/8 px-4 py-4 text-xs text-emerald-950/40 dark:border-white/8 dark:text-white/38 sm:px-5">
                <p>
                  Menampilkan 1–{visibleVillas.length} dari{" "}
                  {visibleVillas.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled
                    className="grid size-9 place-items-center rounded-lg border border-emerald-950/8 disabled:opacity-35 dark:border-white/8"
                    aria-label="Halaman sebelumnya"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <span className="grid size-9 place-items-center rounded-lg bg-emerald-700 font-bold text-white">
                    1
                  </span>
                  <button
                    type="button"
                    disabled
                    className="grid size-9 place-items-center rounded-lg border border-emerald-950/8 disabled:opacity-35 dark:border-white/8"
                    aria-label="Halaman berikutnya"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}

function AdminSidebar({
  mobileOpen,
  onMobileClose,
}: {
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const content = (mobile = false) => (
    <>
      <Link href="/" className="flex items-center gap-3 px-2 py-2">
        <span className="grid size-10 place-items-center rounded-xl bg-emerald-700 text-sm font-bold text-white shadow-[0_10px_24px_rgba(4,120,87,0.25)]">
          V
        </span>
        <span>
          <span className="block font-serif text-xl font-semibold leading-none">
            Villaku
          </span>
          <span className="mt-1 block text-[0.58rem] font-bold uppercase tracking-[0.2em] text-emerald-950/38 dark:text-white/38">
            Admin operations
          </span>
        </span>
      </Link>
      <nav
        className="mt-7 space-y-1"
        aria-label={mobile ? "Navigasi admin mobile" : "Navigasi admin"}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={mobile ? onMobileClose : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-all",
                item.active
                  ? "bg-emerald-700 text-white shadow-[0_10px_24px_rgba(4,120,87,0.18)]"
                  : "text-emerald-950/52 hover:bg-emerald-950/5 hover:text-emerald-950 dark:text-white/48 dark:hover:bg-white/6 dark:hover:text-white",
              )}
              aria-current={item.active ? "page" : undefined}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-2xl bg-emerald-950 p-4 text-white">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-full bg-white/10 text-xs font-bold">
            AP
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">
              Ayu Prameswari
            </span>
            <span className="mt-0.5 block text-[0.65rem] text-white/45">
              Super Admin
            </span>
          </span>
          <ChevronDown className="size-4 text-white/38" />
        </div>
      </div>
    </>
  );
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-emerald-950/8 bg-[#fbfaf5] p-4 dark:border-white/8 dark:bg-[#081714] lg:flex">
        {content()}
      </aside>
      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            className="fixed inset-0 z-50 bg-emerald-950/48 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onMobileClose}
          >
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="flex h-full w-[min(19rem,86vw)] flex-col bg-[#fbfaf5] p-4 shadow-2xl dark:bg-[#081714]"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={onMobileClose}
                className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-emerald-950/5 dark:bg-white/7"
                aria-label="Tutup navigasi"
              >
                <X className="size-4" />
              </button>
              {content(true)}
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  icon: typeof Building2;
  tone: "emerald" | "sky" | "amber" | "rose";
}) {
  const tones = {
    emerald:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200",
    sky: "bg-sky-100 text-sky-700 dark:bg-sky-300/10 dark:text-sky-200",
    amber:
      "bg-amber-100 text-amber-700 dark:bg-amber-300/10 dark:text-amber-200",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-300/10 dark:text-rose-200",
  };
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-emerald-950/8 bg-white/66 p-4 shadow-[0_12px_40px_rgba(4,34,28,0.04)] dark:border-white/8 dark:bg-white/[0.045] sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-emerald-950/42 dark:text-white/40">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold sm:text-3xl">{value}</p>
          <p className="mt-1 text-[0.65rem] text-emerald-950/36 dark:text-white/34">
            {helper}
          </p>
        </div>
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl",
            tones[tone],
          )}
        >
          <Icon className="size-[1.05rem]" />
        </span>
      </div>
    </motion.div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 appearance-none rounded-xl border border-emerald-950/10 bg-white/70 pl-3 pr-9 text-xs font-semibold text-emerald-950/62 outline-none transition focus:border-emerald-600/35 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-[#12231f] dark:text-white/58"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-emerald-950/36 dark:text-white/36" />
    </label>
  );
}

function ViewButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "grid size-8 place-items-center rounded-lg transition-all",
        active
          ? "bg-emerald-700 text-white"
          : "text-emerald-950/38 hover:text-emerald-700 dark:text-white/36",
      )}
      aria-label={label}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

function VillaTableRow({
  villa,
  open,
  onMenu,
  onStatus,
  delay,
}: {
  villa: AdminVilla;
  open: boolean;
  onMenu: () => void;
  onStatus: (status: VillaStatus) => void;
  delay: number;
}) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 7 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="border-t border-emerald-950/7 transition-colors hover:bg-emerald-950/[0.022] dark:border-white/7 dark:hover:bg-white/[0.022]"
    >
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl">
            <img
              src={villa.image}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="font-serif text-base font-semibold">{villa.name}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-emerald-950/38 dark:text-white/36">
              <MapPin className="size-3" /> {villa.location} · {villa.category}
            </p>
            <div className="mt-1.5 flex items-center gap-3 text-[0.65rem] text-emerald-950/38 dark:text-white/36">
              <span className="flex items-center gap-1">
                <BedDouble className="size-3" /> {villa.bedrooms} BR
              </span>
              <span className="flex items-center gap-1">
                <Users className="size-3" /> {villa.capacity}
              </span>
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-300">
                <Star className="size-3 fill-current" /> {villa.rating}
              </span>
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <StatusBadge status={villa.status} />
      </td>
      <td className="px-4 py-4">
        <p className="text-sm font-semibold">{money.format(villa.price)}</p>
        <p className="mt-1 text-[0.65rem] text-emerald-950/34 dark:text-white/32">
          per malam
        </p>
      </td>
      <td className="px-4 py-4">
        <div className="w-24">
          <div className="flex justify-between text-xs">
            <span className="font-semibold">{villa.occupancy}%</span>
            <span className="text-emerald-950/34 dark:text-white/32">
              {villa.bookings} stay
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-emerald-950/7 dark:bg-white/7">
            <div
              className={cn(
                "h-full rounded-full",
                villa.occupancy >= 85 ? "bg-amber-400" : "bg-emerald-600",
              )}
              style={{ width: `${villa.occupancy}%` }}
            />
          </div>
        </div>
      </td>
      <td className="px-4 py-4 text-xs text-emerald-950/48 dark:text-white/44">
        {villa.nextAvailable}
      </td>
      <td className="relative px-5 py-4">
        <div className="flex justify-end gap-1">
          <Link
            href={`/villas/${villa.id}`}
            className="grid size-9 place-items-center rounded-lg text-emerald-950/38 transition hover:bg-emerald-950/5 hover:text-emerald-700 dark:text-white/36 dark:hover:bg-white/6"
            aria-label={`Lihat ${villa.name}`}
          >
            <Eye className="size-4" />
          </Link>
                <Link
                  href={`/admin/villas/${villa.id}/edit`}
                  className="grid size-9 place-items-center rounded-lg text-emerald-950/38 transition hover:bg-emerald-950/5 hover:text-emerald-700 dark:text-white/36 dark:hover:bg-white/6"
                  aria-label={`Edit ${villa.name}`}
                >
                  <Pencil className="size-4" />
                </Link>
                <Link
                  href={`/admin/villas/${villa.id}/edit#availability`}
                  className="grid size-9 place-items-center rounded-lg text-emerald-950/38 transition hover:bg-emerald-950/5 hover:text-emerald-700 dark:text-white/36 dark:hover:bg-white/6"
                  aria-label={`Kelola ketersediaan ${villa.name}`}
                >
                  <CalendarDays className="size-4" />
                </Link>
          <button
            type="button"
            onClick={onMenu}
            className="grid size-9 place-items-center rounded-lg text-emerald-950/38 transition hover:bg-emerald-950/5 hover:text-emerald-700 dark:text-white/36 dark:hover:bg-white/6"
            aria-label={`Aksi lain untuk ${villa.name}`}
            aria-expanded={open}
          >
            <MoreHorizontal className="size-4" />
          </button>
        </div>
        <AnimatePresence>
          {open ? (
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.97 }}
              className="absolute right-5 top-14 z-20 w-44 rounded-xl border border-emerald-950/10 bg-[#fffdf8] p-1.5 shadow-xl dark:border-white/10 dark:bg-[#10231e]"
            >
              <p className="px-2.5 py-1.5 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-emerald-950/32 dark:text-white/32">
                Ubah status
              </p>
              {(
                [
                  "PUBLISHED",
                  "DRAFT",
                  "MAINTENANCE",
                  "ARCHIVED",
                ] as VillaStatus[]
              ).map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => onStatus(item)}
                  className="flex min-h-9 w-full items-center justify-between rounded-lg px-2.5 text-left text-xs font-semibold hover:bg-emerald-950/5 dark:hover:bg-white/6"
                >
                  {statusMeta[item].label}
                  {villa.status === item ? (
                    <Check className="size-3.5 text-emerald-600" />
                  ) : null}
                </button>
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </td>
    </motion.tr>
  );
}

function VillaAdminCard({
  villa,
  onStatus,
  delay,
}: {
  villa: AdminVilla;
  onStatus: (status: VillaStatus) => void;
  delay: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, delay }}
      className="group overflow-hidden rounded-2xl border border-emerald-950/8 bg-white/72 dark:border-white/8 dark:bg-white/[0.04]"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={villa.image}
          alt={villa.name}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/45 via-transparent to-transparent" />
        <div className="absolute left-3 top-3">
          <StatusBadge status={villa.status} />
        </div>
        {villa.featured ? (
          <span className="absolute right-3 top-3 rounded-full bg-amber-300 px-2.5 py-1 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-emerald-950">
            Featured
          </span>
        ) : null}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-semibold">{villa.name}</h2>
            <p className="mt-1 flex items-center gap-1 text-xs text-emerald-950/40 dark:text-white/38">
              <MapPin className="size-3" /> {villa.location} · {villa.category}
            </p>
          </div>
          <span className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-300">
            <Star className="size-3.5 fill-current" /> {villa.rating}
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold">{money.format(villa.price)}</p>
            <p className="text-[0.62rem] text-emerald-950/34 dark:text-white/32">
              per malam
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold">{villa.occupancy}%</p>
            <p className="text-[0.62rem] text-emerald-950/34 dark:text-white/32">
              okupansi
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Link
            href={`/villas/${villa.id}`}
            className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-emerald-950/10 text-xs font-bold text-emerald-800 transition hover:bg-emerald-950/5 dark:border-white/10 dark:text-white dark:hover:bg-white/6"
          >
            <Eye className="size-3.5" /> Preview
          </Link>
          <button
            type="button"
            onClick={() =>
              onStatus(villa.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED")
            }
            className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-emerald-700 text-xs font-bold text-white transition hover:bg-emerald-600"
          >
            {villa.status === "PUBLISHED" ? "Jadikan draft" : "Publikasikan"}
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function StatusBadge({ status }: { status: VillaStatus }) {
  const meta = statusMeta[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.1em]",
        meta.className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-65" />
      {meta.label}
    </span>
  );
}
