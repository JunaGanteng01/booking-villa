"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  BellRing,
  CalendarCheck2,
  Check,
  CheckCheck,
  ChevronRight,
  CircleAlert,
  Clock3,
  CreditCard,
  Gift,
  Inbox,
  Moon,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { NotificationBell } from "@/components/notification-bell";
import { useAppNotifications } from "@/components/notification-root";
import { cn } from "@/lib/utils";

type NotificationCategory = "booking" | "payment" | "stay" | "reward" | "security";
type NotificationFilter = "all" | "unread" | NotificationCategory;

type GuestNotification = {
  id: string;
  title: string;
  description: string;
  time: string;
  group: "Hari ini" | "Kemarin" | "Minggu ini";
  category: NotificationCategory;
  unread: boolean;
  href?: string;
  action?: string;
};

const initialNotifications: GuestNotification[] = [
  {
    id: "reservation-confirmed",
    title: "Reservasi Anda telah dikonfirmasi",
    description: "Villa Aruna Cliffside siap menyambut 6 tamu pada 23 Agustus 2026.",
    time: "10 menit lalu",
    group: "Hari ini",
    category: "booking",
    unread: true,
    href: "/dashboard",
    action: "Lihat reservasi",
  },
  {
    id: "payment-received",
    title: "Pembayaran berhasil diterima",
    description: "Pembayaran Rp21.312.000 untuk booking VLK-260823-1482 telah terverifikasi.",
    time: "2 jam lalu",
    group: "Hari ini",
    category: "payment",
    unread: true,
    href: "/payment/status?bookingId=VLK-260823-1482",
    action: "Lihat pembayaran",
  },
  {
    id: "arrival-guide",
    title: "Panduan kedatangan tersedia",
    description: "Baca detail check-in, rute menuju villa, dan kontak host sebelum perjalanan Anda.",
    time: "Kemarin, 19.20",
    group: "Kemarin",
    category: "stay",
    unread: true,
    href: "/dashboard",
    action: "Buka panduan",
  },
  {
    id: "gold-progress",
    title: "Selangkah lagi menuju Gold Circle",
    description: "Selesaikan satu reservasi lagi untuk membuka benefit eksklusif Gold Circle.",
    time: "Kemarin, 09.45",
    group: "Kemarin",
    category: "reward",
    unread: false,
    href: "/villas",
    action: "Jelajahi villa",
  },
  {
    id: "review-reminder",
    title: "Bagaimana pengalaman Anda di Nara?",
    description: "Bagikan cerita menginap Anda dan bantu tamu lain menemukan stay terbaiknya.",
    time: "10 Jul, 14.30",
    group: "Minggu ini",
    category: "stay",
    unread: false,
    href: "/reviews/new?bookingId=VLK-260214-1038",
    action: "Tulis ulasan",
  },
  {
    id: "summer-benefit",
    title: "Private Escape benefit untuk Anda",
    description: "Nikmati complimentary floating breakfast untuk reservasi pilihan hingga akhir Juli.",
    time: "9 Jul, 11.15",
    group: "Minggu ini",
    category: "reward",
    unread: false,
    href: "/villas",
    action: "Lihat penawaran",
  },
  {
    id: "secure-account",
    title: "Login baru berhasil diverifikasi",
    description: "Kami mencatat login dari perangkat Windows di Singapura. Tidak mengenali aktivitas ini? Hubungi concierge.",
    time: "8 Jul, 21.08",
    group: "Minggu ini",
    category: "security",
    unread: false,
    href: "/dashboard",
    action: "Kelola akun",
  },
];

const categoryMeta: Record<
  NotificationCategory,
  { label: string; icon: typeof CalendarCheck2; iconClass: string; surfaceClass: string }
> = {
  booking: {
    label: "Reservasi",
    icon: CalendarCheck2,
    iconClass: "text-emerald-700 dark:text-emerald-200",
    surfaceClass: "bg-emerald-100 dark:bg-emerald-400/14",
  },
  payment: {
    label: "Pembayaran",
    icon: CreditCard,
    iconClass: "text-amber-700 dark:text-amber-200",
    surfaceClass: "bg-amber-100 dark:bg-amber-300/14",
  },
  stay: {
    label: "Perjalanan",
    icon: Star,
    iconClass: "text-sky-700 dark:text-sky-200",
    surfaceClass: "bg-sky-100 dark:bg-sky-300/14",
  },
  reward: {
    label: "Benefit",
    icon: Gift,
    iconClass: "text-rose-700 dark:text-rose-200",
    surfaceClass: "bg-rose-100 dark:bg-rose-300/14",
  },
  security: {
    label: "Keamanan",
    icon: ShieldCheck,
    iconClass: "text-violet-700 dark:text-violet-200",
    surfaceClass: "bg-violet-100 dark:bg-violet-300/14",
  },
};

const filters: Array<{ id: NotificationFilter; label: string }> = [
  { id: "all", label: "Semua" },
  { id: "unread", label: "Belum dibaca" },
  { id: "booking", label: "Reservasi" },
  { id: "payment", label: "Pembayaran" },
  { id: "stay", label: "Perjalanan" },
  { id: "reward", label: "Benefit" },
];

const groups: GuestNotification["group"][] = ["Hari ini", "Kemarin", "Minggu ini"];

export default function NotificationHistoryPage() {
  const shouldReduceMotion = useReducedMotion();
  const { notify } = useAppNotifications();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [notifications, setNotifications] = useState(initialNotifications);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("villaku-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme = savedTheme === "dark" || (!savedTheme && prefersDark) ? "dark" : "light";

    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }, []);

  const unreadCount = notifications.filter((notification) => notification.unread).length;
  const visibleNotifications = useMemo(
    () =>
      notifications.filter((notification) => {
        if (filter === "all") return true;
        if (filter === "unread") return notification.unread;
        return notification.category === filter;
      }),
    [filter, notifications],
  );

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      window.localStorage.setItem("villaku-theme", next);
      return next;
    });
  };

  const markAsRead = (id: string) => {
    setNotifications((items) =>
      items.map((notification) =>
        notification.id === id ? { ...notification, unread: false } : notification,
      ),
    );
  };

  const markAllAsRead = () => {
    if (!unreadCount) return;
    setNotifications((items) => items.map((notification) => ({ ...notification, unread: false })));
    notify({
      title: "Semua notifikasi telah dibaca",
      description: "Kotak masuk Anda sekarang sudah rapi.",
      variant: "success",
    });
  };

  const selectUnread = () => setFilter("unread");

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_14%_4%,rgba(247,217,140,0.3),transparent_27rem),radial-gradient(circle_at_90%_7%,rgba(4,120,87,0.18),transparent_31rem)]"
      />
      <motion.div
        aria-hidden
        animate={shouldReduceMotion ? undefined : { y: [0, -18, 0], rotate: [0, 4, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none fixed -right-20 top-48 size-72 rounded-full border border-amber-500/10 bg-amber-300/5 blur-sm"
      />

      <header className="sticky top-0 z-40 border-b border-emerald-950/8 bg-[#f5f0e8]/80 px-4 py-3 backdrop-blur-2xl dark:border-white/8 dark:bg-[#071211]/82 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <Link
              href="/dashboard"
              className="grid size-10 shrink-0 place-items-center rounded-full border border-emerald-950/10 bg-white/62 text-emerald-950 transition-all hover:-translate-x-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/20 dark:border-white/10 dark:bg-white/6 dark:text-white dark:hover:bg-white/10"
              aria-label="Kembali ke dashboard"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <Link href="/" className="group flex min-w-0 items-center gap-3" aria-label="Beranda Villaku">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-700 text-sm font-bold text-white shadow-[0_10px_26px_rgba(4,120,87,0.25)] transition-transform group-hover:rotate-6 group-hover:scale-105">
                V
              </span>
              <span className="hidden sm:block">
                <span className="block font-serif text-xl font-semibold leading-none text-emerald-950 dark:text-white">
                  Villaku
                </span>
                <span className="mt-1 block text-[0.6rem] uppercase tracking-[0.24em] text-emerald-950/44 dark:text-white/42">
                  Guest circle
                </span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="grid size-10 place-items-center rounded-full border border-emerald-950/10 bg-white/62 transition-all hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/20 dark:border-white/10 dark:bg-white/6 dark:hover:bg-white/10"
              onClick={toggleTheme}
              aria-label="Ubah tema gelap atau terang"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <NotificationBell
              unreadCount={unreadCount}
              onClick={selectUnread}
              expanded={filter === "unread"}
              controls="notification-history"
              hasPopup={false}
              label="Tampilkan notifikasi belum dibaca"
            />
            <span className="ml-1 grid size-10 place-items-center rounded-full bg-emerald-950 text-xs font-bold text-white ring-2 ring-amber-300/60 dark:bg-emerald-700">
              MP
            </span>
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        <motion.section
          initial={shouldReduceMotion ? false : { opacity: 0, y: 22, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden rounded-[2rem] bg-emerald-950 px-5 py-7 text-white shadow-[0_28px_90px_rgba(4,34,28,0.2)] sm:px-8 sm:py-9 lg:px-10"
        >
          <div className="relative z-10 grid gap-7 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-amber-200">
                <Sparkles className="size-3.5" /> Guest updates
              </span>
              <h1 className="mt-5 max-w-2xl font-serif text-4xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-5xl">
                Semua kabar perjalanan, dalam satu tempat.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/58 sm:text-base">
                Pantau konfirmasi booking, pembayaran, panduan kedatangan, dan benefit eksklusif Anda.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="min-w-28 rounded-2xl border border-white/10 bg-white/7 p-4 backdrop-blur-xl">
                <p className="text-3xl font-semibold text-amber-200">{unreadCount}</p>
                <p className="mt-1 text-xs text-white/48">Belum dibaca</p>
              </div>
              <div className="min-w-28 rounded-2xl border border-white/10 bg-white/7 p-4 backdrop-blur-xl">
                <p className="text-3xl font-semibold text-white">{notifications.length}</p>
                <p className="mt-1 text-xs text-white/48">Total update</p>
              </div>
            </div>
          </div>
          <div aria-hidden className="absolute -right-24 -top-24 size-64 rounded-full bg-emerald-400/12 blur-3xl" />
          <div aria-hidden className="absolute -bottom-28 left-1/3 size-56 rounded-full bg-amber-300/10 blur-3xl" />
        </motion.section>

        <section className="mt-7" aria-labelledby="notification-list-title">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                Kotak masuk
              </p>
              <h2 id="notification-list-title" className="mt-1 font-serif text-2xl font-semibold sm:text-3xl">
                Riwayat notifikasi
              </h2>
            </div>
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={!unreadCount}
              className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-full border border-emerald-950/10 bg-white/62 px-4 text-sm font-semibold text-emerald-900 transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/20 disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:bg-white/6 dark:text-white dark:hover:bg-white/10 sm:self-auto"
            >
              <CheckCheck className="size-4" />
              Tandai semua dibaca
            </button>
          </div>

          <div
            className="mt-5 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Filter notifikasi"
          >
            {filters.map((item) => {
              const active = filter === item.id;
              const count =
                item.id === "unread"
                  ? unreadCount
                  : item.id === "all"
                    ? notifications.length
                    : notifications.filter((notification) => notification.category === item.id).length;

              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(item.id)}
                  className={cn(
                    "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/20",
                    active
                      ? "bg-emerald-700 text-white shadow-[0_10px_24px_rgba(4,120,87,0.2)]"
                      : "border border-emerald-950/10 bg-white/54 text-emerald-950/58 hover:bg-white hover:text-emerald-950 dark:border-white/10 dark:bg-white/5 dark:text-white/54 dark:hover:bg-white/9 dark:hover:text-white",
                  )}
                >
                  {item.label}
                  <span
                    className={cn(
                      "grid min-w-5 place-items-center rounded-full px-1.5 py-0.5 text-[0.62rem]",
                      active ? "bg-white/16 text-white" : "bg-emerald-950/6 dark:bg-white/8",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div id="notification-history" className="mt-5" role="tabpanel">
            <AnimatePresence mode="wait">
              {visibleNotifications.length ? (
                <motion.div
                  key={filter}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.28 }}
                  className="space-y-7"
                >
                  {groups.map((group) => {
                    const groupNotifications = visibleNotifications.filter(
                      (notification) => notification.group === group,
                    );
                    if (!groupNotifications.length) return null;

                    return (
                      <div key={group}>
                        <div className="mb-3 flex items-center gap-3">
                          <h3 className="shrink-0 text-xs font-bold uppercase tracking-[0.16em] text-emerald-950/42 dark:text-white/40">
                            {group}
                          </h3>
                          <span className="h-px flex-1 bg-emerald-950/8 dark:bg-white/8" />
                        </div>
                        <motion.div
                          initial="hidden"
                          animate="visible"
                          variants={{
                            hidden: {},
                            visible: { transition: { staggerChildren: shouldReduceMotion ? 0 : 0.06 } },
                          }}
                          className="space-y-3"
                        >
                          {groupNotifications.map((notification) => (
                            <NotificationItem
                              key={notification.id}
                              notification={notification}
                              shouldReduceMotion={Boolean(shouldReduceMotion)}
                              onRead={() => markAsRead(notification.id)}
                            />
                          ))}
                        </motion.div>
                      </div>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div
                  key={`empty-${filter}`}
                  initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="grid min-h-80 place-items-center rounded-[2rem] border border-dashed border-emerald-950/14 bg-white/38 px-6 text-center dark:border-white/12 dark:bg-white/[0.03]"
                >
                  <div>
                    <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-400/12 dark:text-emerald-200">
                      <Inbox className="size-6" />
                    </span>
                    <h3 className="mt-4 font-serif text-2xl font-semibold">Semua sudah terbaca</h3>
                    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-emerald-950/50 dark:text-white/48">
                      Tidak ada notifikasi yang cocok dengan filter ini. Kabar perjalanan terbaru akan muncul di sini.
                    </p>
                    <button
                      type="button"
                      onClick={() => setFilter("all")}
                      className="mt-5 rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                    >
                      Lihat semua notifikasi
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        <aside className="mt-8 flex flex-col gap-4 rounded-[1.6rem] border border-amber-600/12 bg-amber-50/62 p-5 dark:border-amber-200/10 dark:bg-amber-200/[0.04] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-amber-200/60 text-amber-800 dark:bg-amber-300/12 dark:text-amber-200">
              <CircleAlert className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">Butuh bantuan dengan reservasi?</p>
              <p className="mt-1 text-xs leading-5 text-emerald-950/48 dark:text-white/46">
                Concierge Villaku siap membantu setiap hari, 07.00–23.00 WITA.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-emerald-950/10 bg-white/70 px-4 text-sm font-semibold text-emerald-900 transition-all hover:bg-white dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/11"
          >
            Hubungi concierge <ChevronRight className="size-4" />
          </Link>
        </aside>
      </div>
    </main>
  );
}

function NotificationItem({
  notification,
  shouldReduceMotion,
  onRead,
}: {
  notification: GuestNotification;
  shouldReduceMotion: boolean;
  onRead: () => void;
}) {
  const meta = categoryMeta[notification.category];
  const Icon = meta.icon;

  const content = (
    <>
      <span
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-2xl transition-transform duration-300 group-hover:scale-105",
          meta.surfaceClass,
          meta.iconClass,
        )}
      >
        <Icon className="size-[1.1rem]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
            {meta.label}
          </span>
          {notification.unread ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/16 px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-200">
              <span className="size-1.5 rounded-full bg-amber-500" /> Baru
            </span>
          ) : null}
        </span>
        <span className="mt-1.5 block font-serif text-lg font-semibold leading-tight text-emerald-950 dark:text-white sm:text-xl">
          {notification.title}
        </span>
        <span className="mt-2 block max-w-3xl text-sm leading-6 text-emerald-950/50 dark:text-white/48">
          {notification.description}
        </span>
        <span className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-950/38 dark:text-white/36">
            <Clock3 className="size-3.5" /> {notification.time}
          </span>
          {notification.action ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 transition-colors group-hover:text-emerald-600 dark:text-emerald-300">
              {notification.action} <ChevronRight className="size-3.5" />
            </span>
          ) : null}
        </span>
      </span>
      <span className="hidden size-8 shrink-0 place-items-center rounded-full text-emerald-700 sm:grid">
        {notification.unread ? <BellRing className="size-4" /> : <Check className="size-4 opacity-40" />}
      </span>
    </>
  );

  const className = cn(
    "group relative flex w-full gap-3 overflow-hidden rounded-[1.45rem] border p-4 text-left shadow-[0_12px_42px_rgba(4,34,28,0.035)] transition-[transform,background-color,border-color,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_18px_52px_rgba(4,34,28,0.08)] sm:gap-4 sm:p-5",
    notification.unread
      ? "border-emerald-700/18 bg-white/84 dark:border-emerald-300/15 dark:bg-white/[0.075]"
      : "border-emerald-950/8 bg-white/45 dark:border-white/8 dark:bg-white/[0.035]",
  );

  return (
    <motion.article
      variants={{
        hidden: { opacity: 0, y: 18, filter: "blur(7px)" },
        visible: { opacity: 1, y: 0, filter: "blur(0px)" },
      }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
      layout={!shouldReduceMotion}
    >
      {notification.href ? (
        <Link href={notification.href} onClick={onRead} className={className}>
          {notification.unread ? (
            <span aria-hidden className="absolute inset-y-5 left-0 w-1 rounded-r-full bg-amber-400" />
          ) : null}
          {content}
        </Link>
      ) : (
        <button type="button" onClick={onRead} className={className}>
          {content}
        </button>
      )}
    </motion.article>
  );
}
