"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Eye,
  Search,
  ShieldCheck,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminPageShell } from "@/components/admin-page-shell";
import { useAppNotifications } from "@/components/notification-root";
import { cn } from "@/lib/utils";

type VerificationStatus = "WAITING" | "VERIFIED" | "REJECTED";
type Payment = {
  id: string;
  booking: string;
  guest: string;
  villa: string;
  amount: number;
  bank: string;
  account: string;
  transferAt: string;
  uploadedAt: string;
  status: VerificationStatus;
  proofId: string | null;
  reviewable: boolean;
  note?: string;
};

type PaymentTransactionApi = {
  id: string;
  bookingCode: string;
  guestName: string;
  villaName: string;
  method: string;
  provider: string;
  amount: number;
  status: string;
  senderName: string;
  senderBank: string;
  transferDate: string | null;
  proofId: string | null;
  proofStatus: "PENDING" | "VERIFIED" | "REJECTED" | null;
  paidAt: string | null;
  createdAt: string;
};

const statusMeta: Record<
  VerificationStatus,
  { label: string; icon: typeof Clock3; className: string }
> = {
  WAITING: {
    label: "Menunggu verifikasi",
    icon: Clock3,
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-300/12 dark:text-amber-200",
  },
  VERIFIED: {
    label: "Terverifikasi",
    icon: CheckCircle2,
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-300/12 dark:text-emerald-200",
  },
  REJECTED: {
    label: "Ditolak",
    icon: XCircle,
    className:
      "bg-rose-100 text-rose-700 dark:bg-rose-300/12 dark:text-rose-200",
  },
};

const money = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function toPaymentItem(transaction: PaymentTransactionApi): Payment {
  const status: VerificationStatus =
    transaction.proofStatus === "VERIFIED" || transaction.status === "PAID"
      ? "VERIFIED"
      : transaction.proofStatus === "REJECTED" || transaction.status === "FAILED"
        ? "REJECTED"
        : "WAITING";
  const reviewable = transaction.proofStatus === "PENDING";
  return {
    id: transaction.id,
    booking: transaction.bookingCode,
    guest: transaction.guestName,
    villa: transaction.villaName,
    amount: transaction.amount,
    bank: transaction.senderBank || transaction.method || transaction.provider,
    account: transaction.senderName || transaction.guestName,
    transferAt: formatPaymentDate(
      transaction.transferDate || transaction.paidAt || transaction.createdAt,
    ),
    uploadedAt: formatPaymentDate(transaction.createdAt),
    status,
    proofId: transaction.proofId,
    reviewable,
    note: reviewable
      ? undefined
      : status === "WAITING"
        ? "Menunggu user mengunggah bukti pembayaran."
        : undefined,
  };
}

function formatPaymentDate(value: string) {
  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value,
  );
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: /^\d{4}-\d{2}-\d{2}$/.test(value) ? undefined : "short",
  }).format(date);
}

export default function PaymentVerificationPage() {
  const reduceMotion = useReducedMotion();
  const { notify } = useAppNotifications();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | VerificationStatus>("ALL");
  const [selected, setSelected] = useState<Payment | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/admin/payments/transactions?limit=100&sort=newest", {
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("PAYMENT_SYNC_FAILED");
        return (await response.json()) as {
          transactions?: PaymentTransactionApi[];
        };
      })
      .then((payload) => {
        const livePayments = (payload.transactions ?? []).map(toPaymentItem);
        setPayments(livePayments);
        const bookingCode = new URLSearchParams(window.location.search).get(
          "booking",
        );
        setSelected(
          livePayments.find(
            (payment) =>
              bookingCode &&
              payment.booking.toLowerCase() === bookingCode.toLowerCase(),
          ) ?? livePayments[0] ?? null,
        );
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        notify({
          title: "Data pembayaran gagal dimuat",
          description: "Periksa koneksi PostgreSQL lalu muat ulang halaman.",
          variant: "warning",
        });
      });
    return () => controller.abort();
  }, [notify]);

  useEffect(() => {
    const bookingCode = new URLSearchParams(window.location.search).get(
      "booking",
    );
    if (!bookingCode) return;
    const match = payments.find(
      (payment) => payment.booking.toLowerCase() === bookingCode.toLowerCase(),
    );
    if (!match) return;
    setSelected(match);
    setQuery(match.booking);
  }, [payments]);

  const visible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("id-ID");
    return payments.filter(
      (item) =>
        (!normalized ||
          `${item.booking} ${item.guest} ${item.villa} ${item.bank}`
            .toLocaleLowerCase("id-ID")
            .includes(normalized)) &&
        (filter === "ALL" || item.status === filter),
    );
  }, [filter, payments, query]);

  const updateStatus = async (status: VerificationStatus) => {
    if (!selected) return;
    if (!selected.reviewable || !selected.proofId) {
      notify({
        title: "Bukti pembayaran belum tersedia",
        description: "Tunggu user mengunggah bukti transfer sebelum diverifikasi.",
        variant: "warning",
      });
      return;
    }
    const response = await fetch(
      `/api/admin/payments/${encodeURIComponent(selected.proofId)}/manual-confirmation`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: status === "VERIFIED" ? "VERIFY" : "REJECT",
          reason:
            status === "REJECTED"
              ? "Bukti pembayaran membutuhkan konfirmasi ulang dari tamu."
              : null,
        }),
      },
    );
    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;
    if (!response.ok) {
      notify({
        title: "Status pembayaran gagal diperbarui",
        description: payload?.message || "Silakan coba kembali.",
        variant: "warning",
      });
      return;
    }
    const updated = {
      ...selected,
      status,
      reviewable: false,
      note:
        status === "REJECTED"
          ? "Bukti pembayaran membutuhkan konfirmasi ulang dari tamu."
          : undefined,
    };
    setPayments((items) =>
      items.map((item) => (item.id === selected.id ? updated : item)),
    );
    setSelected(updated);
    notify({
      title:
        status === "VERIFIED"
          ? "Pembayaran diverifikasi"
          : "Pembayaran ditolak",
      description: `${selected.booking} diperbarui dan tamu akan menerima notifikasi.`,
      variant: status === "VERIFIED" ? "success" : "warning",
    });
  };

  const waiting = payments.filter((item) => item.status === "WAITING").length;
  const verifiedValue = payments
    .filter((item) => item.status === "VERIFIED")
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <AdminPageShell
      title="Verifikasi pembayaran"
      subtitle="Periksa transfer manual dan rekonsiliasi transaksi"
      active="Pembayaran"
    >
      <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        <motion.div
          initial={
            reduceMotion ? false : { opacity: 0, y: 16, filter: "blur(8px)" }
          }
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-amber-700 dark:bg-amber-300/10 dark:text-amber-200">
            <ShieldCheck className="size-3.5" /> Finance desk
          </span>
          <h1 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
            Bukti pembayaran
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-950/48 dark:text-white/46">
            Bandingkan nominal, rekening pengirim, dan waktu transfer sebelum
            mengonfirmasi booking.
          </p>
        </motion.div>

        <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric
            label="Menunggu"
            value={String(waiting)}
            helper="Perlu tindakan"
            icon={Clock3}
            tone="amber"
          />
          <Metric
            label="Terverifikasi"
            value={String(
              payments.filter((item) => item.status === "VERIFIED").length,
            )}
            helper="Bukti valid"
            icon={CheckCircle2}
            tone="emerald"
          />
          <Metric
            label="Nilai terverifikasi"
            value={money.format(verifiedValue)}
            helper="Hari ini"
            icon={CircleDollarSign}
            tone="sky"
          />
          <Metric
            label="Ditolak"
            value={String(
              payments.filter((item) => item.status === "REJECTED").length,
            )}
            helper="Perlu unggah ulang"
            icon={AlertTriangle}
            tone="rose"
          />
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="overflow-hidden rounded-[1.7rem] border border-emerald-950/8 bg-white/68 dark:border-white/8 dark:bg-white/[0.045]">
            <div className="flex flex-col gap-3 border-b border-emerald-950/8 p-4 dark:border-white/8 sm:flex-row sm:p-5">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 opacity-35" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  type="search"
                  placeholder="Cari booking, tamu, villa, bank..."
                  className="h-11 w-full rounded-xl border border-emerald-950/10 bg-white/70 pl-10 pr-4 text-sm outline-none dark:border-white/10 dark:bg-white/6"
                />
              </div>
              <label className="relative">
                <span className="sr-only">Filter status</span>
                <select
                  value={filter}
                  onChange={(event) =>
                    setFilter(event.target.value as typeof filter)
                  }
                  className="h-11 appearance-none rounded-xl border border-emerald-950/10 bg-white/70 pl-3 pr-9 text-xs font-semibold outline-none dark:border-white/10 dark:bg-[#12231f]"
                >
                  <option value="ALL">Semua status</option>
                  {Object.entries(statusMeta).map(([value, meta]) => (
                    <option key={value} value={value}>
                      {meta.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 opacity-40" />
              </label>
            </div>
            <div className="divide-y divide-emerald-950/7 dark:divide-white/7">
              {visible.map((item, index) => (
                <PaymentRow
                  key={item.id}
                  item={item}
                  active={selected?.id === item.id}
                  delay={reduceMotion ? 0 : index * 0.035}
                  onClick={() => setSelected(item)}
                />
              ))}
              {!visible.length ? (
                <div className="grid min-h-64 place-items-center p-6 text-center">
                  <div>
                    <Search className="mx-auto size-6 opacity-30" />
                    <p className="mt-3 font-semibold">
                      Pembayaran tidak ditemukan
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <AnimatePresence mode="wait">
            {selected ? (
              <VerificationPanel
                key={selected.id}
                item={selected}
                reduceMotion={Boolean(reduceMotion)}
                onVerify={() => void updateStatus("VERIFIED")}
                onReject={() => void updateStatus("REJECTED")}
              />
            ) : (
              <div className="grid min-h-96 place-items-center rounded-[1.7rem] border border-dashed border-emerald-950/12 text-sm opacity-45 dark:border-white/12">
                Pilih pembayaran untuk diperiksa
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AdminPageShell>
  );
}

function PaymentRow({
  item,
  active,
  delay,
  onClick,
}: {
  item: Payment;
  active: boolean;
  delay: number;
  onClick: () => void;
}) {
  const meta = statusMeta[item.status];
  const Icon = meta.icon;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className={cn(
        "grid w-full gap-3 p-4 text-left transition sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5",
        active
          ? "bg-emerald-100/65 dark:bg-emerald-300/7"
          : "hover:bg-emerald-950/[0.02] dark:hover:bg-white/[0.02]",
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">
            {item.booking}
          </p>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[0.55rem] font-bold uppercase",
              meta.className,
            )}
          >
            <Icon className="size-3" />
            {meta.label}
          </span>
        </div>
        <p className="mt-2 truncate text-sm font-semibold">
          {item.guest} · {item.villa}
        </p>
        <p className="mt-1 text-xs text-emerald-950/38 dark:text-white/36">
          {item.bank} · diunggah {item.uploadedAt}
        </p>
      </div>
      <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
        <p className="text-sm font-bold">{money.format(item.amount)}</p>
        <Eye className="size-4 text-emerald-700 sm:ml-auto sm:mt-2 dark:text-emerald-300" />
      </div>
    </motion.button>
  );
}

function VerificationPanel({
  item,
  reduceMotion,
  onVerify,
  onReject,
}: {
  item: Payment;
  reduceMotion: boolean;
  onVerify: () => void;
  onReject: () => void;
}) {
  const meta = statusMeta[item.status];
  return (
    <motion.aside
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      className="h-fit overflow-hidden rounded-[1.7rem] border border-emerald-950/8 bg-white/68 dark:border-white/8 dark:bg-white/[0.045] xl:sticky xl:top-24"
    >
      <div className="border-b border-emerald-950/8 p-5 dark:border-white/8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-300">
              {item.reviewable ? "Bukti transfer" : "Status pembayaran"}
            </p>
            <h2 className="mt-2 font-serif text-2xl font-semibold">
              {item.booking}
            </h2>
          </div>
          <span
            className={cn(
              "rounded-full px-2.5 py-1.5 text-[0.55rem] font-bold uppercase",
              meta.className,
            )}
          >
            {meta.label}
          </span>
        </div>
      </div>
      <div className="p-5">
        <div className="rounded-2xl bg-[linear-gradient(145deg,#eef7ff,#ffffff)] p-5 text-slate-800 shadow-inner dark:bg-[linear-gradient(145deg,#132b32,#10231e)] dark:text-white">
          <div className="flex items-center justify-between">
            <span className="text-lg font-black tracking-tight">
              {item.bank}
            </span>
            <CreditCard className="size-5 opacity-45" />
          </div>
          <p className="mt-7 text-[0.6rem] uppercase tracking-[0.14em] opacity-45">
            {item.reviewable ? "Transfer dilaporkan" : "Menunggu bukti pembayaran"}
          </p>
          <p className="mt-1 text-2xl font-bold">{money.format(item.amount)}</p>
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-current/10 pt-4 text-xs">
            <div>
              <p className="opacity-45">Pengirim</p>
              <p className="mt-1 font-bold">{item.account}</p>
            </div>
            <div className="text-right">
              <p className="opacity-45">Waktu</p>
              <p className="mt-1 font-bold">{item.transferAt}</p>
            </div>
          </div>
        </div>
        <div className="mt-5 space-y-3 text-sm">
          <Info label="Nama tamu" value={item.guest} />
          <Info label="Villa" value={item.villa} />
          <Info label="Nominal tagihan" value={money.format(item.amount)} />
        </div>
        {item.note ? (
          <div className="mt-5 rounded-xl bg-rose-50 p-3 text-xs leading-5 text-rose-700 dark:bg-rose-300/8 dark:text-rose-200">
            {item.note}
          </div>
        ) : null}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onReject}
            disabled={!item.reviewable}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-rose-500/20 text-sm font-bold text-rose-600 dark:text-rose-300"
          >
            <X className="size-4" /> Tolak
          </button>
          <button
            type="button"
            onClick={onVerify}
            disabled={!item.reviewable}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald-700 text-sm font-bold text-white"
          >
            <Check className="size-4" /> Verifikasi
          </button>
        </div>
        <p className="mt-3 text-center text-[0.62rem] leading-4 opacity-38">
          {item.reviewable
            ? "Aksi akan memperbarui booking untuk Receptionist dan Finance."
            : "User sudah tercatat, tetapi bukti transfer belum diunggah."}
        </p>
      </div>
    </motion.aside>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-emerald-950/6 pb-3 dark:border-white/6">
      <span className="text-emerald-950/42 dark:text-white/40">{label}</span>
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
  icon: typeof Clock3;
  tone: "amber" | "emerald" | "sky" | "rose";
}) {
  const colors = {
    amber:
      "bg-amber-100 text-amber-700 dark:bg-amber-300/10 dark:text-amber-200",
    emerald:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200",
    sky: "bg-sky-100 text-sky-700 dark:bg-sky-300/10 dark:text-sky-200",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-300/10 dark:text-rose-200",
  };
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-emerald-950/8 bg-white/66 p-4 dark:border-white/8 dark:bg-white/[0.045] sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold opacity-42">{label}</p>
          <p className="mt-2 truncate text-xl font-semibold sm:text-2xl">
            {value}
          </p>
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
