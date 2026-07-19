"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Briefcase,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  CreditCard,
  Download,
  DoorOpen,
  Heart,
  Home,
  LogOut,
  LoaderCircle,
  MapPin,
  Moon,
  Pencil,
  Search,
  Settings,
  Sparkles,
  Star,
  Sun,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NotificationBell } from "@/components/notification-bell";
import { useAppNotifications } from "@/components/notification-root";
import { type AuthSessionProfile, useAuthSession } from "@/components/use-auth-session";

type DashboardSection = "overview" | "bookings" | "wishlist" | "profile";
type BookingStatus = "upcoming" | "active" | "checkout_requested" | "completed" | "cancelled";

type Booking = {
  id: string;
  code: string;
  villaId: string;
  villaName: string;
  location: string;
  image: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  total: number;
  status: BookingStatus;
  paymentLabel: string;
  checkout: {
    status: "ACTIVE" | "CHECKOUT_REQUESTED" | "CHECKED_OUT" | null;
    statusLabel: string;
    canRequest: boolean;
    requestedAt: string | null;
    checkedOutAt: string | null;
    processedBy: { name: string | null; email: string } | null;
    history: Array<{
      id: string;
      toStatus: "ACTIVE" | "CHECKOUT_REQUESTED" | "CHECKED_OUT";
      notes: string | null;
      actor: { name: string | null; email: string } | null;
      createdAt: string;
    }>;
  };
};

type BookingApiItem = {
  bookingId: string;
  bookingCode: string;
  bookingStatus: string;
  paymentStatus: string;
  villa: { id: string; name: string; location: string; image: string | null };
  stay: { checkIn: string; checkOut: string; nights: number; guests: number };
  totalAmount: number;
  checkout: Booking["checkout"];
};

type WishlistVilla = {
  id: string;
  name: string;
  location: string;
  image: string;
  price: number;
  rating: number;
  reviews: number;
  guests: number;
  availability: string;
};

const dashboardNav: Array<{
  id: DashboardSection;
  label: string;
  mobileLabel: string;
  icon: typeof Home;
}> = [
  { id: "overview", label: "Ringkasan", mobileLabel: "Beranda", icon: Home },
  { id: "bookings", label: "Riwayat booking", mobileLabel: "Booking", icon: Briefcase },
  { id: "wishlist", label: "Wishlist", mobileLabel: "Wishlist", icon: Heart },
  { id: "profile", label: "Profil saya", mobileLabel: "Profil", icon: UserRound },
];

const fallbackVillaImage =
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=85";

const initialWishlist: WishlistVilla[] = [
  {
    id: "samaya-ocean",
    name: "Samaya Ocean Pavilion",
    location: "Nusa Dua, Bali",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=85",
    price: 5750000,
    rating: 4.91,
    reviews: 103,
    guests: 8,
    availability: "Tersedia 26–30 Sep",
  },
  {
    id: "akasa-sky",
    name: "Akasa Sky Villa",
    location: "Uluwatu, Bali",
    image:
      "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1400&q=85",
    price: 3350000,
    rating: 4.89,
    reviews: 69,
    guests: 4,
    availability: "Tersedia akhir pekan ini",
  },
  {
    id: "tirta-palm",
    name: "Tirta Palm Villa",
    location: "Ubud, Bali",
    image:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1400&q=85",
    price: 4200000,
    rating: 4.88,
    reviews: 61,
    guests: 8,
    availability: "Tersedia 4–8 Okt",
  },
];

const bookingFilters: Array<{ id: "all" | BookingStatus; label: string }> = [
  { id: "all", label: "Semua" },
  { id: "upcoming", label: "Akan datang" },
  { id: "active", label: "Sedang menginap" },
  { id: "checkout_requested", label: "Checkout diminta" },
  { id: "completed", label: "Selesai" },
  { id: "cancelled", label: "Dibatalkan" },
];

const reveal = {
  hidden: { opacity: 0, y: 24, filter: "blur(10px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export default function CustomerDashboardPage() {
  const shouldReduceMotion = useReducedMotion();
  const { notify } = useAppNotifications();
  const { profile, initials, firstName, logout } = useAuthSession();
  const customerProfile: AuthSessionProfile = profile ?? {
    id: "loading",
    name: "Pengguna VillaKu",
    email: "",
    role: "CUSTOMER",
  };
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [activeSection, setActiveSection] = useState<DashboardSection>("overview");
  const [bookingFilter, setBookingFilter] = useState<"all" | BookingStatus>("all");
  const [wishlist, setWishlist] = useState(initialWishlist);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [bookingItems, setBookingItems] = useState<Booking[]>([]);
  const [bookingLoading, setBookingLoading] = useState(true);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("villaku-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme = savedTheme === "dark" || (!savedTheme && prefersDark) ? "dark" : "light";

    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }, []);

  const loadBookings = useCallback(async (quiet = false) => {
    if (!quiet) setBookingLoading(true);
    try {
      const response = await fetch("/api/bookings", {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const payload = (await response.json()) as { bookings?: BookingApiItem[]; message?: string };
      if (!response.ok) throw new Error(payload.message || "Riwayat booking gagal dimuat.");
      setBookingItems((payload.bookings ?? []).map(toDashboardBooking));
      setBookingError(null);
    } catch (loadError) {
      setBookingError(loadError instanceof Error ? loadError.message : "Riwayat booking gagal dimuat.");
    } finally {
      setBookingLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBookings();
    const interval = window.setInterval(() => void loadBookings(true), 10_000);
    const onFocus = () => void loadBookings(true);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadBookings]);

  const visibleBookings = useMemo(
    () => bookingItems.filter((booking) => bookingFilter === "all" || booking.status === bookingFilter),
    [bookingFilter, bookingItems],
  );

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      window.localStorage.setItem("villaku-theme", next);
      return next;
    });
  };

  const removeWishlist = (villa: WishlistVilla) => {
    setWishlist((items) => items.filter((item) => item.id !== villa.id));
    notify({
      title: "Dihapus dari wishlist",
      description: `${villa.name} tidak lagi ada di daftar favorit Anda.`,
      variant: "success",
    });
  };

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_16%_5%,rgba(247,217,140,0.28),transparent_26rem),radial-gradient(circle_at_88%_8%,rgba(4,120,87,0.16),transparent_30rem)]"
      />

      <header className="sticky top-0 z-40 border-b border-emerald-950/8 bg-[#f5f0e8]/78 px-4 py-3 backdrop-blur-2xl dark:border-white/8 dark:bg-[#071211]/78 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4">
          <Link href="/" className="group flex items-center gap-3" aria-label="Kembali ke beranda VillaKu">
            <span className="grid size-10 place-items-center rounded-full bg-emerald-700 text-sm font-bold text-white shadow-[0_10px_26px_rgba(4,120,87,0.25)] transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105">
              V
            </span>
            <span>
              <span className="block font-serif text-xl font-semibold leading-none text-emerald-950 dark:text-white">
                Villaku
              </span>
              <span className="mt-1 block text-[0.6rem] uppercase tracking-[0.24em] text-emerald-950/44 dark:text-white/42">
                Guest circle
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/villas"
              className="hidden min-h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-emerald-950/64 transition-colors hover:bg-emerald-950/5 hover:text-emerald-950 dark:text-white/60 dark:hover:bg-white/8 dark:hover:text-white sm:flex"
            >
              <Search className="size-4" />
              Cari villa
            </Link>
            <button
              type="button"
              className="grid size-10 place-items-center rounded-full border border-emerald-950/10 bg-white/62 transition-all hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/6 dark:hover:bg-white/10"
              onClick={toggleTheme}
              aria-label="Ubah tema gelap atau terang"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <div className="relative">
              <NotificationBell
                unreadCount={1}
                onClick={() => setNotificationOpen((open) => !open)}
                expanded={notificationOpen}
                controls="customer-notification-panel"
              />
              <AnimatePresence>
                {notificationOpen ? (
                  <motion.div
                    id="customer-notification-panel"
                    role="dialog"
                    aria-label="Notifikasi pelanggan"
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    className="absolute right-0 top-12 w-[min(22rem,calc(100vw-2rem))] rounded-[1.5rem] border border-emerald-950/10 bg-[#fffaf2] p-4 shadow-[0_24px_80px_rgba(4,34,28,0.18)] dark:border-white/10 dark:bg-[#0b1f1b]"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-serif text-xl font-semibold">Notifikasi</p>
                      <span className="rounded-full bg-amber-400/18 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-200">
                        1 baru
                      </span>
                    </div>
                     <div className="mt-4 rounded-2xl bg-emerald-950 p-4 text-white">
                      <div className="flex gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-400/18 text-emerald-200">
                          <Check className="size-4" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold">Reservasi Anda telah dikonfirmasi</p>
                          <p className="mt-1 text-xs leading-5 text-white/56">
                            Villa Aruna siap menyambut Anda pada 23 Agustus 2026.
                          </p>
                        </div>
                       </div>
                     </div>
                     <Link
                       href="/dashboard/notifications"
                       onClick={() => setNotificationOpen(false)}
                       className="mt-3 flex min-h-10 items-center justify-center gap-1 rounded-full text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-950/5 dark:text-emerald-300 dark:hover:bg-white/7"
                     >
                       Lihat semua notifikasi <ChevronRight className="size-3.5" />
                     </Link>
                   </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
            <button
              type="button"
              onClick={() => setActiveSection("profile")}
              className="ml-1 grid size-10 place-items-center rounded-full bg-emerald-950 text-xs font-bold text-white ring-2 ring-amber-300/60 transition-transform hover:scale-105 dark:bg-emerald-700"
              aria-label={`Buka profil ${customerProfile.name}`}
            >
              {initials}
            </button>
          </div>
        </div>
      </header>

      <div className="relative mx-auto grid max-w-[1440px] gap-7 px-4 pb-28 pt-6 sm:px-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:px-8 lg:pb-12 lg:pt-8">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-[1.8rem] border border-emerald-950/10 bg-white/58 p-3 shadow-[0_18px_70px_rgba(4,34,28,0.06)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
            <div className="rounded-[1.35rem] bg-emerald-950 p-4 text-white">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-full bg-white/10 font-semibold ring-1 ring-white/14">
                  {initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{customerProfile.name}</p>
                  <p className="mt-0.5 text-xs text-white/50">Emerald Member</p>
                </div>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[72%] rounded-full bg-amber-300" />
              </div>
              <p className="mt-2 text-[0.68rem] text-white/48">1 reservasi lagi menuju Gold Circle</p>
            </div>

            <nav className="mt-3 space-y-1" aria-label="Navigasi dashboard pelanggan">
              {dashboardNav.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-sm font-semibold transition-all ${
                      active
                        ? "bg-emerald-700 text-white shadow-[0_12px_28px_rgba(4,120,87,0.2)]"
                        : "text-emerald-950/56 hover:bg-emerald-950/5 hover:text-emerald-950 dark:text-white/54 dark:hover:bg-white/7 dark:hover:text-white"
                    }`}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="mt-3 border-t border-emerald-950/8 pt-3 dark:border-white/8">
              <button
                type="button"
                onClick={() =>
                  notify({
                    title: "Pengaturan akun",
                    description: "Fitur ini akan tersedia setelah autentikasi diaktifkan.",
                    variant: "info",
                  })
                }
                className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold text-emerald-950/48 transition-colors hover:bg-emerald-950/5 hover:text-emerald-950 dark:text-white/46 dark:hover:bg-white/7 dark:hover:text-white"
              >
                <Settings className="size-4" />
                Pengaturan
              </button>
              <button
                type="button"
                onClick={() => void logout()}
                className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold text-red-700/66 transition-colors hover:bg-red-500/8 hover:text-red-700 dark:text-red-300/64 dark:hover:bg-red-400/8 dark:hover:text-red-200"
              >
                <LogOut className="size-4" />
                Keluar
              </button>
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 12, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8, filter: "blur(6px)" }}
              transition={{ duration: 0.32, ease: "easeOut" }}
            >
              {activeSection === "overview" ? (
                <OverviewSection
                  shouldReduceMotion={Boolean(shouldReduceMotion)}
                  firstName={firstName}
                  wishlistCount={wishlist.length}
                  onOpenBookings={() => setActiveSection("bookings")}
                  onOpenWishlist={() => setActiveSection("wishlist")}
                  bookings={bookingItems}
                />
              ) : null}

              {activeSection === "bookings" ? (
                <BookingsSection
                  bookings={visibleBookings}
                  filter={bookingFilter}
                  onFilterChange={setBookingFilter}
                  shouldReduceMotion={Boolean(shouldReduceMotion)}
                  loading={bookingLoading}
                  error={bookingError}
                  onRefresh={() => void loadBookings()}
                  onCheckoutUpdated={(updated) =>
                    setBookingItems((current) =>
                      current.map((booking) => booking.id === updated.id ? updated : booking),
                    )
                  }
                />
              ) : null}

              {activeSection === "wishlist" ? (
                <WishlistSection
                  wishlist={wishlist}
                  onRemove={removeWishlist}
                  shouldReduceMotion={Boolean(shouldReduceMotion)}
                />
              ) : null}

              {activeSection === "profile" ? (
                <ProfileSection
                  profile={customerProfile}
                  initials={initials}
                  onSave={() =>
                    notify({
                      title: "Profil berhasil diperbarui",
                      description: "Perubahan tersimpan pada pratinjau ini.",
                      variant: "success",
                    })
                  }
                />
              ) : null}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>

      <nav
        className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-[1.35rem] border border-emerald-950/10 bg-[#fffaf2]/92 p-1.5 shadow-[0_18px_60px_rgba(4,34,28,0.2)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0b1f1b]/92 lg:hidden"
        aria-label="Navigasi dashboard mobile"
      >
        {dashboardNav.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[0.65rem] font-semibold transition-colors ${
                active
                  ? "bg-emerald-700 text-white"
                  : "text-emerald-950/48 hover:bg-emerald-950/5 dark:text-white/46 dark:hover:bg-white/7"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="size-[1.05rem]" />
              {item.mobileLabel}
            </button>
          );
        })}
      </nav>

    </main>
  );
}

function OverviewSection({
  shouldReduceMotion,
  firstName,
  wishlistCount,
  onOpenBookings,
  onOpenWishlist,
  bookings,
}: {
  shouldReduceMotion: boolean;
  firstName: string;
  wishlistCount: number;
  onOpenBookings: () => void;
  onOpenWishlist: () => void;
  bookings: Booking[];
}) {
  const nextBooking =
    bookings.find((booking) => booking.status === "active" || booking.status === "checkout_requested") ??
    bookings.find((booking) => booking.status === "upcoming") ??
    bookings[0];
  const completed = bookings.filter((booking) => booking.status === "completed");
  const stats = [
    { label: "Total perjalanan", value: String(bookings.length), helper: "Booking dari akun Anda", icon: Briefcase },
    { label: "Malam menginap", value: String(completed.reduce((total, booking) => total + booking.nights, 0)), helper: "Masa inap yang sudah selesai", icon: Moon },
    { label: "Villa tersimpan", value: String(wishlistCount), helper: "Pilihan favorit Anda", icon: Heart },
    { label: "Circle points", value: "2.480", helper: "520 poin menuju Gold", icon: Sparkles },
  ];

  return (
    <div>
      <motion.div
        initial={shouldReduceMotion ? false : "hidden"}
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      >
        <motion.div variants={reveal} className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">
              {new Intl.DateTimeFormat("id-ID", { dateStyle: "full" }).format(new Date())}
            </p>
            <h1 className="mt-3 font-serif text-4xl font-semibold leading-none tracking-[-0.04em] text-emerald-950 dark:text-white sm:text-5xl">
              Selamat datang, {firstName}.
            </h1>
            <p className="mt-3 text-sm leading-6 text-emerald-950/54 dark:text-white/52 sm:text-base">
              Semua reservasi, pembayaran, dan status checkout akun Anda tersinkron dengan PostgreSQL.
            </p>
          </div>
          <Link
            href="/villas"
            className="group inline-flex min-h-11 items-center gap-2 rounded-full bg-emerald-700 px-5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(4,120,87,0.22)] transition-transform hover:-translate-y-0.5"
          >
            Jelajahi villa
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

        {nextBooking ? (
          <motion.article variants={reveal} className="relative mt-7 overflow-hidden rounded-[2rem] bg-emerald-950 text-white shadow-[0_28px_90px_rgba(4,34,28,0.18)]">
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_18%_30%,rgba(16,185,129,0.23),transparent_23rem),radial-gradient(circle_at_84%_4%,rgba(247,217,140,0.2),transparent_22rem)]" />
            <div className="relative grid lg:grid-cols-[1fr_22rem]">
              <div className="p-6 sm:p-8 lg:p-10">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-emerald-400/16 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-emerald-200 ring-1 ring-emerald-300/18">
                    {nextBooking.status === "active" || nextBooking.status === "checkout_requested" ? "Sedang menginap" : "Perjalanan berikutnya"}
                  </span>
                  <span className="rounded-full bg-amber-300/14 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-amber-200 ring-1 ring-amber-200/18">{nextBooking.paymentLabel}</span>
                </div>
                <h2 className="mt-6 max-w-xl font-serif text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">{nextBooking.villaName}</h2>
                <p className="mt-3 flex items-center gap-2 text-sm text-white/54"><MapPin className="size-4 text-amber-300" />{nextBooking.location}</p>
                <div className="mt-7 grid max-w-2xl gap-3 sm:grid-cols-3">
                  <TripDetail icon={CalendarDays} label="Check-in" value={formatShortDate(nextBooking.checkIn)} />
                  <TripDetail icon={Clock3} label="Durasi" value={`${nextBooking.nights} malam`} />
                  <TripDetail icon={Users} label="Tamu" value={`${nextBooking.guests} orang`} />
                </div>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <button type="button" onClick={onOpenBookings} className="group inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-emerald-950 transition-transform hover:-translate-y-0.5">Lihat detail booking <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></button>
                  <a href={`/api/bookings/${encodeURIComponent(nextBooking.id)}/invoice`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/14 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/8"><Download className="size-4" /> Invoice</a>
                </div>
              </div>
              <Link href={`/villas/${nextBooking.villaId}`} className="image-hover relative min-h-64 overflow-hidden lg:min-h-full">
                <img src={nextBooking.image} alt={nextBooking.villaName} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/66 via-transparent to-transparent lg:bg-gradient-to-r" />
                <span className="absolute bottom-5 right-5 inline-flex items-center gap-2 rounded-full bg-white/84 px-4 py-2 text-xs font-semibold text-emerald-950 backdrop-blur-xl">Lihat villa <ArrowRight className="size-3.5" /></span>
              </Link>
            </div>
          </motion.article>
        ) : (
          <motion.div variants={reveal} className="mt-7 rounded-[2rem] border border-dashed border-emerald-950/15 bg-white/40 p-10 text-center dark:border-white/15 dark:bg-white/4">
            <p className="font-serif text-3xl font-semibold">Belum ada perjalanan</p>
            <p className="mt-2 text-sm opacity-48">Booking pertama Anda akan muncul otomatis di sini.</p>
          </motion.div>
        )}

        <motion.div variants={reveal} className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <article
                key={stat.label}
                className="card-lift rounded-[1.5rem] border border-emerald-950/10 bg-white/58 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-emerald-950/42 dark:text-white/40">
                      {stat.label}
                    </p>
                    <p className="mt-3 font-serif text-3xl font-semibold text-emerald-950 dark:text-white sm:text-4xl">
                      {stat.value}
                    </p>
                  </div>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-700/9 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-300">
                    <Icon className="size-4" />
                  </span>
                </div>
                <p className="mt-4 text-xs leading-5 text-emerald-950/44 dark:text-white/42">{stat.helper}</p>
              </article>
            );
          })}
        </motion.div>

        <motion.div variants={reveal} className="mt-5 grid gap-5 xl:grid-cols-[1fr_22rem]">
          <article className="rounded-[1.8rem] border border-emerald-950/10 bg-white/58 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                  Riwayat terbaru
                </p>
                <h2 className="mt-2 font-serif text-2xl font-semibold">Perjalanan Anda</h2>
              </div>
              <button
                type="button"
                onClick={onOpenBookings}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 transition-colors hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-200"
              >
                Semua booking <ChevronRight className="size-4" />
              </button>
            </div>
            <div className="mt-5 space-y-3">
              {bookings.slice(0, 2).map((booking) => (
                <button
                  type="button"
                  key={booking.id}
                  onClick={onOpenBookings}
                  className="group flex w-full items-center gap-3 rounded-2xl border border-emerald-950/8 bg-white/48 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-emerald-700/20 hover:bg-white dark:border-white/8 dark:bg-white/4 dark:hover:border-emerald-300/18 dark:hover:bg-white/7"
                >
                  <img
                    src={booking.image}
                    alt=""
                    className="size-16 shrink-0 rounded-xl object-cover"
                    loading="lazy"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{booking.villaName}</span>
                    <span className="mt-1 block text-xs text-emerald-950/44 dark:text-white/42">
                      {formatShortDate(booking.checkIn)} · {booking.nights} malam
                    </span>
                  </span>
                  <span className="hidden rounded-full bg-emerald-600/9 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-emerald-700 dark:bg-emerald-300/9 dark:text-emerald-300 sm:inline-flex">
                    Selesai
                  </span>
                  <ChevronRight className="size-4 text-emerald-950/30 transition-transform group-hover:translate-x-0.5 dark:text-white/28" />
                </button>
              ))}
            </div>
          </article>

          <article className="relative overflow-hidden rounded-[1.8rem] border border-amber-400/18 bg-amber-300/12 p-6 dark:bg-amber-200/7">
            <div aria-hidden className="absolute -right-14 -top-16 size-48 rounded-full bg-amber-300/24 blur-3xl" />
            <span className="relative grid size-11 place-items-center rounded-full bg-amber-400/20 text-amber-700 dark:text-amber-200">
              <Heart className="size-5 fill-current" />
            </span>
            <p className="relative mt-6 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-200">
              Wishlist
            </p>
            <h2 className="relative mt-2 font-serif text-3xl font-semibold leading-tight">
              {wishlistCount} villa menunggu perjalanan berikutnya.
            </h2>
            <button
              type="button"
              onClick={onOpenWishlist}
              className="relative mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-200"
            >
              Buka wishlist <ArrowRight className="size-4" />
            </button>
          </article>
        </motion.div>
      </motion.div>
    </div>
  );
}

function BookingsSection({
  bookings: filteredBookings,
  filter,
  onFilterChange,
  shouldReduceMotion,
  loading,
  error,
  onRefresh,
  onCheckoutUpdated,
}: {
  bookings: Booking[];
  filter: "all" | BookingStatus;
  onFilterChange: (filter: "all" | BookingStatus) => void;
  shouldReduceMotion: boolean;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onCheckoutUpdated: (booking: Booking) => void;
}) {
  return (
    <div>
      <SectionHeading
        eyebrow="Reservasi"
        title="Riwayat booking"
        description="Pantau perjalanan mendatang, buka kembali invoice, atau temukan inspirasi dari perjalanan sebelumnya."
      />
      <div className="mt-6 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Filter status booking">
        {bookingFilters.map((item) => (
          <button
            type="button"
            role="tab"
            aria-selected={filter === item.id}
            key={item.id}
            onClick={() => onFilterChange(item.id)}
            className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-semibold transition-colors ${
              filter === item.id
                ? "bg-emerald-700 text-white shadow-[0_10px_28px_rgba(4,120,87,0.18)]"
                : "border border-emerald-950/10 bg-white/58 text-emerald-950/56 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white/54 dark:hover:bg-white/9"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <motion.div
        className="mt-4 space-y-4"
        initial={shouldReduceMotion ? false : "hidden"}
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
      >
        <AnimatePresence mode="popLayout">
          {loading && filteredBookings.length === 0 ? (
            <div className="grid min-h-48 place-items-center rounded-[1.8rem] border border-emerald-950/10 bg-white/45 text-sm opacity-48 dark:border-white/10 dark:bg-white/4">
              <span className="inline-flex items-center gap-2"><LoaderCircle className="size-4 animate-spin" /> Memuat booking akun Anda...</span>
            </div>
          ) : null}
          {!loading && error ? (
            <div className="rounded-[1.8rem] border border-rose-400/20 bg-rose-400/8 p-6 text-sm text-rose-700 dark:text-rose-200">
              <p>{error}</p>
              <button type="button" onClick={onRefresh} className="mt-3 rounded-full border border-current px-4 py-2 text-xs font-semibold">Coba lagi</button>
            </div>
          ) : null}
          {!loading && !error && filteredBookings.length === 0 ? (
            <div className="grid min-h-48 place-items-center rounded-[1.8rem] border border-dashed border-emerald-950/14 bg-white/35 p-6 text-center dark:border-white/14 dark:bg-white/4">
              <div><Briefcase className="mx-auto size-8 opacity-25" /><p className="mt-3 font-semibold">Belum ada booking pada filter ini</p></div>
            </div>
          ) : null}
          {filteredBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} onCheckoutUpdated={onCheckoutUpdated} />
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function BookingCard({ booking, onCheckoutUpdated }: { booking: Booking; onCheckoutUpdated: (booking: Booking) => void }) {
  const status = bookingStatusMeta[booking.status];
  const { notify } = useAppNotifications();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutNotes, setCheckoutNotes] = useState("");
  const [requesting, setRequesting] = useState(false);

  const requestCheckout = async () => {
    setRequesting(true);
    try {
      const response = await fetch(`/api/bookings/${encodeURIComponent(booking.id)}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ notes: checkoutNotes }),
      });
      const payload = (await response.json()) as { data?: BookingApiItem; message?: string };
      if (!response.ok || !payload.data) throw new Error(payload.message || "Permintaan checkout gagal dikirim.");
      const updated = toDashboardBooking(payload.data);
      onCheckoutUpdated(updated);
      setCheckoutOpen(false);
      notify({ title: "Permintaan checkout terkirim", description: "Status kini menunggu persetujuan Receptionist.", variant: "success" });
    } catch (requestError) {
      notify({ title: "Checkout belum dapat diajukan", description: requestError instanceof Error ? requestError.message : "Silakan coba kembali.", variant: "error" });
    } finally {
      setRequesting(false);
    }
  };

  return (
    <motion.article
      layout
      variants={reveal}
      exit={{ opacity: 0, scale: 0.98 }}
      className="card-lift overflow-hidden rounded-[1.8rem] border border-emerald-950/10 bg-white/58 shadow-[0_16px_50px_rgba(4,34,28,0.05)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5"
    >
      <div className="grid md:grid-cols-[14rem_minmax(0,1fr)]">
        <Link href={`/villas/${booking.villaId}`} className="image-hover relative min-h-52 overflow-hidden md:min-h-full">
          <img src={booking.image} alt={booking.villaName} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/56 via-transparent to-transparent" />
          <span className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] ${status.className}`}>
            {status.label}
          </span>
        </Link>
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[0.66rem] font-bold uppercase tracking-[0.18em] text-emerald-950/40 dark:text-white/38">
                {booking.code}
              </p>
              <h2 className="mt-2 font-serif text-2xl font-semibold sm:text-3xl">{booking.villaName}</h2>
              <p className="mt-2 flex items-center gap-2 text-sm text-emerald-950/48 dark:text-white/46">
                <MapPin className="size-4 text-amber-600 dark:text-amber-300" /> {booking.location}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs text-emerald-950/40 dark:text-white/38">Total pembayaran</p>
              <p className="mt-1 text-base font-bold">{formatRupiah(booking.total)}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
                <Check className="size-3.5" /> {booking.paymentLabel}
              </p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <BookingDetail label="Check-in" value={formatShortDate(booking.checkIn)} />
            <BookingDetail label="Check-out" value={formatShortDate(booking.checkOut)} />
            <BookingDetail label="Durasi" value={`${booking.nights} malam`} />
            <BookingDetail label="Tamu" value={`${booking.guests} orang`} />
          </div>
          <div className="mt-5 flex flex-wrap gap-2 border-t border-emerald-950/8 pt-5 dark:border-white/8">
            <Link
              href={`/villas/${booking.villaId}`}
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-emerald-700 px-4 text-xs font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              {booking.status === "completed" ? "Pesan lagi" : "Lihat villa"}
              <ArrowRight className="size-3.5" />
            </Link>
            {booking.status !== "cancelled" ? (
              <a
                href={`/api/bookings/${booking.id}/invoice`}
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-emerald-950/10 px-4 text-xs font-semibold transition-colors hover:bg-emerald-950/5 dark:border-white/10 dark:hover:bg-white/8"
              >
                <Download className="size-3.5" /> Invoice
              </a>
            ) : null}
            {booking.status === "completed" ? (
              <Link
                href={`/reviews/new?booking=${booking.id}&villa=${booking.villaId}`}
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-amber-400/20 bg-amber-300/10 px-4 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-300/16 dark:text-amber-200"
              >
                <Star className="size-3.5" /> Tulis ulasan
              </Link>
            ) : null}
            {booking.checkout.canRequest ? (
              <button
                type="button"
                onClick={() => setCheckoutOpen((open) => !open)}
                className="inline-flex min-h-10 items-center gap-2 rounded-full bg-amber-400 px-4 text-xs font-bold text-emerald-950 transition-transform hover:-translate-y-0.5"
              >
                <DoorOpen className="size-3.5" /> Checkout
              </button>
            ) : null}
            {booking.checkout.status === "CHECKOUT_REQUESTED" ? (
              <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-amber-400/25 bg-amber-300/10 px-4 text-xs font-semibold text-amber-800 dark:text-amber-200">
                <Clock3 className="size-3.5 animate-pulse" /> Menunggu persetujuan Receptionist
              </span>
            ) : null}
            {booking.checkout.status === "CHECKED_OUT" ? (
              <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/9 px-4 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <Check className="size-3.5" /> Checked Out {booking.checkout.checkedOutAt ? `· ${formatDateTime(booking.checkout.checkedOutAt)}` : ""}
              </span>
            ) : null}
          </div>
          <AnimatePresence>
            {checkoutOpen ? (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-300/8 p-4">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Ajukan checkout melalui website</p>
                  <p className="mt-1 text-xs leading-5 opacity-55">User hanya mengirim permintaan. Status reservasi baru menjadi Checked Out setelah dikonfirmasi Receptionist.</p>
                  <textarea value={checkoutNotes} onChange={(event) => setCheckoutNotes(event.target.value)} rows={2} maxLength={2000} placeholder="Catatan untuk Receptionist (opsional)" className="mt-3 w-full resize-none rounded-xl border border-emerald-950/10 bg-white/60 p-3 text-sm outline-none focus:border-emerald-600/40 dark:border-white/10 dark:bg-white/5" />
                  <div className="mt-3 flex justify-end gap-2">
                    <button type="button" onClick={() => setCheckoutOpen(false)} className="rounded-full px-4 py-2 text-xs font-semibold">Batal</button>
                    <button type="button" disabled={requesting} onClick={() => void requestCheckout()} className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">
                      {requesting ? <LoaderCircle className="size-3.5 animate-spin" /> : <DoorOpen className="size-3.5" />} Kirim permintaan
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
          {booking.checkout.history.length > 0 ? (
            <div className="mt-4 border-t border-emerald-950/8 pt-4 dark:border-white/8">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] opacity-38">Riwayat checkout</p>
              <div className="mt-2 space-y-2">
                {booking.checkout.history.map((event) => (
                  <div key={event.id} className="flex items-start gap-2 text-xs">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <p><span className="font-semibold">{event.toStatus === "CHECKED_OUT" ? "Checkout dikonfirmasi" : "Permintaan checkout dikirim"}</span><span className="opacity-45"> · {formatDateTime(event.createdAt)} · {event.actor?.name || event.actor?.email || "Sistem"}</span></p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}

function WishlistSection({
  wishlist,
  onRemove,
  shouldReduceMotion,
}: {
  wishlist: WishlistVilla[];
  onRemove: (villa: WishlistVilla) => void;
  shouldReduceMotion: boolean;
}) {
  return (
    <div>
      <SectionHeading
        eyebrow="Koleksi pribadi"
        title="Wishlist Anda"
        description="Simpan inspirasi perjalanan dan kembali saat tanggal liburan sudah ditentukan."
      />
      <AnimatePresence mode="popLayout">
        {wishlist.length ? (
          <motion.div
            className="mt-7 grid gap-5 md:grid-cols-2 2xl:grid-cols-3"
            initial={shouldReduceMotion ? false : "hidden"}
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.09 } } }}
          >
            {wishlist.map((villa) => (
              <motion.article
                layout
                key={villa.id}
                variants={reveal}
                exit={{ opacity: 0, scale: 0.92, rotate: -2 }}
                className="card-lift overflow-hidden rounded-[1.8rem] border border-emerald-950/10 bg-white/58 shadow-[0_16px_50px_rgba(4,34,28,0.05)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5"
              >
                <div className="image-hover relative aspect-[4/3] overflow-hidden">
                  <Link href={`/villas/${villa.id}`}>
                    <img src={villa.image} alt={villa.name} className="h-full w-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/66 via-transparent to-transparent" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => onRemove(villa)}
                    className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/88 text-red-500 shadow-lg backdrop-blur-xl transition-transform hover:scale-110"
                    aria-label={`Hapus ${villa.name} dari wishlist`}
                  >
                    <Heart className="size-4 fill-current" />
                  </button>
                  <span className="absolute bottom-4 left-4 rounded-full bg-emerald-950/72 px-3 py-1.5 text-[0.65rem] font-semibold text-emerald-100 backdrop-blur-xl">
                    {villa.availability}
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="flex items-center gap-1.5 text-emerald-950/48 dark:text-white/46">
                      <MapPin className="size-3.5 text-amber-600 dark:text-amber-300" /> {villa.location}
                    </span>
                    <span className="flex items-center gap-1 font-semibold">
                      <Star className="size-3.5 fill-amber-400 text-amber-400" /> {villa.rating}
                      <span className="font-normal text-emerald-950/38 dark:text-white/36">({villa.reviews})</span>
                    </span>
                  </div>
                  <h2 className="mt-3 font-serif text-2xl font-semibold">{villa.name}</h2>
                  <div className="mt-5 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[0.65rem] uppercase tracking-[0.14em] text-emerald-950/38 dark:text-white/36">Mulai dari</p>
                      <p className="mt-1 text-sm font-bold">{formatRupiah(villa.price)} <span className="font-normal text-emerald-950/38 dark:text-white/36">/ malam</span></p>
                    </div>
                    <Link
                      href={`/villas/${villa.id}`}
                      className="group grid size-11 place-items-center rounded-full bg-emerald-700 text-white shadow-[0_10px_26px_rgba(4,120,87,0.22)] transition-transform hover:-translate-y-0.5"
                      aria-label={`Lihat ${villa.name}`}
                    >
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-7 rounded-[2rem] border border-dashed border-emerald-950/16 bg-white/44 px-6 py-16 text-center dark:border-white/14 dark:bg-white/4"
          >
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-700/9 text-emerald-700 dark:bg-emerald-300/9 dark:text-emerald-300">
              <Heart className="size-6" />
            </span>
            <h2 className="mt-5 font-serif text-3xl font-semibold">Wishlist Anda masih kosong</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-emerald-950/48 dark:text-white/46">
              Temukan villa yang terasa tepat, lalu tekan ikon hati untuk menyimpannya di sini.
            </p>
            <Link href="/villas" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-emerald-700 px-5 text-sm font-semibold text-white">
              Jelajahi villa <ArrowRight className="size-4" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProfileSection({
  profile,
  initials,
  onSave,
}: {
  profile: AuthSessionProfile;
  initials: string;
  onSave: () => void;
}) {
  return (
    <div>
      <SectionHeading
        eyebrow="Data pelanggan"
        title="Profil saya"
        description="Pastikan informasi kontak sesuai agar konfirmasi booking dan invoice selalu sampai kepada Anda."
      />
      <div className="mt-7 grid gap-5 xl:grid-cols-[20rem_minmax(0,1fr)]">
        <article className="rounded-[1.8rem] border border-emerald-950/10 bg-emerald-950 p-6 text-center text-white shadow-[0_24px_70px_rgba(4,34,28,0.16)] dark:border-white/10">
          <div className="relative mx-auto grid size-24 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-800 font-serif text-3xl font-semibold ring-4 ring-amber-300/50">
            {initials}
            <button
              type="button"
              className="absolute bottom-0 right-0 grid size-8 place-items-center rounded-full bg-white text-emerald-950 shadow-lg"
              aria-label="Ubah foto profil"
            >
              <Pencil className="size-3.5" />
            </button>
          </div>
          <h2 className="mt-5 font-serif text-3xl font-semibold">{profile.name}</h2>
          <p className="mt-1 text-sm text-white/50">{profile.email || "Email akun sedang dimuat"}</p>
          <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-300/14 px-4 py-2 text-xs font-semibold text-amber-200 ring-1 ring-amber-200/16">
            <Sparkles className="size-3.5" /> Emerald Member
          </span>
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-6">
            <div>
              <p className="font-serif text-2xl font-semibold">2.480</p>
              <p className="mt-1 text-[0.65rem] uppercase tracking-[0.14em] text-white/40">Circle points</p>
            </div>
            <div>
              <p className="font-serif text-2xl font-semibold">4</p>
              <p className="mt-1 text-[0.65rem] uppercase tracking-[0.14em] text-white/40">Perjalanan</p>
            </div>
          </div>
        </article>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSave();
          }}
          className="rounded-[1.8rem] border border-emerald-950/10 bg-white/58 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:p-7"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Informasi pribadi</p>
              <h2 className="mt-2 font-serif text-2xl font-semibold">Detail kontak</h2>
            </div>
            <span className="hidden items-center gap-1.5 rounded-full bg-emerald-600/9 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-emerald-700 dark:bg-emerald-300/9 dark:text-emerald-300 sm:flex">
              <Check className="size-3.5" /> Terverifikasi
            </span>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <ProfileField key={`name-${profile.name}`} label="Nama lengkap" defaultValue={profile.name} />
            <ProfileField label="Nomor telepon" defaultValue="" placeholder="Tambahkan nomor telepon" />
            <ProfileField
              key={`email-${profile.email}`}
              label="Email"
              defaultValue={profile.email}
              placeholder="Email akun"
              type="email"
            />
            <ProfileField label="Kota domisili" defaultValue="" placeholder="Tambahkan kota domisili" />
          </div>
          <div className="mt-4">
            <label className="grid gap-2 text-xs font-semibold text-emerald-950/58 dark:text-white/56">
              Preferensi perjalanan
              <textarea
                rows={4}
                defaultValue="Villa tenang dengan private pool, cocok untuk perjalanan keluarga dan memiliki layanan chef."
                className="resize-none rounded-2xl border border-emerald-950/10 bg-white/54 px-4 py-3 text-sm font-normal leading-6 text-emerald-950 outline-none transition-shadow focus:border-emerald-600/30 focus:ring-4 focus:ring-emerald-500/8 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </label>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-emerald-950/8 pt-5 dark:border-white/8">
            <p className="text-xs text-emerald-950/40 dark:text-white/38">Terakhir diperbarui 2 Juli 2026</p>
            <button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-emerald-700 px-5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(4,120,87,0.2)] transition-transform hover:-translate-y-0.5">
              <Check className="size-4" /> Simpan perubahan
            </button>
          </div>
        </form>
      </div>

      <article className="mt-5 rounded-[1.8rem] border border-emerald-950/10 bg-white/58 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <AccountPreference icon={CreditCard} title="Metode pembayaran" description="Visa berakhir •• 4821" />
          <AccountPreference icon={Bell} title="Notifikasi" description="Email dan notifikasi web aktif" />
          <AccountPreference icon={WalletCards} title="Mata uang" description="Rupiah Indonesia (IDR)" />
        </div>
      </article>
    </div>
  );
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">{eyebrow}</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold leading-none tracking-[-0.04em] text-emerald-950 dark:text-white sm:text-5xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-950/52 dark:text-white/50 sm:text-base">{description}</p>
    </div>
  );
}

function TripDetail({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/6 p-3.5">
      <div className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/42">
        <Icon className="size-3.5 text-amber-300" /> {label}
      </div>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}

function BookingDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-emerald-950/[0.035] px-3 py-2.5 dark:bg-white/[0.045]">
      <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-emerald-950/34 dark:text-white/32">{label}</p>
      <p className="mt-1 text-xs font-semibold">{value}</p>
    </div>
  );
}

function ProfileField({
  label,
  defaultValue,
  placeholder,
  type = "text",
}: {
  label: string;
  defaultValue: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-xs font-semibold text-emerald-950/58 dark:text-white/56">
      {label}
      <input
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-12 rounded-2xl border border-emerald-950/10 bg-white/54 px-4 text-sm font-normal text-emerald-950 outline-none transition-shadow focus:border-emerald-600/30 focus:ring-4 focus:ring-emerald-500/8 dark:border-white/10 dark:bg-white/5 dark:text-white"
      />
    </label>
  );
}

function AccountPreference({ icon: Icon, title, description }: { icon: typeof CreditCard; title: string; description: string }) {
  return (
    <button type="button" className="group flex items-center gap-3 rounded-2xl p-3 text-left transition-colors hover:bg-emerald-950/4 dark:hover:bg-white/5">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-700/9 text-emerald-700 dark:bg-emerald-300/9 dark:text-emerald-300">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-1 block truncate text-xs text-emerald-950/42 dark:text-white/40">{description}</span>
      </span>
      <ChevronRight className="size-4 text-emerald-950/24 transition-transform group-hover:translate-x-0.5 dark:text-white/22" />
    </button>
  );
}

const bookingStatusMeta: Record<BookingStatus, { label: string; className: string }> = {
  upcoming: { label: "Akan datang", className: "bg-emerald-300/90 text-emerald-950" },
  active: { label: "Active · Sedang menginap", className: "bg-sky-100/95 text-sky-800" },
  checkout_requested: { label: "Checkout Requested", className: "bg-amber-200/95 text-amber-900" },
  completed: { label: "Selesai", className: "bg-white/86 text-emerald-950" },
  cancelled: { label: "Dibatalkan", className: "bg-red-100/90 text-red-700" },
};

function toDashboardBooking(record: BookingApiItem): Booking {
  const status: BookingStatus =
    record.checkout.status === "CHECKED_OUT" || record.bookingStatus === "COMPLETED"
      ? "completed"
      : record.checkout.status === "CHECKOUT_REQUESTED"
        ? "checkout_requested"
        : record.checkout.status === "ACTIVE"
          ? "active"
          : ["CANCELLED", "EXPIRED", "REFUNDED"].includes(record.bookingStatus)
            ? "cancelled"
            : "upcoming";
  const paymentLabel =
    record.paymentStatus === "PAID"
      ? "Lunas"
      : record.paymentStatus === "PARTIALLY_PAID"
        ? "Dibayar sebagian"
        : record.paymentStatus === "REFUNDED"
          ? "Refund"
          : "Belum lunas";

  return {
    id: record.bookingId,
    code: record.bookingCode,
    villaId: record.villa.id,
    villaName: record.villa.name,
    location: record.villa.location,
    image: record.villa.image || fallbackVillaImage,
    checkIn: record.stay.checkIn,
    checkOut: record.stay.checkOut,
    nights: record.stay.nights,
    guests: record.stay.guests,
    total: record.totalAmount,
    status,
    paymentLabel,
    checkout: record.checkout,
  };
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
