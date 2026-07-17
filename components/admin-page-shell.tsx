"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Moon,
  Settings,
  Sun,
  UserRound,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAdminNotificationCount } from "@/components/use-admin-notification-count";
import { useAdminSession } from "@/components/use-admin-session";
import { cn } from "@/lib/utils";

const items = [
  { label: "Overview", icon: LayoutDashboard, href: "/admin" },
  { label: "Booking", icon: CalendarDays, href: "/admin/bookings" },
  { label: "Villa", icon: Building2, href: "/admin/villas" },
  { label: "Pembayaran", icon: CircleDollarSign, href: "/admin/payments" },
  { label: "Customer", icon: Users, href: "/admin/customers" },
  { label: "Ulasan", icon: MessageSquareText, href: "/admin/reviews" },
  { label: "Notifikasi", icon: Bell, href: "/admin/notifications" },
  { label: "Laporan", icon: BarChart3, href: "/admin/reports" },
  { label: "Pengguna", icon: UserRound, href: "/admin/users" },
  { label: "Pengaturan", icon: Settings, href: "/admin/settings" },
];

export function AdminPageShell({
  title,
  subtitle,
  active,
  children,
  actions,
}: {
  title: string;
  subtitle: string;
  active: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { profile, roleLabel, initials, canAccess, home, logout } =
    useAdminSession();
  const unreadCount = useAdminNotificationCount(profile.role, profile.email);

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

  const visibleItems = items.filter((item) => canAccess(item.href));

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    window.localStorage.setItem("villaku-theme", next);
  };

  const navigation = (mobile = false) => (
    <>
      <Link href="/" className="flex items-center gap-3 px-2 py-2">
        <span className="grid size-10 place-items-center rounded-xl bg-emerald-700 text-sm font-bold text-white shadow-[0_10px_24px_rgba(4,120,87,0.22)]">
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
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const selected = item.label === active;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={mobile ? () => setMobileOpen(false) : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-all",
                selected
                  ? "bg-emerald-700 text-white shadow-[0_10px_24px_rgba(4,120,87,0.18)]"
                  : "text-emerald-950/52 hover:bg-emerald-950/5 hover:text-emerald-950 dark:text-white/48 dark:hover:bg-white/6 dark:hover:text-white",
              )}
              aria-current={selected ? "page" : undefined}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={() => setProfileOpen(true)}
        className="mt-auto flex w-full items-center gap-3 rounded-2xl bg-emerald-950 p-4 text-left text-white"
      >
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
      </button>
    </>
  );

  return (
    <main className="min-h-screen bg-[#f2f4f0] text-foreground dark:bg-[#06100e]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-emerald-950/8 bg-[#fbfaf5] p-4 dark:border-white/8 dark:bg-[#081714] lg:flex">
        {navigation()}
      </aside>
      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            className="fixed inset-0 z-50 bg-emerald-950/55 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          >
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="relative flex h-full w-[min(19rem,86vw)] flex-col bg-[#fbfaf5] p-4 dark:bg-[#081714]"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-emerald-950/5 dark:bg-white/7"
                aria-label="Tutup navigasi"
              >
                <X className="size-4" />
              </button>
              {navigation(true)}
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
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
                  {title}
                </p>
                <p className="mt-1 hidden text-xs text-emerald-950/42 dark:text-white/40 sm:block">
                  {subtitle}
                </p>
              </div>
            </div>
            <div className="relative flex items-center gap-2">
              {actions}
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
                      <p className="mt-0.5 truncate text-xs opacity-40">
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
        {children}
      </div>
    </main>
  );
}
