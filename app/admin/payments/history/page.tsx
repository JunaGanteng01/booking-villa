"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Download,
  Eye,
  RefreshCcw,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminPageShell } from "@/components/admin-page-shell";
import { useAppNotifications } from "@/components/notification-root";
import { cn } from "@/lib/utils";

type TransactionStatus = "SUCCESS" | "PENDING" | "FAILED" | "REFUNDED";
type Transaction = {
  id: string;
  booking: string;
  guest: string;
  date: string;
  method: string;
  provider: string;
  reference: string;
  amount: number;
  fee: number;
  status: TransactionStatus;
};

const initialTransactions: Transaction[] = [
  {
    id: "TRX-20260714-3814",
    booking: "VLK-260823-1482",
    guest: "Maya Putri",
    date: "14 Jul 2026, 09.42",
    method: "Transfer bank",
    provider: "BCA",
    reference: "BCA-109238147",
    amount: 21312000,
    fee: 0,
    status: "PENDING",
  },
  {
    id: "TRX-20260714-3788",
    booking: "VLK-260902-1519",
    guest: "Rizky Ananda",
    date: "14 Jul 2026, 08.18",
    method: "Kartu kredit",
    provider: "Midtrans",
    reference: "MTR-88412051",
    amount: 29400000,
    fee: 426300,
    status: "SUCCESS",
  },
  {
    id: "TRX-20260713-3711",
    booking: "VLK-260812-1441",
    guest: "Daniel Wijaya",
    date: "13 Jul 2026, 17.52",
    method: "Virtual account",
    provider: "Midtrans",
    reference: "VA-701239482",
    amount: 9912000,
    fee: 5000,
    status: "SUCCESS",
  },
  {
    id: "TRX-20260713-3692",
    booking: "VLK-260819-1467",
    guest: "Sofia Laurent",
    date: "13 Jul 2026, 12.15",
    method: "Kartu kredit",
    provider: "Stripe",
    reference: "pi_3R82villaku",
    amount: 16352000,
    fee: 474008,
    status: "FAILED",
  },
  {
    id: "TRX-20260712-3601",
    booking: "VLK-260730-1398",
    guest: "Keiko Tanaka",
    date: "12 Jul 2026, 10.02",
    method: "Kartu kredit",
    provider: "Stripe",
    reference: "pi_3R71villaku",
    amount: 25760000,
    fee: 747040,
    status: "SUCCESS",
  },
  {
    id: "TRX-20260711-3548",
    booking: "VLK-260725-1374",
    guest: "Nadia Rahman",
    date: "11 Jul 2026, 15.28",
    method: "Transfer bank",
    provider: "Mandiri",
    reference: "MDR-22841094",
    amount: 20496000,
    fee: 0,
    status: "REFUNDED",
  },
];

const statusMeta: Record<
  TransactionStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  SUCCESS: {
    label: "Berhasil",
    icon: CheckCircle2,
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-300/12 dark:text-emerald-200",
  },
  PENDING: {
    label: "Diproses",
    icon: Clock3,
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-300/12 dark:text-amber-200",
  },
  FAILED: {
    label: "Gagal",
    icon: XCircle,
    className:
      "bg-rose-100 text-rose-700 dark:bg-rose-300/12 dark:text-rose-200",
  },
  REFUNDED: {
    label: "Refund",
    icon: RefreshCcw,
    className:
      "bg-violet-100 text-violet-700 dark:bg-violet-300/12 dark:text-violet-200",
  },
};

const money = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export default function TransactionHistoryPage() {
  const reduceMotion = useReducedMotion();
  const { notify } = useAppNotifications();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | TransactionStatus>("ALL");
  const [provider, setProvider] = useState("ALL");
  const [selected, setSelected] = useState<Transaction | null>(null);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return initialTransactions.filter(
      (item) =>
        (!normalized ||
          `${item.id} ${item.booking} ${item.guest} ${item.reference}`
            .toLowerCase()
            .includes(normalized)) &&
        (status === "ALL" || item.status === status) &&
        (provider === "ALL" || item.provider === provider),
    );
  }, [provider, query, status]);
  const successValue = initialTransactions
    .filter((item) => item.status === "SUCCESS")
    .reduce((sum, item) => sum + item.amount, 0);
  const refundValue = initialTransactions
    .filter((item) => item.status === "REFUNDED")
    .reduce((sum, item) => sum + item.amount, 0);

  const exportData = () =>
    notify({
      title: "Riwayat transaksi siap diekspor",
      description: `${visible.length} transaksi akan disertakan dalam laporan Finance.`,
      variant: "success",
    });

  return (
    <AdminPageShell
      title="Riwayat transaksi"
      subtitle="Audit pembayaran lintas gateway dan transfer manual"
      active="Pembayaran"
    >
      <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
              <CreditCard className="size-3.5" /> Transaction ledger
            </span>
            <h1 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Semua transaksi
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 opacity-48">
              Lacak pembayaran berhasil, proses tertunda, kegagalan gateway, dan
              pengembalian dana.
            </p>
          </motion.div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/payments"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-emerald-950/10 bg-white/70 px-4 text-sm font-bold dark:border-white/10 dark:bg-white/6"
            >
              <ShieldCheck className="size-4" /> Verifikasi bukti
            </Link>
            <button
              type="button"
              onClick={exportData}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-emerald-700 px-5 text-sm font-bold text-white"
            >
              <Download className="size-4" /> Ekspor laporan
            </button>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric
            label="Dana masuk"
            value={money.format(successValue)}
            helper="Transaksi berhasil"
            icon={ArrowDownLeft}
            tone="emerald"
          />
          <Metric
            label="Refund"
            value={money.format(refundValue)}
            helper="Dikembalikan"
            icon={ArrowUpRight}
            tone="violet"
          />
          <Metric
            label="Diproses"
            value="1"
            helper="Menunggu settlement"
            icon={Clock3}
            tone="amber"
          />
          <Metric
            label="Success rate"
            value="75%"
            helper="30 hari terakhir"
            icon={CircleDollarSign}
            tone="sky"
          />
        </div>

        <section className="mt-6 overflow-hidden rounded-[1.7rem] border border-emerald-950/8 bg-white/68 dark:border-white/8 dark:bg-white/[0.045]">
          <div className="flex flex-col gap-3 border-b border-emerald-950/8 p-4 dark:border-white/8 xl:flex-row xl:p-5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 opacity-35" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari ID transaksi, booking, tamu, referensi..."
                className="h-11 w-full rounded-xl border border-emerald-950/10 bg-white/70 pl-10 pr-4 text-sm outline-none dark:border-white/10 dark:bg-white/6"
              />
            </div>
            <Filter
              label="Status transaksi"
              value={status}
              onChange={(value) => setStatus(value as typeof status)}
              options={[
                { value: "ALL", label: "Semua status" },
                ...Object.entries(statusMeta).map(([value, meta]) => ({
                  value,
                  label: meta.label,
                })),
              ]}
            />
            <Filter
              label="Provider"
              value={provider}
              onChange={setProvider}
              options={[
                { value: "ALL", label: "Semua provider" },
                ...Array.from(
                  new Set(initialTransactions.map((item) => item.provider)),
                ).map((item) => ({ value: item, label: item })),
              ]}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="bg-emerald-950/[0.025] text-left text-[0.62rem] font-bold uppercase tracking-[0.13em] opacity-40">
                  <th className="px-5 py-3.5">Transaksi</th>
                  <th className="px-4 py-3.5">Booking & tamu</th>
                  <th className="px-4 py-3.5">Metode</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Nominal</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item, index) => (
                  <TransactionRow
                    key={item.id}
                    item={item}
                    delay={reduceMotion ? 0 : index * 0.035}
                    onView={() => setSelected(item)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {!visible.length ? (
            <div className="grid min-h-64 place-items-center border-t border-emerald-950/8 p-5 text-center dark:border-white/8">
              <p className="font-semibold">Transaksi tidak ditemukan</p>
            </div>
          ) : null}
        </section>
      </div>
      <AnimatePresence>
        {selected ? (
          <TransactionModal
            item={selected}
            reduceMotion={Boolean(reduceMotion)}
            onClose={() => setSelected(null)}
          />
        ) : null}
      </AnimatePresence>
    </AdminPageShell>
  );
}

function TransactionRow({
  item,
  delay,
  onView,
}: {
  item: Transaction;
  delay: number;
  onView: () => void;
}) {
  const meta = statusMeta[item.status];
  const Icon = meta.icon;
  return (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="border-t border-emerald-950/7 dark:border-white/7"
    >
      <td className="px-5 py-4">
        <p className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">
          {item.id}
        </p>
        <p className="mt-1 text-[0.62rem] opacity-38">{item.date}</p>
      </td>
      <td className="px-4 py-4">
        <p className="text-sm font-semibold">{item.guest}</p>
        <p className="mt-1 text-xs opacity-38">{item.booking}</p>
      </td>
      <td className="px-4 py-4">
        <p className="text-xs font-semibold">{item.method}</p>
        <p className="mt-1 text-[0.62rem] opacity-38">
          {item.provider} · {item.reference}
        </p>
      </td>
      <td className="px-4 py-4">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[0.58rem] font-bold uppercase",
            meta.className,
          )}
        >
          <Icon className="size-3" />
          {meta.label}
        </span>
      </td>
      <td className="px-4 py-4">
        <p className="text-sm font-bold">{money.format(item.amount)}</p>
        <p className="mt-1 text-[0.62rem] opacity-38">
          Fee {money.format(item.fee)}
        </p>
      </td>
      <td className="px-5 py-4 text-right">
        <button
          type="button"
          onClick={onView}
          className="grid size-9 place-items-center rounded-xl border border-emerald-950/8 text-emerald-700 dark:border-white/8 dark:text-emerald-300"
          aria-label={`Lihat transaksi ${item.id}`}
        >
          <Eye className="size-4" />
        </button>
      </td>
    </motion.tr>
  );
}

function TransactionModal({
  item,
  reduceMotion,
  onClose,
}: {
  item: Transaction;
  reduceMotion: boolean;
  onClose: () => void;
}) {
  const meta = statusMeta[item.status];
  return (
    <motion.div
      className="fixed inset-0 z-[70] grid place-items-center bg-emerald-950/60 p-4 backdrop-blur-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.section
        role="dialog"
        aria-modal="true"
        initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        className="w-full max-w-lg rounded-[1.8rem] bg-[#fffdf8] p-6 shadow-2xl dark:bg-[#0c1c18]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <span
              className={cn(
                "rounded-full px-2.5 py-1.5 text-[0.58rem] font-bold uppercase",
                meta.className,
              )}
            >
              {meta.label}
            </span>
            <h2 className="mt-4 font-serif text-2xl font-semibold">
              Detail transaksi
            </h2>
            <p className="mt-1 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">
              {item.id}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full bg-emerald-950/5 dark:bg-white/7"
            aria-label="Tutup"
          >
            <XCircle className="size-4" />
          </button>
        </div>
        <div className="mt-6 rounded-2xl bg-emerald-950 p-5 text-white">
          <p className="text-xs text-white/45">Nominal transaksi</p>
          <p className="mt-2 text-3xl font-semibold">
            {money.format(item.amount)}
          </p>
          <p className="mt-2 text-xs text-white/45">
            Biaya provider {money.format(item.fee)} · netto{" "}
            {money.format(item.amount - item.fee)}
          </p>
        </div>
        <div className="mt-5 space-y-3">
          <Info label="Booking" value={item.booking} />
          <Info label="Tamu" value={item.guest} />
          <Info label="Metode" value={`${item.method} · ${item.provider}`} />
          <Info label="Referensi" value={item.reference} />
          <Info label="Waktu" value={item.date} />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 min-h-11 w-full rounded-full bg-emerald-700 text-sm font-bold text-white"
        >
          Selesai
        </button>
      </motion.section>
    </motion.div>
  );
}

function Filter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 appearance-none rounded-xl border border-emerald-950/10 bg-white/70 pl-3 pr-9 text-xs font-semibold outline-none dark:border-white/10 dark:bg-[#12231f]"
      >
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
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-emerald-950/7 pb-3 text-sm dark:border-white/7">
      <span className="opacity-42">{label}</span>
      <span className="text-right font-semibold">{value}</span>
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
  icon: typeof CircleDollarSign;
  tone: "emerald" | "violet" | "amber" | "sky";
}) {
  const colors = {
    emerald:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200",
    violet:
      "bg-violet-100 text-violet-700 dark:bg-violet-300/10 dark:text-violet-200",
    amber:
      "bg-amber-100 text-amber-700 dark:bg-amber-300/10 dark:text-amber-200",
    sky: "bg-sky-100 text-sky-700 dark:bg-sky-300/10 dark:text-sky-200",
  };
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-emerald-950/8 bg-white/66 p-4 dark:border-white/8 dark:bg-white/[0.045] sm:p-5"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold opacity-42">{label}</p>
          <p className="mt-2 truncate text-xl font-semibold">{value}</p>
          <p className="mt-1 text-[0.65rem] opacity-35">{helper}</p>
        </div>
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl",
            colors[tone],
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
    </motion.div>
  );
}
