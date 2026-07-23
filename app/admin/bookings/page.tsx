"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  Bell,
  BadgeCheck,
  Building2,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Download,
  DoorOpen,
  Eye,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  MessageSquareText,
  Moon,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Sun,
  UserRound,
  Users,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { AdminFilterBar } from "@/components/admin-filter-bar";
import { useAppNotifications } from "@/components/notification-root";
import { useAdminNotificationCount } from "@/components/use-admin-notification-count";
import { useAdminSession } from "@/components/use-admin-session";
import type { BookingStoreRecord } from "@/lib/booking-store";
import { generateInvoicePdf } from "@/lib/invoice-pdf";
import { cn } from "@/lib/utils";

type BookingStatus =
  "PENDING" | "CONFIRMED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED";
type PaymentStatus =
  | "PAID"
  | "PARTIALLY_PAID"
  | "PENDING"
  | "FAILED"
  | "REFUNDED";

type BookingItem = {
  id: string;
  code: string;
  guest: string;
  email: string;
  phone?: string;
  specialRequest?: string | null;
  initials: string;
  villa: string;
  image: string;
  checkInIso?: string;
  checkOutIso?: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  total: number;
  paid?: number;
  remaining?: number;
  status: BookingStatus;
  payment: PaymentStatus;
  createdAt: string;
};

const bookings: BookingItem[] = [
  {
    id: "b-1482",
    code: "VLK-260823-1482",
    guest: "Maya Putri",
    email: "maya@villaku.test",
    initials: "MP",
    villa: "Villa Aruna Cliffside",
    image:
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=400&q=80",
    checkIn: "23 Agu 2026",
    checkOut: "26 Agu 2026",
    nights: 3,
    guests: 6,
    total: 21312000,
    status: "PENDING",
    payment: "PENDING",
    createdAt: "14 Jul, 09.42",
  },
  {
    id: "b-1519",
    code: "VLK-260902-1519",
    guest: "Rizky Ananda",
    email: "rizky@example.com",
    initials: "RA",
    villa: "Sagara Beach House",
    image:
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=400&q=80",
    checkIn: "2 Sep 2026",
    checkOut: "7 Sep 2026",
    nights: 5,
    guests: 8,
    total: 29400000,
    status: "CONFIRMED",
    payment: "PAID",
    createdAt: "14 Jul, 08.18",
  },
  {
    id: "b-1467",
    code: "VLK-260819-1467",
    guest: "Sofia Laurent",
    email: "sofia@example.com",
    initials: "SL",
    villa: "Nara Jungle Residence",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=400&q=80",
    checkIn: "19 Agu 2026",
    checkOut: "23 Agu 2026",
    nights: 4,
    guests: 4,
    total: 16352000,
    status: "PENDING",
    payment: "FAILED",
    createdAt: "13 Jul, 21.06",
  },
  {
    id: "b-1441",
    code: "VLK-260812-1441",
    guest: "Daniel Wijaya",
    email: "daniel@example.com",
    initials: "DW",
    villa: "Luna Honeymoon Villa",
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80",
    checkIn: "12 Agu 2026",
    checkOut: "15 Agu 2026",
    nights: 3,
    guests: 2,
    total: 9912000,
    status: "CHECKED_IN",
    payment: "PAID",
    createdAt: "11 Jul, 16.35",
  },
  {
    id: "b-1398",
    code: "VLK-260730-1398",
    guest: "Keiko Tanaka",
    email: "keiko@example.com",
    initials: "KT",
    villa: "Samaya Ocean Pavilion",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=400&q=80",
    checkIn: "30 Jul 2026",
    checkOut: "3 Agu 2026",
    nights: 4,
    guests: 5,
    total: 25760000,
    status: "COMPLETED",
    payment: "PAID",
    createdAt: "8 Jul, 11.20",
  },
  {
    id: "b-1374",
    code: "VLK-260725-1374",
    guest: "Nadia Rahman",
    email: "nadia@example.com",
    initials: "NR",
    villa: "Maira Family Estate",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80",
    checkIn: "25 Jul 2026",
    checkOut: "28 Jul 2026",
    nights: 3,
    guests: 10,
    total: 20496000,
    status: "CANCELLED",
    payment: "REFUNDED",
    createdAt: "5 Jul, 14.08",
  },
];

const statusMeta: Record<
  BookingStatus,
  { label: string; className: string; icon: typeof Clock3 }
> = {
  PENDING: {
    label: "Menunggu",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-300/12 dark:text-amber-200",
    icon: Clock3,
  },
  CONFIRMED: {
    label: "Dikonfirmasi",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-300/12 dark:text-emerald-200",
    icon: CheckCircle2,
  },
  CHECKED_IN: {
    label: "Check-in",
    className: "bg-sky-100 text-sky-700 dark:bg-sky-300/12 dark:text-sky-200",
    icon: CalendarCheck2,
  },
  COMPLETED: {
    label: "Selesai",
    className:
      "bg-slate-200/70 text-slate-600 dark:bg-white/8 dark:text-white/55",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Dibatalkan",
    className:
      "bg-rose-100 text-rose-700 dark:bg-rose-300/12 dark:text-rose-200",
    icon: XCircle,
  },
};

const paymentMeta: Record<PaymentStatus, { label: string; className: string }> =
  {
    PAID: {
      label: "Lunas",
      className: "text-emerald-700 dark:text-emerald-300",
    },
    PARTIALLY_PAID: {
      label: "Deposit terverifikasi",
      className: "text-emerald-700 dark:text-emerald-300",
    },
    PENDING: {
      label: "Menunggu bayar",
      className: "text-amber-700 dark:text-amber-300",
    },
    FAILED: { label: "Gagal", className: "text-rose-600 dark:text-rose-300" },
    REFUNDED: {
      label: "Refund",
      className: "text-violet-700 dark:text-violet-300",
    },
  };

const navItems = [
  { label: "Overview", icon: LayoutDashboard, href: "/admin" },
  {
    label: "Booking",
    icon: CalendarDays,
    href: "/admin/bookings",
    active: true,
  },
  { label: "Checkout", icon: DoorOpen, href: "/admin/checkouts" },
  { label: "Villa", icon: Building2, href: "/admin/villas" },
  { label: "Pembayaran", icon: CircleDollarSign, href: "/admin/payments" },
  { label: "Customer", icon: Users, href: "/admin/customers" },
  { label: "Ulasan", icon: MessageSquareText, href: "/admin/reviews" },
  { label: "Notifikasi", icon: Bell, href: "/admin/notifications" },
  { label: "Laporan", icon: BarChart3, href: "/admin/reports" },
  { label: "Pengguna", icon: UserRound, href: "/admin/users" },
  { label: "Pengaturan", icon: Settings, href: "/admin/settings" },
];

const money = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export default function AdminBookingListPage() {
  const reduceMotion = useReducedMotion();
  const { notify } = useAppNotifications();
  const { profile, roleLabel, initials, canAccess, home, logout } =
    useAdminSession();
  const unreadCount = useAdminNotificationCount(profile.role, profile.email);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(
    null,
  );
  const [bookingItems, setBookingItems] = useState<BookingItem[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | BookingStatus>("ALL");
  const [payment, setPayment] = useState<"ALL" | PaymentStatus>("ALL");

  useEffect(() => {
    const saved = window.localStorage.getItem("villaku-theme");
    const next =
      saved === "dark" ||
      (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)
        ? "dark"
        : "light";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }, []);

  useEffect(() => {
    if (!profile.role) return;
    const controller = new AbortController();
    const refreshBookings = async () => {
      try {
        const response = await fetch("/api/admin/bookings", {
          cache: "no-store",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("BOOKING_SYNC_FAILED");
        const payload = (await response.json()) as {
          data?: { bookings?: BookingStoreRecord[] };
        };
        const liveBookings = (payload.data?.bookings ?? []).map(toBookingItem);
        setBookingItems(liveBookings);
        setSelectedBooking((current) =>
          current
            ? liveBookings.find((item) => item.id === current.id) ?? current
            : current,
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    };

    void refreshBookings();
    const interval = window.setInterval(() => void refreshBookings(), 15_000);
    const onFocus = () => void refreshBookings();
    window.addEventListener("focus", onFocus);
    return () => {
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [profile.role]);

  useEffect(() => {
    const bookingCode = new URLSearchParams(window.location.search).get(
      "booking",
    );
    if (!bookingCode) return;
    const match = bookingItems.find(
      (item) => item.code.toLowerCase() === bookingCode.toLowerCase(),
    );
    if (match) setSelectedBooking(match);
  }, [bookingItems]);

  const visible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("id-ID");
    return bookingItems.filter((item) => {
      const matchesQuery =
        !normalized ||
        `${item.code} ${item.guest} ${item.email} ${item.villa}`
          .toLocaleLowerCase("id-ID")
          .includes(normalized);
      return (
        matchesQuery &&
        (status === "ALL" || item.status === status) &&
        (payment === "ALL" || item.payment === payment)
      );
    });
  }, [bookingItems, payment, query, status]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    window.localStorage.setItem("villaku-theme", next);
  };

  const reset = () => {
    setQuery("");
    setStatus("ALL");
    setPayment("ALL");
  };

  const openBookingDetail = (item: BookingItem) => {
    setSelectedBooking(item);
    const url = new URL(window.location.href);
    url.searchParams.set("booking", item.code);
    window.history.replaceState({}, "", url);
  };

  const closeBookingDetail = () => {
    setSelectedBooking(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("booking");
    window.history.replaceState({}, "", url);
  };

  const updateReviewedBooking = async (
    item: BookingItem,
    nextStatus: BookingStatus,
  ) => {
    const response = await fetch(
      `/api/admin/bookings/${encodeURIComponent(item.id)}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          reason:
            nextStatus === "CANCELLED"
              ? "Dibatalkan oleh tim operasional dari halaman booking."
              : null,
        }),
      },
    );
    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;
    if (!response.ok) {
      throw new Error(payload?.message || "Status booking belum dapat diperbarui.");
    }
    const updated = { ...item, status: nextStatus };
    setBookingItems((current) =>
      current.map((booking) => (booking.id === item.id ? updated : booking)),
    );
    setSelectedBooking(updated);
    notify({
      title: "Tinjauan booking disimpan",
      description: `${item.code} diperbarui menjadi ${statusMeta[nextStatus].label}.`,
      variant: "success",
    });
  };

  const handleCheckInComplete = (item: BookingItem) => {
    const updated: BookingItem = {
      ...item,
      status: "CHECKED_IN",
      payment: "PAID",
      paid: item.total,
      remaining: 0,
    };
    setBookingItems((current) =>
      current.map((booking) => (booking.id === item.id ? updated : booking)),
    );
    setSelectedBooking(updated);
    notify({
      title: "Tamu berhasil check-in",
      description: `${item.code} sudah lunas dan status menginap telah aktif.`,
      variant: "success",
    });
  };

  const exportBookings = () => {
    try {
      const workbook = createExcelWorkbook(visible);
      const blob = new Blob([workbook], {
        type: "application/vnd.ms-excel;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `villaku-booking-${formatIsoDate(new Date())}.xls`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      notify({
        title: "Data booking berhasil diekspor",
        description: `${visible.length} baris data tersedia dalam file Excel.`,
        variant: "success",
      });
    } catch {
      notify({
        title: "Ekspor Excel gagal",
        description: "Silakan coba lagi setelah memuat ulang halaman.",
        variant: "error",
      });
    }
  };

  const exportInvoice = (item: BookingItem) => {
    try {
      const pdf = generateInvoicePdf({
        booking: toInvoiceBooking(item),
        provider: paymentProvider(item.payment),
      });
      const blob = new Blob([pdf.buffer as ArrayBuffer], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `villaku-invoice-${item.code.toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      notify({
        title: "Invoice berhasil dibuat",
        description: `PDF invoice ${item.code} mulai diunduh.`,
        variant: "success",
      });
    } catch {
      notify({
        title: "Invoice gagal dibuat",
        description: "Silakan coba lagi atau hubungi administrator sistem.",
        variant: "error",
      });
    }
  };

  return (
    <main className="min-h-screen bg-[#f2f4f0] text-foreground dark:bg-[#06100e]">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-emerald-950/8 bg-[#f2f4f0]/86 px-4 py-3 backdrop-blur-2xl dark:border-white/8 dark:bg-[#06100e]/88 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="grid size-10 place-items-center rounded-xl border border-emerald-950/10 bg-white/70 lg:hidden dark:border-white/10 dark:bg-white/6"
                aria-label="Buka navigasi admin"
              >
                <Menu className="size-4" />
              </button>
              <div>
                <p className="font-serif text-lg font-semibold leading-none sm:text-xl">
                  Manajemen booking
                </p>
                <p className="mt-1 hidden text-xs text-emerald-950/42 dark:text-white/40 sm:block">
                  Pantau reservasi dan perjalanan setiap tamu
                </p>
              </div>
            </div>
            <div className="relative flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="grid size-10 place-items-center rounded-full border border-emerald-950/10 bg-white/72 transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/6"
                aria-label="Ubah tema gelap atau terang"
              >
                {theme === "dark" ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
              </button>
              <Link
                href="/admin/notifications"
                className="relative grid size-10 place-items-center rounded-full border border-emerald-950/10 bg-white/72 transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/6"
                aria-label="Buka notifikasi admin"
              >
                <Bell className="size-4" />
                {unreadCount > 0 ? (
                  <span className="absolute -right-0.5 -top-1 grid size-5 place-items-center rounded-full bg-amber-400 text-[0.58rem] font-bold text-emerald-950">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </Link>
              <button
                type="button"
                onClick={() => setProfileOpen((current) => !current)}
                className="ml-1 grid size-10 place-items-center rounded-full bg-emerald-950 text-xs font-bold text-white ring-2 ring-amber-300/60 dark:bg-emerald-700"
                aria-label="Buka menu profil"
                aria-expanded={profileOpen}
              >
                {initials}
              </button>
              <AnimatePresence>
                {profileOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.97 }}
                    className="absolute right-0 top-12 w-60 rounded-2xl border border-emerald-950/8 bg-[#fffdf8] p-2 shadow-2xl dark:border-white/8 dark:bg-[#10231e]"
                  >
                    <div className="border-b border-emerald-950/7 px-3 py-2.5 dark:border-white/7">
                      <p className="truncate text-sm font-bold">
                        {profile.name}
                      </p>
                      <p className="mt-0.5 text-xs text-emerald-950/40 dark:text-white/38">
                        {roleLabel} · {profile.email}
                      </p>
                    </div>
                    <Link
                      href={
                        canAccess("/admin/settings") ? "/admin/settings" : home
                      }
                      className="mt-1 flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm hover:bg-emerald-950/5 dark:hover:bg-white/6"
                    >
                      <UserRound className="size-4" /> Profil & pengaturan
                    </Link>
                    <button
                      type="button"
                      onClick={logout}
                      className="flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-300/8"
                    >
                      <LogOut className="size-4" /> Keluar
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-7 sm:px-6 lg:px-8 lg:pt-10">
          <motion.div
            initial={
              reduceMotion ? false : { opacity: 0, y: 18, filter: "blur(8px)" }
            }
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between"
          >
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
                <Sparkles className="size-3.5" /> Reservation desk
              </span>
              <h1 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
                Daftar booking
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-950/48 dark:text-white/46">
                Kelola booking baru, kedatangan mendatang, status pembayaran,
                dan kebutuhan tindak lanjut tamu.
              </p>
            </div>
            <button
              type="button"
              onClick={exportBookings}
              className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-full border border-emerald-950/10 bg-white/72 px-5 text-sm font-bold transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/6"
            >
              <Download className="size-4" /> Ekspor Excel
            </button>
          </motion.div>

          <div className="mt-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Metric
              label="Total booking"
              value={String(bookingItems.length)}
              helper="Data PostgreSQL"
              icon={CalendarDays}
              tone="emerald"
            />
            <Metric
              label="Menunggu tindakan"
              value={String(
                bookingItems.filter((item) => item.status === "PENDING").length,
              )}
              helper="Perlu ditinjau"
              icon={Clock3}
              tone="amber"
            />
            <Metric
              label="Check-in hari ini"
              value={String(
                bookingItems.filter(
                  (item) => item.checkInIso === formatIsoDate(new Date()),
                ).length,
              )}
              helper="Tamu tiba"
              icon={CalendarCheck2}
              tone="sky"
            />
            <Metric
              label="Nilai reservasi"
              value={compactRupiah(
                bookingItems.reduce((total, item) => total + item.total, 0),
              )}
              helper="Seluruh booking"
              icon={CircleDollarSign}
              tone="rose"
            />
          </div>

          <section className="mt-6 overflow-hidden rounded-[1.7rem] border border-emerald-950/8 bg-white/68 shadow-[0_20px_70px_rgba(4,34,28,0.055)] dark:border-white/8 dark:bg-white/[0.045]">
            <AdminFilterBar
              query={query}
              onQueryChange={setQuery}
              placeholder="Cari kode, nama tamu, email, villa..."
              resultCount={visible.length}
              resultLabel="booking ditemukan"
              hasActiveFilters={Boolean(
                query || status !== "ALL" || payment !== "ALL",
              )}
              onReset={reset}
              filters={[
                {
                  label: "Status booking",
                  value: status,
                  onChange: (value) => setStatus(value as typeof status),
                  options: [
                    { value: "ALL", label: "Semua status" },
                    ...Object.entries(statusMeta).map(([value, meta]) => ({
                      value,
                      label: meta.label,
                    })),
                  ],
                },
                {
                  label: "Status pembayaran",
                  value: payment,
                  onChange: (value) => setPayment(value as typeof payment),
                  options: [
                    { value: "ALL", label: "Semua pembayaran" },
                    ...Object.entries(paymentMeta).map(([value, meta]) => ({
                      value,
                      label: meta.label,
                    })),
                  ],
                },
              ]}
            />

            <div className="hidden overflow-x-auto border-t border-emerald-950/8 dark:border-white/8 md:block">
              <table className="w-full min-w-[1050px] border-collapse">
                <thead>
                  <tr className="bg-emerald-950/[0.025] text-left text-[0.62rem] font-bold uppercase tracking-[0.14em] text-emerald-950/38 dark:bg-white/[0.025] dark:text-white/36">
                    <th className="px-5 py-3.5">Booking & tamu</th>
                    <th className="px-4 py-3.5">Villa</th>
                    <th className="px-4 py-3.5">Periode</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Total</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((item, index) => (
                    <BookingRow
                      key={item.id}
                      item={item}
                      delay={reduceMotion ? 0 : index * 0.035}
                      onView={() => openBookingDetail(item)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 border-t border-emerald-950/8 p-4 dark:border-white/8 md:hidden">
              {visible.map((item) => (
                <BookingCard
                  key={item.id}
                  item={item}
                  onView={() => openBookingDetail(item)}
                />
              ))}
            </div>
            {!visible.length ? (
              <div className="grid min-h-72 place-items-center border-t border-emerald-950/8 p-6 text-center dark:border-white/8">
                <div>
                  <span className="mx-auto grid size-13 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
                    <SlidersHorizontal className="size-5" />
                  </span>
                  <h2 className="mt-4 font-serif text-2xl font-semibold">
                    Booking tidak ditemukan
                  </h2>
                  <p className="mt-2 text-sm text-emerald-950/44 dark:text-white/42">
                    Ubah kata kunci atau filter pencarian.
                  </p>
                  <button
                    type="button"
                    onClick={reset}
                    className="mt-4 rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white"
                  >
                    Reset filter
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
      <AnimatePresence>
        {selectedBooking ? (
          <BookingDetailModal
            item={selectedBooking}
            reduceMotion={Boolean(reduceMotion)}
            onClose={closeBookingDetail}
            onExport={() => exportInvoice(selectedBooking)}
            onStatusChange={(nextStatus) =>
              updateReviewedBooking(selectedBooking, nextStatus)
            }
            canReview={canAccess("/admin/bookings", "PATCH")}
            canCheckIn={[
              "SUPER_ADMIN",
              "ADMIN",
              "RECEPTIONIST",
            ].includes(profile.role)}
            onCheckInComplete={() => handleCheckInComplete(selectedBooking)}
          />
        ) : null}
      </AnimatePresence>
    </main>
  );
}

function BookingRow({
  item,
  delay,
  onView,
}: {
  item: BookingItem;
  delay: number;
  onView: () => void;
}) {
  const status = statusMeta[item.status];
  const Icon = status.icon;
  return (
    <motion.tr
      initial={{ opacity: 0, y: 7 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="border-t border-emerald-950/7 transition hover:bg-emerald-950/[0.018] dark:border-white/7 dark:hover:bg-white/[0.018]"
    >
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
            {item.initials}
          </span>
          <div>
            <p className="text-sm font-bold">{item.guest}</p>
            <p className="mt-1 text-[0.65rem] text-emerald-950/40 dark:text-white/38">
              {item.code} · {item.email}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2.5">
          <img
            src={item.image}
            alt=""
            className="size-10 rounded-xl object-cover"
            loading="lazy"
          />
          <div>
            <p className="max-w-44 truncate text-xs font-semibold">
              {item.villa}
            </p>
            <p className="mt-1 text-[0.62rem] text-emerald-950/38 dark:text-white/36">
              {item.guests} tamu
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <p className="text-xs font-semibold">
          {item.checkIn} – {item.checkOut}
        </p>
        <p className="mt-1 text-[0.62rem] text-emerald-950/38 dark:text-white/36">
          {item.nights} malam · dibuat {item.createdAt}
        </p>
      </td>
      <td className="px-4 py-4">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[0.58rem] font-bold uppercase tracking-[0.1em]",
            status.className,
          )}
        >
          <Icon className="size-3" />
          {status.label}
        </span>
        <p
          className={cn(
            "mt-2 text-[0.65rem] font-bold",
            paymentMeta[item.payment].className,
          )}
        >
          {paymentMeta[item.payment].label}
        </p>
      </td>
      <td className="px-4 py-4">
        <p className="text-sm font-bold">{money.format(item.total)}</p>
      </td>
      <td className="px-5 py-4 text-right">
        <button
          type="button"
          onClick={onView}
          className="inline-flex size-9 items-center justify-center rounded-xl border border-emerald-950/8 text-emerald-700 transition hover:-translate-y-0.5 hover:bg-emerald-100 dark:border-white/8 dark:text-emerald-200 dark:hover:bg-emerald-300/10"
          aria-label={`Lihat booking ${item.code}`}
        >
          <Eye className="size-4" />
        </button>
      </td>
    </motion.tr>
  );
}

function BookingCard({
  item,
  onView,
}: {
  item: BookingItem;
  onView: () => void;
}) {
  const status = statusMeta[item.status];
  return (
    <article className="rounded-2xl border border-emerald-950/8 bg-white/55 p-4 dark:border-white/8 dark:bg-white/[0.025]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
            {item.initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{item.guest}</p>
            <p className="mt-1 text-[0.62rem] text-emerald-950/40 dark:text-white/38">
              {item.code}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[0.55rem] font-bold uppercase",
            status.className,
          )}
        >
          {status.label}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-3 border-y border-emerald-950/7 py-3 dark:border-white/7">
        <img
          src={item.image}
          alt=""
          className="size-12 rounded-xl object-cover"
        />
        <div>
          <p className="text-xs font-semibold">{item.villa}</p>
          <p className="mt-1 text-[0.62rem] text-emerald-950/38 dark:text-white/36">
            {item.checkIn} – {item.checkOut} · {item.nights} malam
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold">{money.format(item.total)}</p>
          <p
            className={cn(
              "mt-1 text-[0.62rem] font-bold",
              paymentMeta[item.payment].className,
            )}
          >
            {paymentMeta[item.payment].label}
          </p>
        </div>
        <button
          type="button"
          onClick={onView}
          className="inline-flex min-h-9 items-center gap-2 rounded-full bg-emerald-700 px-4 text-xs font-bold text-white"
        >
          <Eye className="size-3.5" /> Detail
        </button>
      </div>
    </article>
  );
}

function BookingDetailModal({
  item,
  reduceMotion,
  onClose,
  onExport,
  onStatusChange,
  canReview,
  canCheckIn,
  onCheckInComplete,
}: {
  item: BookingItem;
  reduceMotion: boolean;
  onClose: () => void;
  onExport: () => void;
  onStatusChange: (status: BookingStatus) => Promise<void>;
  canReview: boolean;
  canCheckIn: boolean;
  onCheckInComplete: () => void;
}) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewBusy, setReviewBusy] = useState<BookingStatus | null>(null);
  const [reviewError, setReviewError] = useState("");
  const status = statusMeta[item.status];
  const StatusIcon = status.icon;
  const subtotal = Math.round(item.total / 1.11);
  const tax = item.total - subtotal;
  const reviewActions = getBookingReviewActions(item.status);
  const paid = getPaidAmount(item);
  const remaining = getRemainingAmount(item);

  const handleReview = async (nextStatus: BookingStatus) => {
    setReviewError("");
    setReviewBusy(nextStatus);
    try {
      await onStatusChange(nextStatus);
      setReviewOpen(false);
    } catch (error) {
      setReviewError(
        error instanceof Error
          ? error.message
          : "Status booking belum dapat diperbarui.",
      );
    } finally {
      setReviewBusy(null);
    }
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-end justify-center overflow-hidden bg-emerald-950/60 p-0 backdrop-blur-lg sm:items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-detail-title"
        initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduceMotion ? undefined : { opacity: 0, y: 18, scale: 0.98 }}
        className="flex h-[100dvh] min-h-0 w-full max-w-5xl flex-col overflow-hidden rounded-none border border-white/10 bg-[#fffdf8] shadow-2xl dark:bg-[#0c1c18] sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:rounded-[2rem]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="z-10 flex shrink-0 items-start justify-between border-b border-emerald-950/8 bg-[#fffdf8]/96 p-4 backdrop-blur-xl dark:border-white/8 dark:bg-[#0c1c18]/96 sm:p-5 lg:px-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.58rem] font-bold uppercase tracking-[0.1em]",
                  status.className,
                )}
              >
                <StatusIcon className="size-3" /> {status.label}
              </span>
              <span
                className={cn(
                  "text-xs font-bold",
                  paymentMeta[item.payment].className,
                )}
              >
                {paymentMeta[item.payment].label}
              </span>
            </div>
            <h2
              id="booking-detail-title"
              className="mt-3 font-serif text-2xl font-semibold sm:text-3xl"
            >
              Detail booking
            </h2>
            <p className="mt-1 font-mono text-xs font-bold tracking-[0.08em] text-emerald-700 dark:text-emerald-300">
              {item.code}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-950/5 transition hover:rotate-90 dark:bg-white/7"
            aria-label="Tutup detail booking"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
          <div className="grid min-w-0 gap-5 p-4 sm:p-5 lg:px-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="min-w-0 space-y-5">
            <div className="overflow-hidden rounded-2xl border border-emerald-950/8 dark:border-white/8">
              <img
                src={item.image}
                alt={item.villa}
                className="h-40 w-full object-cover"
              />
              <div className="p-4">
                <p className="break-words font-serif text-xl font-semibold">
                  {item.villa}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Detail label="Check-in" value={item.checkIn} />
                  <Detail label="Check-out" value={item.checkOut} />
                  <Detail label="Durasi" value={`${item.nights} malam`} />
                  <Detail label="Tamu" value={`${item.guests} orang`} />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-950/8 bg-white/50 p-4 dark:border-white/8 dark:bg-white/[0.025]">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-300">
                Catatan tamu
              </p>
              <p className="mt-2 text-sm leading-6 text-emerald-950/55 dark:text-white/52">
                {item.specialRequest ||
                  "Tidak ada permintaan khusus dari tamu."}
              </p>
            </div>
          </div>

          <div className="min-w-0 space-y-5">
            <div className="rounded-2xl bg-emerald-950 p-5 text-white">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.15em] text-amber-200">
                Informasi tamu
              </p>
              <div className="mt-4 flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-full bg-white/10 text-sm font-bold">
                  {item.initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{item.guest}</p>
                  <p className="mt-1 text-xs text-white/48">
                    Verifikasi identitas saat kedatangan
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-xs">
                <p className="flex min-w-0 items-center justify-between gap-3">
                  <span className="text-white/45">Email</span>
                  <span className="min-w-0 truncate text-right font-semibold">
                    {item.email}
                  </span>
                </p>
                <p className="flex min-w-0 items-center justify-between gap-3">
                  <span className="text-white/45">Telepon</span>
                  <span className="min-w-0 break-words text-right font-semibold">
                    {item.phone || "Belum tersedia"}
                  </span>
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-950/8 p-5 dark:border-white/8">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-300">
                Ringkasan pembayaran
              </p>
              <div className="mt-4 space-y-3 text-sm">
                <PriceRow label={`${item.nights} malam`} value={subtotal} />
                <PriceRow label="Pajak & layanan" value={tax} />
                <div className="border-t border-emerald-950/8 pt-3 dark:border-white/8">
                 <PriceRow
                    label="Total pembayaran"
                    value={item.total}
                    strong
                  />
                  <div className="mt-3 space-y-3 border-t border-emerald-950/8 pt-3 dark:border-white/8">
                    <PriceRow label="Sudah dibayar" value={paid} />
                    <PriceRow
                      label="Sisa pelunasan"
                      value={remaining}
                      strong={remaining > 0}
                    />
                  </div>
                </div>
              </div>
            </div>
            {canCheckIn && item.status === "CONFIRMED" ? (
              <ReceptionCheckInPanel
                item={item}
                remaining={remaining}
                onComplete={onCheckInComplete}
              />
            ) : null}
            {item.status === "CHECKED_IN" ? (
              <div
                role="status"
                className="rounded-2xl border border-emerald-500/18 bg-emerald-500/8 p-4 text-emerald-800 dark:text-emerald-200"
              >
                <div className="flex items-start gap-3">
                  <BadgeCheck className="mt-0.5 size-5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold">Tamu sudah check-in</p>
                    <p className="mt-1 text-xs leading-5 opacity-65">
                      Verifikasi kedatangan selesai dan seluruh tagihan telah
                      tercatat lunas.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            <p className="text-xs leading-5 text-emerald-950/42 dark:text-white/40">
              Booking dibuat {item.createdAt}. Perubahan status dan tindakan
              operasional tersedia pada tahap kontrol booking berikutnya.
            </p>
          </div>
        </div>
        </div>
        <div className="z-10 shrink-0 border-t border-emerald-950/8 bg-[#fffdf8]/96 p-3 backdrop-blur-xl dark:border-white/8 dark:bg-[#0c1c18]/96 sm:p-4 sm:px-6">
          <AnimatePresence initial={false}>
            {reviewOpen ? (
              <motion.div
                initial={{ opacity: 0, y: 8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: 5, height: 0 }}
                className="mb-4 overflow-hidden rounded-2xl border border-emerald-700/15 bg-emerald-50 p-4 dark:border-emerald-300/12 dark:bg-emerald-300/[0.055]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
                      Kontrol tinjauan
                    </p>
                    <p className="mt-1 text-xs leading-5 text-emerald-950/50 dark:text-white/48">
                      Pilih tindak lanjut untuk booking {item.code}.
                    </p>
                    {reviewError ? (
                      <p className="mt-2 text-xs font-semibold text-rose-700 dark:text-rose-200">
                        {reviewError}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {reviewActions.length ? (
                      reviewActions.map((action) => (
                        <button
                          key={action.status}
                          type="button"
                          onClick={() => void handleReview(action.status)}
                          disabled={reviewBusy !== null}
                          className={cn(
                            "inline-flex min-h-9 items-center gap-2 rounded-full px-4 text-xs font-bold transition hover:-translate-y-0.5 disabled:opacity-55",
                            action.status === "CANCELLED"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-300/10 dark:text-rose-200"
                              : "bg-emerald-700 text-white",
                          )}
                        >
                          {reviewBusy === action.status ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : null}
                          {action.label}
                        </button>
                      ))
                    ) : (
                      <span className="rounded-full bg-emerald-950/5 px-3 py-2 text-xs font-semibold opacity-55 dark:bg-white/6">
                        Tidak ada tindakan lanjutan
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="min-h-10 w-full rounded-full border border-emerald-950/10 px-5 text-sm font-semibold dark:border-white/10 sm:w-auto"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={onExport}
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-emerald-700/20 bg-emerald-100 px-5 text-sm font-bold text-emerald-800 dark:bg-emerald-300/10 dark:text-emerald-200 sm:w-auto"
            >
              <Download className="size-4" /> Unduh invoice PDF
            </button>
            {canReview ? (
              <button
                type="button"
                onClick={() => setReviewOpen((current) => !current)}
                aria-expanded={reviewOpen}
                className="min-h-10 w-full rounded-full bg-emerald-700 px-5 text-sm font-bold text-white sm:w-auto"
              >
                {reviewOpen ? "Tutup tinjauan" : "Tinjau booking"}
              </button>
            ) : null}
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}

function ReceptionCheckInPanel({
  item,
  remaining,
  onComplete,
}: {
  item: BookingItem;
  remaining: number;
  onComplete: () => void;
}) {
  const [guestVerified, setGuestVerified] = useState(false);
  const [identityLast4, setIdentityLast4] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "BANK_TRANSFER" | "QRIS" | "E_WALLET"
  >("CASH");
  const [paymentReference, setPaymentReference] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!guestVerified) {
      setError("Konfirmasi identitas tamu sebelum melanjutkan check-in.");
      return;
    }
    if (identityLast4 && !/^[A-Za-z0-9]{4}$/.test(identityLast4)) {
      setError("Empat karakter identitas harus terdiri dari huruf atau angka.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        `/api/admin/bookings/${encodeURIComponent(item.id)}/check-in`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guestVerified: true,
            amountReceived: remaining,
            paymentMethod: remaining > 0 ? paymentMethod : null,
            paymentReference: paymentReference.trim() || null,
            identityLast4: identityLast4.trim() || null,
            notes: notes.trim() || null,
          }),
        },
      );
      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.message || "Check-in belum dapat diproses.");
      }
      onComplete();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Check-in belum dapat diproses.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="min-w-0 overflow-hidden rounded-2xl border border-amber-400/25 bg-amber-50/70 p-4 dark:border-amber-200/12 dark:bg-amber-200/[0.045] sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-300/22 text-amber-800 dark:text-amber-200">
          <DoorOpen className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.15em] text-amber-800 dark:text-amber-200">
            Kontrol kedatangan
          </p>
          <h3 className="mt-1 font-serif text-xl font-semibold sm:text-2xl">
            <span className="sm:whitespace-nowrap">Pelunasan & check-in</span>
          </h3>
          <p className="mt-1 text-xs leading-5 opacity-50">
            Verifikasi tamu dan catat sisa pembayaran dalam satu proses.
          </p>
        </div>
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-950/8 bg-white/55 p-3 text-xs leading-5 dark:border-white/8 dark:bg-white/[0.035]">
        <input
          type="checkbox"
          checked={guestVerified}
          onChange={(event) => setGuestVerified(event.target.checked)}
          className="mt-0.5 size-4 accent-emerald-700"
        />
        <span>
          <strong className="block">Identitas tamu sudah diverifikasi</strong>
          <span className="opacity-48">
            Nama dan data kedatangan sesuai dengan booking.
          </span>
        </span>
      </label>

      <div className="mt-4 grid min-w-0 gap-3 2xl:grid-cols-2">
        <label className="grid min-w-0 gap-1.5 text-[0.65rem] font-bold">
          4 karakter identitas
          <input
            value={identityLast4}
            maxLength={4}
            onChange={(event) =>
              setIdentityLast4(
                event.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase(),
              )
            }
            placeholder="Contoh: 4281"
            className="h-11 w-full min-w-0 rounded-xl border border-emerald-950/10 bg-white/70 px-3 text-sm font-normal uppercase outline-none focus:border-emerald-600/45 dark:border-white/10 dark:bg-white/5"
          />
        </label>
        <label className="grid min-w-0 gap-1.5 text-[0.65rem] font-bold">
          Sisa pelunasan
          <span className="flex h-11 w-full min-w-0 items-center rounded-xl border border-emerald-950/8 bg-emerald-950/[0.035] px-3 text-sm font-bold text-emerald-700 dark:border-white/8 dark:bg-white/[0.035] dark:text-emerald-300">
            {money.format(remaining)}
          </span>
        </label>
        {remaining > 0 ? (
          <>
            <label className="grid min-w-0 gap-1.5 text-[0.65rem] font-bold">
              Metode pelunasan
              <select
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(
                    event.target.value as typeof paymentMethod,
                  )
                }
                className="h-11 w-full min-w-0 rounded-xl border border-emerald-950/10 bg-white/70 px-3 text-sm font-normal outline-none focus:border-emerald-600/45 dark:border-white/10 dark:bg-[#10231d]"
              >
                <option value="CASH">Tunai</option>
                <option value="BANK_TRANSFER">Transfer Bank</option>
                <option value="QRIS">QRIS</option>
                <option value="E_WALLET">E-Wallet</option>
              </select>
            </label>
            <label className="grid min-w-0 gap-1.5 text-[0.65rem] font-bold">
              Referensi pembayaran
              <input
                value={paymentReference}
                onChange={(event) => setPaymentReference(event.target.value)}
                placeholder="Opsional"
                className="h-11 w-full min-w-0 rounded-xl border border-emerald-950/10 bg-white/70 px-3 text-sm font-normal outline-none focus:border-emerald-600/45 dark:border-white/10 dark:bg-white/5"
              />
            </label>
          </>
        ) : (
          <div className="flex min-w-0 items-center gap-2 rounded-xl bg-emerald-500/9 px-3 py-2.5 text-xs font-semibold text-emerald-800 2xl:col-span-2 dark:text-emerald-200">
            <CreditCard className="size-4" />
            Booking sudah lunas, tidak ada pembayaran tambahan.
          </div>
        )}
        <label className="grid min-w-0 gap-1.5 text-[0.65rem] font-bold 2xl:col-span-2">
          Catatan reception
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
            placeholder="Opsional, misalnya nomor kamar atau informasi serah terima"
            className="w-full min-w-0 resize-y rounded-xl border border-emerald-950/10 bg-white/70 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600/45 dark:border-white/10 dark:bg-white/5"
          />
        </label>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-3 rounded-xl border border-rose-500/15 bg-rose-500/8 p-3 text-xs font-semibold text-rose-700 dark:text-rose-200"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-emerald-700 px-5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(4,120,87,0.2)] disabled:opacity-55"
      >
        {saving ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <DoorOpen className="size-4" />
        )}
        {saving
          ? "Memproses check-in..."
          : remaining > 0
            ? "Catat pelunasan & Check-in"
            : "Check-in tamu"}
      </button>
    </form>
  );
}

function getBookingReviewActions(status: BookingStatus) {
  const actions: Partial<
    Record<BookingStatus, Array<{ label: string; status: BookingStatus }>>
  > = {
    PENDING: [
      { label: "Konfirmasi booking", status: "CONFIRMED" },
      { label: "Batalkan", status: "CANCELLED" },
    ],
    CONFIRMED: [{ label: "Batalkan", status: "CANCELLED" }],
  };
  return actions[status] ?? [];
}

function getRemainingAmount(item: BookingItem) {
  if (typeof item.remaining === "number") return Math.max(item.remaining, 0);
  if (item.payment === "PAID") return 0;
  if (item.payment === "PARTIALLY_PAID") {
    return Math.max(item.total - Math.round(item.total * 0.3), 0);
  }
  return item.total;
}

function getPaidAmount(item: BookingItem) {
  if (typeof item.paid === "number") return Math.max(item.paid, 0);
  return Math.max(item.total - getRemainingAmount(item), 0);
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[0.62rem] text-emerald-950/38 dark:text-white/36">
        {label}
      </p>
      <p className="mt-1 break-words text-xs font-bold">{value}</p>
    </div>
  );
}

function PriceRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <span
        className={cn(
          "min-w-0 text-emerald-950/48 dark:text-white/46",
          strong && "font-bold text-emerald-950 dark:text-white",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "shrink-0 text-right font-semibold",
          strong && "text-base text-emerald-700 dark:text-emerald-300",
        )}
      >
        {money.format(value)}
      </span>
    </div>
  );
}

function toInvoiceBooking(item: BookingItem): BookingStoreRecord {
  const codeDate = item.code.match(/VLK-(\d{2})(\d{2})(\d{2})/);
  const checkInDate = codeDate
    ? new Date(
        Number(`20${codeDate[1]}`),
        Number(codeDate[2]) - 1,
        Number(codeDate[3]),
      )
    : new Date();
  const checkOutDate = new Date(checkInDate);
  checkOutDate.setDate(checkOutDate.getDate() + item.nights);
  const subtotal = Math.round(item.total / 1.11);
  const taxTotal = item.total - subtotal;
  const now = new Date().toISOString();
  return {
    id: item.id,
    bookingCode: item.code,
    villaId: item.villa.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    villaName: item.villa,
    status: item.status,
    paymentStatus: item.payment === "PENDING" ? "UNPAID" : item.payment,
    checkIn: formatIsoDate(checkInDate),
    checkOut: formatIsoDate(checkOutDate),
    nights: item.nights,
    guests: item.guests,
    guest: {
      name: item.guest,
      email: item.email,
      phone: item.phone || "-",
    },
    specialRequest: item.specialRequest || null,
    coupon: { code: null, status: "NOT_APPLIED", amount: 0 },
    addOns: [],
    lineItems: [
      {
        code: "VILLA",
        type: "ACCOMMODATION",
        label: `${item.villa} · ${item.nights} malam`,
        amount: subtotal,
      },
      {
        code: "TAX_SERVICE",
        type: "TAX",
        label: "Pajak & layanan",
        amount: taxTotal,
      },
    ],
    availabilityLocks: [],
    amounts: {
      subtotal,
      extraGuestFee: 0,
      addonTotal: 0,
      discountTotal: 0,
      serviceFee: 0,
      taxTotal,
      totalAmount: item.total,
      depositAmount: getPaidAmount(item),
      remainingAmount: getRemainingAmount(item),
      currency: "IDR",
    },
    expiresAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

function toBookingItem(booking: BookingStoreRecord): BookingItem {
  const demoMatch = bookings.find((item) => item.villa === booking.villaName);
  return {
    id: booking.id,
    code: booking.bookingCode,
    guest: booking.bookedBy?.name || booking.guest.name,
    email: booking.bookedBy?.email || booking.guest.email,
    phone: booking.guest.phone,
    specialRequest: booking.specialRequest,
    initials: getInitials(booking.bookedBy?.name || booking.guest.name),
    villa: booking.villaName,
    image:
      demoMatch?.image ||
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=400&q=80",
    checkInIso: booking.checkIn,
    checkOutIso: booking.checkOut,
    checkIn: formatBookingDate(booking.checkIn),
    checkOut: formatBookingDate(booking.checkOut),
    nights: booking.nights,
    guests: booking.guests,
    total: booking.amounts.totalAmount,
    paid: Math.max(
      booking.amounts.totalAmount - booking.amounts.remainingAmount,
      0,
    ),
    remaining: booking.amounts.remainingAmount,
    status: bookingStatusForAdmin(booking.status),
    payment: paymentStatusForAdmin(booking.paymentStatus),
    createdAt: formatBookingTimestamp(booking.createdAt),
  };
}

function bookingStatusForAdmin(status: BookingStoreRecord["status"]): BookingStatus {
  if (status === "CONFIRMED") return "CONFIRMED";
  if (status === "CHECKED_IN") return "CHECKED_IN";
  if (status === "COMPLETED") return "COMPLETED";
  if (status === "CANCELLED" || status === "EXPIRED" || status === "REFUNDED") return "CANCELLED";
  return "PENDING";
}

function paymentStatusForAdmin(status: BookingStoreRecord["paymentStatus"]): PaymentStatus {
  if (status === "PAID") return "PAID";
  if (status === "PARTIALLY_PAID") return "PARTIALLY_PAID";
  if (status === "FAILED") return "FAILED";
  if (status === "REFUNDED") return "REFUNDED";
  return "PENDING";
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "VK"
  );
}

function formatBookingDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatBookingTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function compactRupiah(value: number) {
  if (value === 0) return "Rp 0";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function paymentProvider(status: PaymentStatus) {
  if (status === "PAID") return "MIDTRANS";
  if (status === "PARTIALLY_PAID") return "MANUAL_TRANSFER";
  if (status === "REFUNDED") return "REFUND";
  return "MANUAL_TRANSFER";
}

function createExcelWorkbook(items: BookingItem[]) {
  const headers = [
    "Kode Booking",
    "Nama Tamu",
    "Email",
    "Villa",
    "Check-in",
    "Check-out",
    "Malam",
    "Tamu",
    "Status Booking",
    "Status Pembayaran",
    "Total (IDR)",
    "Dibuat",
  ];
  const rows = items.map((item) => [
    item.code,
    item.guest,
    item.email,
    item.villa,
    item.checkIn,
    item.checkOut,
    item.nights,
    item.guests,
    statusMeta[item.status].label,
    paymentMeta[item.payment].label,
    item.total,
    item.createdAt,
  ]);
  const cell = (value: string | number, header = false) =>
    `<Cell${header ? ' ss:StyleID="Header"' : ""}><Data ss:Type="${typeof value === "number" ? "Number" : "String"}">${escapeXml(String(value))}</Data></Cell>`;
  return `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles><Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#047857" ss:Pattern="Solid"/></Style></Styles>
  <Worksheet ss:Name="Booking"><Table>
    <Row>${headers.map((header) => cell(header, true)).join("")}</Row>
    ${rows.map((row) => `<Row>${row.map((value) => cell(value)).join("")}</Row>`).join("\n")}
  </Table></Worksheet>
</Workbook>`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function Metric({
  label,
  value,
  helper,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  icon: typeof CalendarDays;
  tone: "emerald" | "amber" | "sky" | "rose";
}) {
  const colors = {
    emerald:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200",
    amber:
      "bg-amber-100 text-amber-700 dark:bg-amber-300/10 dark:text-amber-200",
    sky: "bg-sky-100 text-sky-700 dark:bg-sky-300/10 dark:text-sky-200",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-300/10 dark:text-rose-200",
  };
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-emerald-950/8 bg-white/66 p-4 dark:border-white/8 dark:bg-white/[0.045] sm:p-5"
    >
      <div className="flex items-start justify-between">
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
            "grid size-10 place-items-center rounded-xl",
            colors[tone],
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
    </motion.div>
  );
}

function Filter({
  value,
  label,
  options,
  onChange,
}: {
  value: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 appearance-none rounded-xl border border-emerald-950/10 bg-white/72 pl-3 pr-9 text-xs font-semibold outline-none dark:border-white/10 dark:bg-[#12231f]"
      >
        <option disabled value="">
          {label}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 opacity-40" />
    </label>
  );
}

function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const { profile, roleLabel, initials, canAccess } = useAdminSession();
  const visibleNavItems = navItems.filter((item) => canAccess(item.href));
  const content = (mobile = false) => (
    <>
      <Link href="/" className="flex items-center gap-3 px-2 py-2">
        <span className="grid size-10 place-items-center rounded-xl bg-emerald-700 text-sm font-bold text-white">
          V
        </span>
        <span>
          <span className="block font-serif text-xl font-semibold leading-none">
            Villaku
          </span>
          <span className="mt-1 block text-[0.58rem] font-bold uppercase tracking-[0.2em] opacity-40">
            Admin operations
          </span>
        </span>
      </Link>
      <nav
        className="mt-7 space-y-1"
        aria-label={mobile ? "Navigasi admin mobile" : "Navigasi admin"}
      >
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={mobile ? onClose : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-all",
                item.active
                  ? "bg-emerald-700 text-white shadow-[0_10px_24px_rgba(4,120,87,0.18)]"
                  : "text-emerald-950/52 hover:bg-emerald-950/5 hover:text-emerald-950 dark:text-white/48 dark:hover:bg-white/6 dark:hover:text-white",
              )}
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
            {initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">
              {profile.name}
            </span>
            <span className="mt-0.5 block text-[0.65rem] text-white/45">
              {roleLabel}
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
            onClick={onClose}
          >
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="relative flex h-full w-[min(19rem,86vw)] flex-col bg-[#fbfaf5] p-4 shadow-2xl dark:bg-[#081714]"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={onClose}
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
