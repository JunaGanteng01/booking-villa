"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  CalendarDays,
  ChevronDown,
  Crown,
  Download,
  Eye,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AdminPageShell } from "@/components/admin-page-shell";
import { useAppNotifications } from "@/components/notification-root";
import { cn } from "@/lib/utils";

type Tier = "EMERALD" | "GOLD" | "MEMBER";
type Customer = {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string;
  country: string;
  tier: Tier;
  bookings: number;
  nights: number;
  spent: number;
  lastStay: string | null;
  joinedAt: string;
  verified: boolean;
  reviews: number;
};
type CustomerSummary = {
  totalCustomers: number;
  verifiedCustomers: number;
  activeCustomers: number;
  emeraldCustomers: number;
  totalBookings: number;
  totalSpent: number;
};

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

export default function CustomerListPage() {
  const reduceMotion = useReducedMotion();
  const { notify } = useAppNotifications();
  const [query, setQuery] = useState("");
  const [tier, setTier] = useState<"ALL" | Tier>("ALL");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [summary, setSummary] = useState<CustomerSummary | null>(null);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const search = new URLSearchParams(window.location.search).get("search");
    if (search) setQuery(search);
  }, []);

  const refreshCustomers = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (query.trim()) params.set("search", query.trim());
      if (tier !== "ALL") params.set("tier", tier);
      const response = await fetch(`/api/admin/customers?${params}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        customers?: Customer[];
        summary?: CustomerSummary;
        message?: string;
      };
      if (!response.ok || !payload.customers || !payload.summary) {
        throw new Error(payload.message || "Data customer belum dapat dimuat.");
      }
      setCustomers(payload.customers);
      setSummary(payload.summary);
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Data customer belum dapat dimuat.",
      );
    } finally {
      setLoading(false);
    }
  }, [query, tier]);

  useEffect(() => {
    setLoading(true);
    const timeout = window.setTimeout(() => void refreshCustomers(), 250);
    const onFocus = () => void refreshCustomers();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshCustomers]);

  const openCustomer = async (customer: Customer) => {
    setDetailLoading(true);
    setSelected(customer);
    try {
      const response = await fetch(
        `/api/admin/customers/${encodeURIComponent(customer.id)}`,
        { cache: "no-store" },
      );
      const payload = (await response.json()) as {
        customer?: Customer;
        message?: string;
      };
      if (!response.ok || !payload.customer) {
        throw new Error(payload.message || "Detail customer belum dapat dimuat.");
      }
      setSelected(payload.customer);
    } catch (cause) {
      notify({
        title: "Detail customer gagal dimuat",
        description:
          cause instanceof Error ? cause.message : "Silakan coba kembali.",
        variant: "error",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const exportCustomers = () => {
    if (!customers.length) {
      notify({
        title: "Tidak ada data untuk diekspor",
        description: "Ubah filter atau tunggu data customer selesai dimuat.",
        variant: "error",
      });
      return;
    }
    downloadCsv(
      "villaku-customers.csv",
      [
        [
          "Nama",
          "Email",
          "Telepon",
          "Tier",
          "Booking",
          "Malam",
          "Nilai",
          "Terverifikasi",
        ],
        ...customers.map((customer) => [
          customer.name,
          customer.email,
          customer.phone,
          customer.tier,
          customer.bookings,
          customer.nights,
          customer.spent,
          customer.verified ? "Ya" : "Belum",
        ]),
      ],
    );
    notify({
      title: "Data customer diunduh",
      description: `${customers.length} customer berhasil diekspor dari PostgreSQL.`,
      variant: "success",
    });
  };

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
              <Sparkles className="size-3.5" /> PostgreSQL guest relations
            </span>
            <h1 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Daftar pelanggan
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 opacity-48">
              Riwayat booking, pembayaran aktual, status verifikasi, dan tier
              customer kini berasal dari database yang sama.
            </p>
          </motion.div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void refreshCustomers()}
              aria-label="Muat ulang customer"
              className="grid size-11 place-items-center rounded-full border border-emerald-950/10 bg-white/72 dark:border-white/10 dark:bg-white/6"
            >
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            </button>
            <button
              type="button"
              onClick={exportCustomers}
              className="inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-emerald-700 px-5 text-sm font-bold text-white"
            >
              <Download className="size-4" /> Ekspor customer
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-rose-300/40 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-300/8 dark:text-rose-200">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <div
          className={cn(
            "mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4",
            loading && !summary && "animate-pulse",
          )}
        >
          <Metric
            label="Total customer"
            value={String(summary?.totalCustomers ?? 0)}
            helper="Akun dan tamu booking"
            icon={Users}
            tone="emerald"
          />
          <Metric
            label="Customer aktif"
            value={String(summary?.activeCustomers ?? 0)}
            helper="Memiliki booking"
            icon={UserCheck}
            tone="sky"
          />
          <Metric
            label="Emerald member"
            value={String(summary?.emeraldCustomers ?? 0)}
            helper="Nilai ≥ Rp100 juta"
            icon={Crown}
            tone="amber"
          />
          <Metric
            label="Customer value"
            value={formatRupiahCompact(summary?.totalSpent ?? 0)}
            helper="Pembayaran diterima"
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
                placeholder="Cari nama, email, atau telepon..."
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

          <div className="border-b border-emerald-950/8 px-5 py-3 text-xs opacity-45 dark:border-white/8">
            {loading ? "Memuat customer..." : `${customers.length} customer ditampilkan`}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr className="bg-emerald-950/[0.025] text-left text-[0.62rem] font-bold uppercase tracking-[0.13em] opacity-40">
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Tier</th>
                  <th className="px-4 py-3.5">Riwayat stay</th>
                  <th className="px-4 py-3.5">Pembayaran</th>
                  <th className="px-4 py-3.5">Stay terakhir</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((item, index) => (
                  <CustomerRow
                    key={item.id}
                    item={item}
                    delay={reduceMotion ? 0 : index * 0.035}
                    onOpen={() => void openCustomer(item)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 p-4 md:hidden">
            {customers.map((item) => (
              <CustomerCard
                key={item.id}
                item={item}
                onOpen={() => void openCustomer(item)}
              />
            ))}
          </div>

          {!loading && !customers.length ? (
            <div className="grid min-h-64 place-items-center border-t border-emerald-950/8 p-5 dark:border-white/8">
              <p className="font-semibold">Customer tidak ditemukan</p>
            </div>
          ) : null}
        </section>
      </div>

      <AnimatePresence>
        {selected ? (
          <CustomerDetail
            customer={selected}
            loading={detailLoading}
            onClose={() => setSelected(null)}
          />
        ) : null}
      </AnimatePresence>
    </AdminPageShell>
  );
}

function CustomerRow({
  item,
  delay,
  onOpen,
}: {
  item: Customer;
  delay: number;
  onOpen: () => void;
}) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="border-t border-emerald-950/7 dark:border-white/7"
    >
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <Avatar customer={item} />
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
        <TierBadge tier={item.tier} />
      </td>
      <td className="px-4 py-4">
        <p className="text-xs font-semibold">
          {item.bookings} booking · {item.nights} malam
        </p>
        <p className="mt-1 text-[0.62rem] opacity-38">
          Bergabung {formatDate(item.joinedAt)}
        </p>
      </td>
      <td className="px-4 py-4 text-sm font-bold">
        {formatRupiahCompact(item.spent)}
      </td>
      <td className="px-4 py-4">
        <p className="text-xs font-semibold">
          {item.lastStay ? formatDate(item.lastStay) : "Belum ada stay"}
        </p>
      </td>
      <td className="px-5 py-4 text-right">
        <button
          type="button"
          onClick={onOpen}
          className="grid size-9 place-items-center rounded-xl border border-emerald-950/8 text-emerald-700 dark:border-white/8 dark:text-emerald-300"
          aria-label={`Lihat ${item.name}`}
        >
          <Eye className="size-4" />
        </button>
      </td>
    </motion.tr>
  );
}

function CustomerCard({ item, onOpen }: { item: Customer; onOpen: () => void }) {
  return (
    <article className="rounded-2xl border border-emerald-950/8 bg-white/55 p-4 dark:border-white/8 dark:bg-white/[0.025]">
      <div className="flex items-center gap-3">
        <Avatar customer={item} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{item.name}</p>
          <p className="mt-1 truncate text-xs opacity-38">{item.email}</p>
        </div>
        <TierBadge tier={item.tier} />
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
          <strong>{formatRupiahCompact(item.spent)}</strong>
          <p className="mt-1 opacity-38">Dibayar</p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <a
          href={`mailto:${item.email}`}
          className="inline-flex min-h-9 flex-1 items-center justify-center gap-2 rounded-full border border-emerald-950/10 text-xs font-bold dark:border-white/10"
        >
          <Mail className="size-3.5" /> Email
        </a>
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex min-h-9 flex-1 items-center justify-center gap-2 rounded-full bg-emerald-700 text-xs font-bold text-white"
        >
          <Eye className="size-3.5" /> Detail
        </button>
      </div>
    </article>
  );
}

function CustomerDetail({
  customer,
  loading,
  onClose,
}: {
  customer: Customer;
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-[80] grid place-items-center bg-emerald-950/65 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label={`Detail customer ${customer.name}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.article
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-[#f8f7f2] p-6 text-emerald-950 shadow-2xl dark:bg-[#0d1d19] dark:text-white sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar customer={customer} large />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
                Customer profile
              </p>
              <h2 className="mt-1 font-serif text-3xl font-semibold">
                {customer.name}
              </h2>
              <div className="mt-2">
                <TierBadge tier={customer.tier} />
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail customer"
            className="grid size-10 place-items-center rounded-full border border-emerald-950/10 dark:border-white/10"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className={cn("mt-7 grid gap-3 sm:grid-cols-2", loading && "animate-pulse")}>
          <DetailItem icon={Mail} label="Email" value={customer.email} />
          <DetailItem icon={Phone} label="Telepon" value={customer.phone} />
          <DetailItem
            icon={CalendarDays}
            label="Bergabung"
            value={formatDate(customer.joinedAt)}
          />
          <DetailItem
            icon={UserCheck}
            label="Verifikasi email"
            value={customer.verified ? "Terverifikasi" : "Belum verifikasi"}
          />
        </div>

        <div className="mt-5 grid grid-cols-3 rounded-2xl bg-emerald-950/[0.045] p-4 text-center dark:bg-white/6">
          <div>
            <strong className="text-xl">{customer.bookings}</strong>
            <p className="mt-1 text-xs opacity-45">Booking</p>
          </div>
          <div>
            <strong className="text-xl">{customer.nights}</strong>
            <p className="mt-1 text-xs opacity-45">Malam</p>
          </div>
          <div>
            <strong className="text-xl">
              {formatRupiahCompact(customer.spent)}
            </strong>
            <p className="mt-1 text-xs opacity-45">Dibayar</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <a
            href={`mailto:${customer.email}`}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-emerald-700 px-5 text-sm font-bold text-white"
          >
            <Mail className="size-4" /> Kirim email
          </a>
          {customer.phone !== "-" ? (
            <a
              href={`tel:${customer.phone}`}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-emerald-950/10 px-5 text-sm font-bold dark:border-white/10"
            >
              <Phone className="size-4" /> Hubungi
            </a>
          ) : null}
        </div>
      </motion.article>
    </motion.div>
  );
}

function Avatar({ customer, large = false }: { customer: Customer; large?: boolean }) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200",
        large ? "size-14 text-sm" : "size-10",
      )}
    >
      {initials(customer.name)}
    </span>
  );
}

function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1.5 text-[0.58rem] font-bold uppercase",
        tierMeta[tier].className,
      )}
    >
      {tierMeta[tier].label}
    </span>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-emerald-950/8 p-4 dark:border-white/8">
      <Icon className="size-4 text-emerald-600" />
      <p className="mt-3 text-[0.62rem] font-bold uppercase tracking-[0.12em] opacity-40">
        {label}
      </p>
      <p className="mt-1 break-all text-sm font-semibold">{value}</p>
    </div>
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
        <span className={cn("grid size-10 place-items-center rounded-xl", colors[tone])}>
          <Icon className="size-4" />
        </span>
      </div>
    </motion.div>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatRupiahCompact(value: number) {
  if (!value) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function downloadCsv(fileName: string, rows: Array<Array<string | number>>) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");
  const url = URL.createObjectURL(
    new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
