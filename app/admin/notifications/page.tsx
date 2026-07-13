"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Inbox,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  Moon,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  Star,
  Sun,
  UserRound,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { NotificationBell } from "@/components/notification-bell";
import { useAppNotifications } from "@/components/notification-root";
import { cn } from "@/lib/utils";

type AdminNotificationCategory = "booking" | "payment" | "review" | "guest" | "system";
type AdminNotificationPriority = "urgent" | "attention" | "normal";
type AdminNotificationFilter = "all" | "unread" | "action" | AdminNotificationCategory;

type AdminNotification = {
  id: string;
  title: string;
  description: string;
  source: string;
  time: string;
  category: AdminNotificationCategory;
  priority: AdminNotificationPriority;
  unread: boolean;
  requiresAction: boolean;
  action: string;
  href: string;
};

const initialNotifications: AdminNotification[] = [
  {
    id: "manual-payment-3814",
    title: "Bukti transfer baru menunggu verifikasi",
    description: "Maya Putri mengunggah bukti pembayaran Rp21.312.000 untuk Villa Aruna Cliffside.",
    source: "Booking VLK-260823-1482",
    time: "4 menit lalu",
    category: "payment",
    priority: "urgent",
    unread: true,
    requiresAction: true,
    action: "Verifikasi pembayaran",
    href: "/admin/notifications",
  },
  {
    id: "booking-request-4089",
    title: "Permintaan booking baru masuk",
    description: "Reservasi 5 malam untuk Sagara Beach House, 8 tamu, check-in 2 September 2026.",
    source: "Booking VLK-260902-1519",
    time: "18 menit lalu",
    category: "booking",
    priority: "attention",
    unread: true,
    requiresAction: true,
    action: "Tinjau booking",
    href: "/admin/notifications",
  },
  {
    id: "failed-payment-4002",
    title: "Pembayaran gateway gagal diproses",
    description: "Percobaan pembayaran kartu ditolak. Tamu sudah menerima instruksi untuk mencoba kembali.",
    source: "Booking VLK-260819-1467",
    time: "42 menit lalu",
    category: "payment",
    priority: "attention",
    unread: true,
    requiresAction: true,
    action: "Lihat detail",
    href: "/admin/notifications",
  },
  {
    id: "low-availability-ubud",
    title: "Ketersediaan Ubud menipis untuk akhir pekan",
    description: "Okupansi kawasan Ubud mencapai 92%. Periksa blok kalender dan kesiapan operasional villa.",
    source: "Sistem okupansi",
    time: "1 jam lalu",
    category: "system",
    priority: "attention",
    unread: true,
    requiresAction: false,
    action: "Buka kalender",
    href: "/admin/notifications",
  },
  {
    id: "review-reported-2011",
    title: "Ulasan ditandai untuk moderasi",
    description: "Satu ulasan baru terdeteksi mengandung informasi pribadi dan belum ditayangkan.",
    source: "Moderasi ulasan",
    time: "2 jam lalu",
    category: "review",
    priority: "normal",
    unread: true,
    requiresAction: true,
    action: "Moderasi ulasan",
    href: "/admin/notifications",
  },
  {
    id: "vip-request-993",
    title: "Permintaan khusus dari tamu Emerald",
    description: "Tamu meminta airport transfer dan private chef untuk malam pertama di Nara Jungle Residence.",
    source: "Maya Putri · Emerald Member",
    time: "3 jam lalu",
    category: "guest",
    priority: "normal",
    unread: false,
    requiresAction: true,
    action: "Hubungi tamu",
    href: "/admin/notifications",
  },
  {
    id: "review-published-1944",
    title: "Ulasan bintang lima baru dipublikasikan",
    description: "Sagara Beach House menerima ulasan 5.0 untuk layanan concierge dan kebersihan.",
    source: "Review #RV-1944",
    time: "Kemarin, 20.18",
    category: "review",
    priority: "normal",
    unread: false,
    requiresAction: false,
    action: "Lihat ulasan",
    href: "/admin/notifications",
  },
  {
    id: "backup-complete-771",
    title: "Sinkronisasi inventori berhasil",
    description: "Harga musiman dan ketersediaan 24 villa telah diperbarui tanpa konflik.",
    source: "System health",
    time: "Kemarin, 02.00",
    category: "system",
    priority: "normal",
    unread: false,
    requiresAction: false,
    action: "Lihat log",
    href: "/admin/notifications",
  },
];

const categoryMeta: Record<
  AdminNotificationCategory,
  { label: string; icon: typeof Bell; className: string }
> = {
  booking: { label: "Booking", icon: CalendarDays, className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-300/12 dark:text-emerald-200" },
  payment: { label: "Pembayaran", icon: CreditCard, className: "bg-amber-100 text-amber-700 dark:bg-amber-300/12 dark:text-amber-200" },
  review: { label: "Ulasan", icon: Star, className: "bg-sky-100 text-sky-700 dark:bg-sky-300/12 dark:text-sky-200" },
  guest: { label: "Tamu", icon: Users, className: "bg-violet-100 text-violet-700 dark:bg-violet-300/12 dark:text-violet-200" },
  system: { label: "Sistem", icon: ShieldAlert, className: "bg-rose-100 text-rose-700 dark:bg-rose-300/12 dark:text-rose-200" },
};

const navItems = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Booking", icon: CalendarDays },
  { label: "Villa", icon: Building2 },
  { label: "Pembayaran", icon: CircleDollarSign },
  { label: "Customer", icon: Users },
  { label: "Ulasan", icon: MessageSquareText },
  { label: "Notifikasi", icon: Bell, active: true },
  { label: "Laporan", icon: BarChart3 },
  { label: "Pengaturan", icon: Settings },
];

const filters: Array<{ id: AdminNotificationFilter; label: string }> = [
  { id: "all", label: "Semua" },
  { id: "unread", label: "Belum dibaca" },
  { id: "action", label: "Perlu tindakan" },
  { id: "booking", label: "Booking" },
  { id: "payment", label: "Pembayaran" },
  { id: "system", label: "Sistem" },
];

export default function AdminNotificationHistoryPage() {
  const shouldReduceMotion = useReducedMotion();
  const { notify } = useAppNotifications();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filter, setFilter] = useState<AdminNotificationFilter>("all");
  const [query, setQuery] = useState("");
  const [notifications, setNotifications] = useState(initialNotifications);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("villaku-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme = savedTheme === "dark" || (!savedTheme && prefersDark) ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }, []);

  const unreadCount = notifications.filter((notification) => notification.unread).length;
  const actionCount = notifications.filter((notification) => notification.requiresAction).length;
  const urgentCount = notifications.filter((notification) => notification.priority === "urgent").length;

  const visibleNotifications = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("id-ID");
    return notifications.filter((notification) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "unread" && notification.unread) ||
        (filter === "action" && notification.requiresAction) ||
        notification.category === filter;
      const matchesQuery =
        !normalizedQuery ||
        `${notification.title} ${notification.description} ${notification.source}`
          .toLocaleLowerCase("id-ID")
          .includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [filter, notifications, query]);

  const allVisibleSelected =
    visibleNotifications.length > 0 &&
    visibleNotifications.every((notification) => selected.includes(notification.id));

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      window.localStorage.setItem("villaku-theme", next);
      return next;
    });
  };

  const toggleSelected = (id: string) => {
    setSelected((items) =>
      items.includes(id) ? items.filter((item) => item !== id) : [...items, id],
    );
  };

  const toggleAllVisible = () => {
    const visibleIds = visibleNotifications.map((notification) => notification.id);
    setSelected((items) =>
      allVisibleSelected
        ? items.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...items, ...visibleIds])),
    );
  };

  const markRead = (ids: string[]) => {
    if (!ids.length) return;
    setNotifications((items) =>
      items.map((notification) =>
        ids.includes(notification.id) ? { ...notification, unread: false } : notification,
      ),
    );
    setSelected([]);
    notify({
      title: `${ids.length} notifikasi ditandai dibaca`,
      variant: "success",
    });
  };

  const dismissSelected = () => {
    if (!selected.length) return;
    setNotifications((items) => items.filter((notification) => !selected.includes(notification.id)));
    notify({
      title: `${selected.length} notifikasi diarsipkan`,
      description: "Notifikasi tidak lagi tampil di kotak masuk utama.",
      variant: "success",
    });
    setSelected([]);
  };

  return (
    <main className="min-h-screen bg-[#f2f4f0] text-foreground dark:bg-[#06100e]">
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-emerald-950/8 bg-[#fbfaf5] p-4 dark:border-white/8 dark:bg-[#081714] lg:flex">
          <Link href="/" className="flex items-center gap-3 px-2 py-2" aria-label="Beranda Villaku">
            <span className="grid size-10 place-items-center rounded-xl bg-emerald-700 text-sm font-bold text-white shadow-[0_10px_24px_rgba(4,120,87,0.25)]">V</span>
            <span>
              <span className="block font-serif text-xl font-semibold leading-none">Villaku</span>
              <span className="mt-1 block text-[0.58rem] font-bold uppercase tracking-[0.2em] text-emerald-950/38 dark:text-white/38">Admin operations</span>
            </span>
          </Link>

          <nav className="mt-7 space-y-1" aria-label="Navigasi admin">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  type="button"
                  key={item.label}
                  className={cn(
                    "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-all",
                    item.active
                      ? "bg-emerald-700 text-white shadow-[0_10px_24px_rgba(4,120,87,0.18)]"
                      : "text-emerald-950/52 hover:bg-emerald-950/5 hover:text-emerald-950 dark:text-white/48 dark:hover:bg-white/6 dark:hover:text-white",
                  )}
                  aria-current={item.active ? "page" : undefined}
                >
                  <Icon className="size-4" />
                  <span className="flex-1">{item.label}</span>
                  {item.active && unreadCount > 0 ? (
                    <span className="rounded-full bg-white/16 px-2 py-0.5 text-[0.62rem]">{unreadCount}</span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto rounded-2xl bg-emerald-950 p-4 text-white">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-white/10 text-xs font-bold">AP</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">Ayu Prameswari</span>
                <span className="mt-0.5 block text-[0.65rem] text-white/45">Super Admin</span>
              </span>
              <ChevronDown className="size-4 text-white/38" />
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 lg:pl-64">
          <header className="sticky top-0 z-30 border-b border-emerald-950/8 bg-[#f2f4f0]/82 px-4 py-3 backdrop-blur-2xl dark:border-white/8 dark:bg-[#06100e]/84 sm:px-6 lg:px-8">
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
                  <p className="font-serif text-lg font-semibold leading-none sm:text-xl">Pusat notifikasi</p>
                  <p className="mt-1 hidden text-xs text-emerald-950/42 dark:text-white/40 sm:block">Pantau aktivitas operasional Villaku</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="grid size-10 place-items-center rounded-full border border-emerald-950/10 bg-white/70 transition-all hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/6"
                  aria-label="Ubah tema gelap atau terang"
                >
                  {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                </button>
                <NotificationBell
                  unreadCount={unreadCount}
                  onClick={() => setFilter("unread")}
                  expanded={filter === "unread"}
                  controls="admin-notification-history"
                  hasPopup={false}
                  label="Tampilkan notifikasi admin belum dibaca"
                  className="bg-white/70 dark:bg-white/6"
                />
                <span className="ml-1 grid size-10 place-items-center rounded-full bg-emerald-950 text-xs font-bold text-white ring-2 ring-amber-300/50 dark:bg-emerald-700">AP</span>
              </div>
            </div>
          </header>

          <AnimatePresence>
            {mobileMenuOpen ? (
              <motion.div
                className="fixed inset-0 z-50 bg-emerald-950/48 backdrop-blur-sm lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <motion.aside
                  initial={shouldReduceMotion ? false : { x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={shouldReduceMotion ? undefined : { x: "-100%" }}
                  transition={{ type: "spring", stiffness: 320, damping: 32 }}
                  className="h-full w-[min(19rem,86vw)] bg-[#fbfaf5] p-4 shadow-2xl dark:bg-[#081714]"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-2 py-2">
                    <p className="font-serif text-xl font-semibold">Admin menu</p>
                    <button type="button" onClick={() => setMobileMenuOpen(false)} className="grid size-9 place-items-center rounded-full bg-emerald-950/5 dark:bg-white/7" aria-label="Tutup navigasi admin"><X className="size-4" /></button>
                  </div>
                  <nav className="mt-5 space-y-1" aria-label="Navigasi admin mobile">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button type="button" key={item.label} className={cn("flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold", item.active ? "bg-emerald-700 text-white" : "text-emerald-950/54 dark:text-white/52")}>
                          <Icon className="size-4" /> {item.label}
                        </button>
                      );
                    })}
                  </nav>
                </motion.aside>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="mx-auto max-w-[1440px] px-4 pb-14 pt-7 sm:px-6 lg:px-8 lg:pt-10">
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 18, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"
            >
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200"><Sparkles className="size-3.5" /> Live operations</span>
                <h1 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">Notifikasi admin</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-950/48 dark:text-white/46">Prioritaskan pembayaran, booking, dan kebutuhan tamu yang memerlukan respons tim.</p>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <MetricCard label="Belum dibaca" value={unreadCount} tone="emerald" />
                <MetricCard label="Perlu tindakan" value={actionCount} tone="amber" />
                <MetricCard label="Prioritas tinggi" value={urgentCount} tone="rose" />
              </div>
            </motion.div>

            <section className="mt-7 overflow-hidden rounded-[1.7rem] border border-emerald-950/8 bg-white/68 shadow-[0_20px_70px_rgba(4,34,28,0.055)] backdrop-blur-xl dark:border-white/8 dark:bg-white/[0.045]" aria-labelledby="admin-notification-title">
              <div className="border-b border-emerald-950/8 p-4 dark:border-white/8 sm:p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="relative w-full lg:max-w-md">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-emerald-950/35 dark:text-white/35" />
                    <input
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Cari booking, tamu, atau aktivitas..."
                      className="h-11 w-full rounded-xl border border-emerald-950/10 bg-white/72 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-600/35 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/6"
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Filter notifikasi admin">
                    {filters.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        role="tab"
                        aria-selected={filter === item.id}
                        onClick={() => setFilter(item.id)}
                        className={cn("min-h-10 shrink-0 rounded-full px-4 text-xs font-bold transition-all", filter === item.id ? "bg-emerald-700 text-white" : "bg-emerald-950/5 text-emerald-950/52 hover:bg-emerald-950/8 dark:bg-white/6 dark:text-white/50 dark:hover:bg-white/9")}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex min-h-14 flex-wrap items-center gap-3 border-b border-emerald-950/8 px-4 py-2.5 dark:border-white/8 sm:px-5">
                <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-emerald-950/48 dark:text-white/46">
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} className="size-4 rounded border-emerald-950/20 accent-emerald-700" />
                  Pilih semua
                </label>
                <span className="h-5 w-px bg-emerald-950/8 dark:bg-white/8" />
                <AnimatePresence initial={false}>
                  {selected.length ? (
                    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{selected.length} dipilih</span>
                      <button type="button" onClick={() => markRead(selected)} className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-emerald-100 px-3 text-xs font-semibold text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200"><CheckCheck className="size-3.5" /> Tandai dibaca</button>
                      <button type="button" onClick={dismissSelected} className="min-h-8 rounded-full bg-emerald-950/5 px-3 text-xs font-semibold text-emerald-950/54 dark:bg-white/6 dark:text-white/52">Arsipkan</button>
                    </motion.div>
                  ) : (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-emerald-950/36 dark:text-white/34">{visibleNotifications.length} aktivitas ditampilkan</motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div id="admin-notification-history" role="tabpanel">
                <AnimatePresence mode="wait">
                  {visibleNotifications.length ? (
                    <motion.div key={`${filter}-${query}`} initial={shouldReduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {visibleNotifications.map((notification, index) => (
                        <AdminNotificationRow
                          key={notification.id}
                          notification={notification}
                          selected={selected.includes(notification.id)}
                          onSelect={() => toggleSelected(notification.id)}
                          onRead={() => markRead([notification.id])}
                          delay={shouldReduceMotion ? 0 : index * 0.035}
                        />
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div key="empty" initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="grid min-h-96 place-items-center px-5 text-center">
                      <div>
                        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200"><Inbox className="size-6" /></span>
                        <h2 id="admin-notification-title" className="mt-4 font-serif text-2xl font-semibold">Tidak ada aktivitas ditemukan</h2>
                        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-emerald-950/46 dark:text-white/44">Ubah filter atau kata kunci untuk melihat aktivitas operasional lainnya.</p>
                        <button type="button" onClick={() => { setFilter("all"); setQuery(""); }} className="mt-5 rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white">Reset filter</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: number; tone: "emerald" | "amber" | "rose" }) {
  const tones = {
    emerald: "border-emerald-700/12 bg-emerald-100/62 text-emerald-800 dark:bg-emerald-300/8 dark:text-emerald-200",
    amber: "border-amber-600/12 bg-amber-100/62 text-amber-800 dark:bg-amber-300/8 dark:text-amber-200",
    rose: "border-rose-600/12 bg-rose-100/62 text-rose-800 dark:bg-rose-300/8 dark:text-rose-200",
  };
  return (
    <div className={cn("min-w-0 rounded-2xl border p-3 sm:min-w-32 sm:p-4", tones[tone])}>
      <p className="text-2xl font-semibold sm:text-3xl">{value}</p>
      <p className="mt-1 truncate text-[0.62rem] font-bold uppercase tracking-[0.1em] opacity-60 sm:text-[0.65rem]">{label}</p>
    </div>
  );
}

function AdminNotificationRow({ notification, selected, onSelect, onRead, delay }: { notification: AdminNotification; selected: boolean; onSelect: () => void; onRead: () => void; delay: number }) {
  const meta = categoryMeta[notification.category];
  const Icon = meta.icon;
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay }}
      className={cn("group grid gap-3 border-b border-emerald-950/7 p-4 transition-colors last:border-b-0 hover:bg-emerald-950/[0.025] dark:border-white/7 dark:hover:bg-white/[0.025] sm:grid-cols-[auto_auto_minmax(0,1fr)_auto] sm:items-start sm:gap-4 sm:p-5", selected && "bg-emerald-50 dark:bg-emerald-300/[0.045]", notification.unread && "bg-white/50 dark:bg-white/[0.018]")}
    >
      <input type="checkbox" checked={selected} onChange={onSelect} className="mt-1 size-4 rounded border-emerald-950/20 accent-emerald-700" aria-label={`Pilih ${notification.title}`} />
      <span className={cn("grid size-11 place-items-center rounded-2xl", meta.className)}><Icon className="size-[1.1rem]" /></span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">{meta.label}</span>
          {notification.priority === "urgent" ? <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.1em] text-rose-700 dark:bg-rose-300/10 dark:text-rose-200"><AlertTriangle className="size-3" /> Urgent</span> : null}
          {notification.requiresAction ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.1em] text-amber-700 dark:bg-amber-300/10 dark:text-amber-200">Perlu tindakan</span> : null}
          {notification.unread ? <span className="size-2 rounded-full bg-emerald-500" aria-label="Belum dibaca" /> : null}
        </div>
        <h2 className={cn("mt-1.5 text-sm leading-5 text-emerald-950 dark:text-white sm:text-base", notification.unread ? "font-bold" : "font-semibold")}>{notification.title}</h2>
        <p className="mt-1.5 max-w-3xl text-sm leading-6 text-emerald-950/48 dark:text-white/44">{notification.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-emerald-950/36 dark:text-white/34">
          <span>{notification.source}</span>
          <span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" /> {notification.time}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:justify-end">
        {notification.unread ? <button type="button" onClick={onRead} className="grid size-9 place-items-center rounded-full bg-emerald-950/5 text-emerald-700 transition hover:bg-emerald-100 dark:bg-white/6 dark:text-emerald-200" aria-label={`Tandai ${notification.title} telah dibaca`}><Check className="size-4" /></button> : null}
        <Link href={notification.href} className="inline-flex min-h-9 items-center gap-1 rounded-full border border-emerald-950/10 bg-white/70 px-3 text-xs font-bold text-emerald-800 transition-all hover:border-emerald-700/20 hover:bg-white dark:border-white/10 dark:bg-white/6 dark:text-white dark:hover:bg-white/10">{notification.action} <ChevronRight className="size-3.5" /></Link>
      </div>
    </motion.article>
  );
}
