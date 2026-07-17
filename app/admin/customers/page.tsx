"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  CalendarDays,
  ChevronDown,
  Crown,
  Download,
  Eye,
  Mail,
  Search,
  Sparkles,
  Star,
  UserCheck,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminPageShell } from "@/components/admin-page-shell";
import { useAppNotifications } from "@/components/notification-root";
import { cn } from "@/lib/utils";

type Tier = "EMERALD" | "GOLD" | "MEMBER";
type Customer = {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  country: string;
  tier: Tier;
  bookings: number;
  nights: number;
  spent: number;
  lastStay: string;
  joined: string;
  verified: boolean;
};

const customers: Customer[] = [
  {
    id: "cus-1001",
    name: "Maya Putri",
    initials: "MP",
    email: "maya@villaku.test",
    phone: "+62 812 3456 7890",
    country: "Indonesia",
    tier: "EMERALD",
    bookings: 8,
    nights: 31,
    spent: 148400000,
    lastStay: "23 Agu 2026",
    joined: "12 Jan 2025",
    verified: true,
  },
  {
    id: "cus-1002",
    name: "Rizky Ananda",
    initials: "RA",
    email: "rizky@example.com",
    phone: "+62 811 9922 401",
    country: "Indonesia",
    tier: "GOLD",
    bookings: 5,
    nights: 18,
    spent: 87200000,
    lastStay: "2 Sep 2026",
    joined: "8 Mar 2025",
    verified: true,
  },
  {
    id: "cus-1003",
    name: "Sofia Laurent",
    initials: "SL",
    email: "sofia@example.com",
    phone: "+33 6 12 34 56 78",
    country: "France",
    tier: "GOLD",
    bookings: 4,
    nights: 15,
    spent: 72350000,
    lastStay: "19 Agu 2026",
    joined: "22 Apr 2025",
    verified: true,
  },
  {
    id: "cus-1004",
    name: "Daniel Wijaya",
    initials: "DW",
    email: "daniel@example.com",
    phone: "+62 857 2020 881",
    country: "Indonesia",
    tier: "MEMBER",
    bookings: 2,
    nights: 6,
    spent: 23800000,
    lastStay: "12 Agu 2026",
    joined: "2 Feb 2026",
    verified: true,
  },
  {
    id: "cus-1005",
    name: "Keiko Tanaka",
    initials: "KT",
    email: "keiko@example.jp",
    phone: "+81 90 1234 5678",
    country: "Japan",
    tier: "EMERALD",
    bookings: 9,
    nights: 38,
    spent: 181900000,
    lastStay: "30 Jul 2026",
    joined: "14 Nov 2024",
    verified: true,
  },
  {
    id: "cus-1006",
    name: "Nadia Rahman",
    initials: "NR",
    email: "nadia@example.com",
    phone: "+60 12 882 9120",
    country: "Malaysia",
    tier: "MEMBER",
    bookings: 1,
    nights: 3,
    spent: 20496000,
    lastStay: "25 Jul 2026",
    joined: "18 Jun 2026",
    verified: false,
  },
];

const tierMeta: Record<Tier, { label: string; className: string }> = {
  EMERALD: {
    label: "Emerald",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-300/12 dark:text-emerald-200",
  },
  GOLD: {
    label: "Gold",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-300/12 dark:text-amber-200",
  },
  MEMBER: {
    label: "Member",
    className:
      "bg-slate-200/70 text-slate-600 dark:bg-white/8 dark:text-white/55",
  },
};
const money = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  notation: "compact",
  maximumFractionDigits: 1,
});

export default function CustomerListPage() {
  const reduceMotion = useReducedMotion();
  const { notify } = useAppNotifications();
  const [query, setQuery] = useState("");
  const [tier, setTier] = useState<"ALL" | Tier>("ALL");

  useEffect(() => {
    const search = new URLSearchParams(window.location.search).get("search");
    if (search) setQuery(search);
  }, []);
  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return customers.filter(
      (item) =>
        (!normalized ||
          `${item.name} ${item.email} ${item.phone} ${item.country}`
            .toLowerCase()
            .includes(normalized)) &&
        (tier === "ALL" || item.tier === tier),
    );
  }, [query, tier]);
  const totalSpent = customers.reduce((sum, item) => sum + item.spent, 0);

  return (
    <AdminPageShell
      title="Manajemen customer"
      subtitle="Kenali tamu dan bangun hubungan jangka panjang"
      active="Customer"
    >
      <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
              <Sparkles className="size-3.5" /> Guest relations
            </span>
            <h1 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Daftar pelanggan
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 opacity-48">
              Pantau riwayat stay, nilai pelanggan, status verifikasi, dan
              segmentasi loyalitas setiap tamu.
            </p>
          </motion.div>
          <button
            type="button"
            onClick={() =>
              notify({
                title: "Data customer siap diekspor",
                description: `${visible.length} pelanggan masuk ke laporan.`,
                variant: "success",
              })
            }
            className="inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-emerald-700 px-5 text-sm font-bold text-white"
          >
            <Download className="size-4" /> Ekspor customer
          </button>
        </div>
        <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric
            label="Total customer"
            value="1.284"
            helper="Akun terdaftar"
            icon={Users}
            tone="emerald"
          />
          <Metric
            label="Customer aktif"
            value="892"
            helper="Stay 12 bulan"
            icon={UserCheck}
            tone="sky"
          />
          <Metric
            label="Emerald member"
            value="86"
            helper="High-value guest"
            icon={Crown}
            tone="amber"
          />
          <Metric
            label="Customer value"
            value={money.format(totalSpent)}
            helper="Data ditampilkan"
            icon={Star}
            tone="rose"
          />
        </div>
        <section className="mt-6 overflow-hidden rounded-[1.7rem] border border-emerald-950/8 bg-white/68 dark:border-white/8 dark:bg-white/[0.045]">
          <div className="flex flex-col gap-3 border-b border-emerald-950/8 p-4 dark:border-white/8 sm:flex-row sm:p-5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 opacity-35" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari nama, email, telepon, negara..."
                className="h-11 w-full rounded-xl border border-emerald-950/10 bg-white/70 pl-10 pr-4 text-sm outline-none dark:border-white/10 dark:bg-white/6"
              />
            </div>
            <label className="relative">
              <span className="sr-only">Filter tier</span>
              <select
                value={tier}
                onChange={(event) => setTier(event.target.value as typeof tier)}
                className="h-11 appearance-none rounded-xl border border-emerald-950/10 bg-white/70 pl-3 pr-9 text-xs font-semibold outline-none dark:border-white/10 dark:bg-[#12231f]"
              >
                <option value="ALL">Semua tier</option>
                {Object.entries(tierMeta).map(([value, meta]) => (
                  <option key={value} value={value}>
                    {meta.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 opacity-40" />
            </label>
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr className="bg-emerald-950/[0.025] text-left text-[0.62rem] font-bold uppercase tracking-[0.13em] opacity-40">
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Tier</th>
                  <th className="px-4 py-3.5">Riwayat stay</th>
                  <th className="px-4 py-3.5">Total value</th>
                  <th className="px-4 py-3.5">Stay berikutnya</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item, index) => (
                  <CustomerRow
                    key={item.id}
                    item={item}
                    delay={reduceMotion ? 0 : index * 0.035}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 p-4 md:hidden">
            {visible.map((item) => (
              <CustomerCard key={item.id} item={item} />
            ))}
          </div>
          {!visible.length ? (
            <div className="grid min-h-64 place-items-center border-t border-emerald-950/8 p-5 dark:border-white/8">
              <p className="font-semibold">Customer tidak ditemukan</p>
            </div>
          ) : null}
        </section>
      </div>
    </AdminPageShell>
  );
}

function CustomerRow({ item, delay }: { item: Customer; delay: number }) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="border-t border-emerald-950/7 dark:border-white/7"
    >
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
            {item.initials}
          </span>
          <div>
            <p className="text-sm font-bold">
              {item.name}
              {item.verified ? (
                <UserCheck className="ml-1.5 inline size-3.5 text-emerald-600" />
              ) : null}
            </p>
            <p className="mt-1 text-[0.62rem] opacity-38">
              {item.email} · {item.country}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <span
          className={cn(
            "rounded-full px-2.5 py-1.5 text-[0.58rem] font-bold uppercase",
            tierMeta[item.tier].className,
          )}
        >
          {tierMeta[item.tier].label}
        </span>
      </td>
      <td className="px-4 py-4">
        <p className="text-xs font-semibold">
          {item.bookings} booking · {item.nights} malam
        </p>
        <p className="mt-1 text-[0.62rem] opacity-38">
          Bergabung {item.joined}
        </p>
      </td>
      <td className="px-4 py-4 text-sm font-bold">
        {money.format(item.spent)}
      </td>
      <td className="px-4 py-4">
        <p className="text-xs font-semibold">{item.lastStay}</p>
      </td>
      <td className="px-5 py-4 text-right">
        <button
          type="button"
          className="grid size-9 place-items-center rounded-xl border border-emerald-950/8 text-emerald-700 dark:border-white/8 dark:text-emerald-300"
          aria-label={`Lihat ${item.name}`}
        >
          <Eye className="size-4" />
        </button>
      </td>
    </motion.tr>
  );
}
function CustomerCard({ item }: { item: Customer }) {
  return (
    <article className="rounded-2xl border border-emerald-950/8 bg-white/55 p-4 dark:border-white/8 dark:bg-white/[0.025]">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
          {item.initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{item.name}</p>
          <p className="mt-1 truncate text-xs opacity-38">{item.email}</p>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-1 text-[0.55rem] font-bold",
            tierMeta[item.tier].className,
          )}
        >
          {tierMeta[item.tier].label}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 border-t border-emerald-950/7 pt-3 text-center text-xs dark:border-white/7">
        <div>
          <strong>{item.bookings}</strong>
          <p className="mt-1 opacity-38">Booking</p>
        </div>
        <div>
          <strong>{item.nights}</strong>
          <p className="mt-1 opacity-38">Malam</p>
        </div>
        <div>
          <strong>{money.format(item.spent)}</strong>
          <p className="mt-1 opacity-38">Value</p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className="inline-flex min-h-9 flex-1 items-center justify-center gap-2 rounded-full border border-emerald-950/10 text-xs font-bold dark:border-white/10"
        >
          <Mail className="size-3.5" /> Email
        </button>
        <button
          type="button"
          className="inline-flex min-h-9 flex-1 items-center justify-center gap-2 rounded-full bg-emerald-700 text-xs font-bold text-white"
        >
          <Eye className="size-3.5" /> Detail
        </button>
      </div>
    </article>
  );
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
  icon: typeof Users;
  tone: "emerald" | "sky" | "amber" | "rose";
}) {
  const colors = {
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
      className="rounded-2xl border border-emerald-950/8 bg-white/66 p-4 dark:border-white/8 dark:bg-white/[0.045] sm:p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold opacity-42">{label}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
          <p className="mt-1 text-[0.65rem] opacity-35">{helper}</p>
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
